import { v4 as uuidv4 } from 'uuid';
import { db } from '@/core/db/app_database';
import { SyncQueueManager } from '@/core/sync/sync_queue_manager';
import { syncCoordinator } from '@/core/sync/sync_coordinator';
import type { Product, ProductUnit, ProductCategory, Unit, ProductBrand, ProductTypeItem, ProductBatch, Warehouse, StockLevel } from '@/types';

export class ProductRepository {
  /**
   * Get all active products for organization
   */
  public static async getAll(orgId: string): Promise<Product[]> {
    return await db.products
      .where('org_id')
      .equals(orgId)
      .and((item) => item.is_active)
      .toArray();
  }

  /**
   * Find product by ID
   */
  public static async getById(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  }

  /**
   * Fast Barcode / SKU search: looks up main product SKU and secondary unit barcodes
   */
  public static async findByBarcode(barcode: string, orgId: string): Promise<{ product: Product; unit?: ProductUnit } | null> {
    // 1. Direct SKU match
    const directProduct = await db.products
      .where('sku')
      .equals(barcode)
      .and((p) => p.org_id === orgId && p.is_active)
      .first();

    if (directProduct) {
      return { product: directProduct };
    }

    // 2. Unit barcode match
    const matchedUnit = await db.product_units
      .where('barcode')
      .equals(barcode)
      .first();

    if (matchedUnit) {
      const product = await db.products.get(matchedUnit.product_id);
      if (product && product.org_id === orgId && product.is_active) {
        return { product, unit: matchedUnit };
      }
    }

    return null;
  }

  /**
   * Search products by text query (name or sku)
   */
  public static async search(query: string, orgId: string, limit = 20): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return await db.products
      .where('org_id')
      .equals(orgId)
      .and((p) => p.is_active && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .limit(limit)
      .toArray();
  }

  /**
   * Create new product with optional secondary units and opening stock batch
   */
  public static async createProduct(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sync_status'>,
    secondaryUnits: Omit<ProductUnit, 'id' | 'product_id' | 'created_at' | 'updated_at' | 'sync_status'>[] = [],
    openingBatch?: {
      warehouse_id: string;
      batch_number: string;
      expiry_date?: string | null;
      initial_quantity: number;
      purchase_price?: number;
    } | Array<{
      warehouse_id: string;
      batch_number: string;
      expiry_date?: string | null;
      initial_quantity: number;
      purchase_price?: number;
    }>
  ): Promise<Product> {
    const now = new Date().toISOString();
    const productId = uuidv4();

    const product: Product = {
      ...productData,
      id: productId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };

    const unitsToInsert: ProductUnit[] = secondaryUnits.map((u) => ({
      ...u,
      id: uuidv4(),
      product_id: productId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    }));

    const batchList = Array.isArray(openingBatch)
      ? openingBatch
      : openingBatch
      ? [openingBatch]
      : [];

    await db.transaction('rw', [db.products, db.product_units, db.product_batches, db.stock_levels, db.sync_queue], async () => {
      await db.products.add(product);
      await SyncQueueManager.enqueue('products', productId, 'insert', product);

      if (unitsToInsert.length > 0) {
        await db.product_units.bulkAdd(unitsToInsert);
        for (const u of unitsToInsert) {
          await SyncQueueManager.enqueue('product_units', u.id, 'insert', u);
        }
      }

      // إدراج تشغيلات الصلاحية والرصيد الافتتاحي
      const warehouseTotals = new Map<string, number>();

      for (let i = 0; i < batchList.length; i++) {
        const b = batchList[i];
        if (b && b.initial_quantity > 0 && b.warehouse_id) {
          const batchId = uuidv4();
          const batchRecord: ProductBatch = {
            id: batchId,
            org_id: productData.org_id,
            product_id: productId,
            warehouse_id: b.warehouse_id,
            batch_number: b.batch_number?.trim() || `BATCH-${Date.now().toString().slice(-4)}-${i + 1}`,
            expiry_date: b.expiry_date || null,
            initial_quantity: b.initial_quantity,
            current_quantity: b.initial_quantity,
            purchase_price: b.purchase_price ?? productData.purchase_price ?? 0,
            created_at: now,
            updated_at: now,
            sync_status: 'pending',
          };
          await db.product_batches.add(batchRecord);
          await SyncQueueManager.enqueue('product_batches', batchId, 'insert', batchRecord);

          const currentTotal = warehouseTotals.get(b.warehouse_id) || 0;
          warehouseTotals.set(b.warehouse_id, currentTotal + b.initial_quantity);
        }
      }

      for (const [wId, totalQty] of warehouseTotals.entries()) {
        const stockId = `${wId}_${productId}`;
        const stockLevel: StockLevel = {
          id: stockId,
          org_id: productData.org_id,
          warehouse_id: wId,
          product_id: productId,
          quantity: totalQty,
          reserved_quantity: 0,
          available_quantity: totalQty,
          updated_at: now,
          sync_status: 'pending',
        };
        await db.stock_levels.put(stockLevel);
        await SyncQueueManager.enqueue('stock_levels', stockId, 'insert', stockLevel);
      }
    });

    // إطلاق مزامنة سحابية فورية ولحظية مع Supabase في الخلفية
    syncCoordinator.triggerSync().catch(console.error);

    return product;
  }

  /**
   * Save / Sync product batches and update stock levels
   */
  public static async saveProductBatches(
    productId: string,
    orgId: string,
    batches: Array<{
      warehouse_id: string;
      batch_number: string;
      expiry_date?: string | null;
      initial_quantity: number;
      purchase_price?: number;
    }>
  ): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', [db.product_batches, db.stock_levels, db.sync_queue], async () => {
      // إزالة التشغيلات القديمة
      const existing = await db.product_batches.where('product_id').equals(productId).toArray();
      for (const rec of existing) {
        await db.product_batches.delete(rec.id);
        await SyncQueueManager.enqueue('product_batches', rec.id, 'delete', { id: rec.id });
      }

      const warehouseTotals = new Map<string, number>();

      for (let i = 0; i < batches.length; i++) {
        const b = batches[i];
        if (b && b.initial_quantity > 0 && b.warehouse_id) {
          const batchId = uuidv4();
          const batchRecord: ProductBatch = {
            id: batchId,
            org_id: orgId,
            product_id: productId,
            warehouse_id: b.warehouse_id,
            batch_number: b.batch_number?.trim() || `BATCH-${Date.now().toString().slice(-4)}-${i + 1}`,
            expiry_date: b.expiry_date || null,
            initial_quantity: b.initial_quantity,
            current_quantity: b.initial_quantity,
            purchase_price: b.purchase_price ?? 0,
            created_at: now,
            updated_at: now,
            sync_status: 'pending',
          };
          await db.product_batches.add(batchRecord);
          await SyncQueueManager.enqueue('product_batches', batchId, 'insert', batchRecord);

          const currentTotal = warehouseTotals.get(b.warehouse_id) || 0;
          warehouseTotals.set(b.warehouse_id, currentTotal + b.initial_quantity);
        }
      }

      for (const [wId, totalQty] of warehouseTotals.entries()) {
        const stockId = `${wId}_${productId}`;
        const existingStock = await db.stock_levels.get(stockId);
        const stockLevel: StockLevel = {
          id: stockId,
          org_id: orgId,
          warehouse_id: wId,
          product_id: productId,
          quantity: totalQty,
          reserved_quantity: existingStock?.reserved_quantity || 0,
          available_quantity: Math.max(0, totalQty - (existingStock?.reserved_quantity || 0)),
          updated_at: now,
          sync_status: 'pending',
        };
        await db.stock_levels.put(stockLevel);
        await SyncQueueManager.enqueue('stock_levels', stockId, 'update', stockLevel);
      }
    });

    // إطلاق مزامنة سحابية فورية ولحظية مع Supabase في الخلفية
    syncCoordinator.triggerSync().catch(console.error);
  }

  /**
   * Get all active warehouses
   */
  public static async getAllWarehouses(orgId: string): Promise<Warehouse[]> {
    return await db.warehouses
      .where('org_id')
      .equals(orgId)
      .and((w) => w.is_active)
      .toArray();
  }

  /**
   * Update existing product
   */
  public static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const existing = await db.products.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: Product = {
      ...existing,
      ...updates,
      updated_at: now,
      sync_status: 'pending',
    };

    await db.transaction('rw', [db.products, db.sync_queue], async () => {
      await db.products.put(updated);
      await SyncQueueManager.enqueue('products', id, 'update', updated);
    });

    syncCoordinator.triggerSync().catch(console.error);

    return updated;
  }

  /**
   * Get all units linked to a product
   */
  public static async getProductUnits(productId: string): Promise<ProductUnit[]> {
    return await db.product_units.where('product_id').equals(productId).toArray();
  }

  /**
   * Atomically replaces the secondary-unit set of a product
   */
  public static async replaceProductUnits(productId: string, units: Omit<ProductUnit, 'id' | 'product_id' | 'created_at' | 'updated_at' | 'sync_status'>[]) {
    const now = new Date().toISOString();
    const toInsert: ProductUnit[] = units.map((u) => ({
      ...u,
      id: uuidv4(),
      product_id: productId,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    }));

    await db.transaction('rw', [db.product_units, db.sync_queue], async () => {
      const existing = await db.product_units.where('product_id').equals(productId).toArray();
      for (const rec of existing) {
        await db.product_units.delete(rec.id);
        await SyncQueueManager.enqueue('product_units', rec.id, 'delete', { id: rec.id });
      }
      if (toInsert.length > 0) {
        await db.product_units.bulkAdd(toInsert);
        for (const u of toInsert) {
          await SyncQueueManager.enqueue('product_units', u.id, 'insert', u);
        }
      }
    });

    syncCoordinator.triggerSync().catch(console.error);
  }

  /**
   * Soft-delete (deactivate) a product from the catalog
   */
  public static async setActive(productId: string, isActive: boolean): Promise<Product | null> {
    return await ProductRepository.updateProduct(productId, { is_active: isActive });
  }

  /**
   * Get all categories
   */
  public static async getCategories(orgId: string): Promise<ProductCategory[]> {
    return await db.product_categories.where('org_id').equals(orgId).toArray();
  }

  /**
   * Get all available standard units
   */
  public static async getAllUnits(orgId: string): Promise<Unit[]> {
    return await db.units.where('org_id').equals(orgId).toArray();
  }

  /**
   * Get all brands for an organization
   */
  public static async getBrands(orgId: string): Promise<ProductBrand[]> {
    return await db.product_brands.where('org_id').equals(orgId).toArray();
  }

  /**
   * Get all product types from the database for an organization.
   * Only returns records entered by the business owner / user.
   */
  public static async getProductTypes(orgId: string): Promise<ProductTypeItem[]> {
    const existing = await db.product_types.where('org_id').equals(orgId).toArray();
    const map = new Map<string, ProductTypeItem>();
    for (const item of existing) {
      const key = item.name.trim();
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  }

  /**
   * Create a product type in the database
   */
  public static async createProductType(name: string, orgId: string, code?: string): Promise<ProductTypeItem> {
    const now = new Date().toISOString();
    const item: ProductTypeItem = {
      id: uuidv4(),
      org_id: orgId,
      name: name.trim(),
      code: code?.trim() || undefined,
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.product_types.add(item);
    await SyncQueueManager.enqueue('product_types', item.id, 'insert', item);
    syncCoordinator.triggerSync().catch(console.error);
    return item;
  }

  /**
   * Create a product category (used by catalog quick-add)
   */
  public static async createCategory(name: string, orgId: string, code?: string): Promise<ProductCategory> {
    const now = new Date().toISOString();
    const category: ProductCategory = {
      id: uuidv4(),
      org_id: orgId,
      name: name.trim(),
      code: code?.trim() || undefined,
      parent_id: null,
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.product_categories.add(category);
    await SyncQueueManager.enqueue('product_categories', category.id, 'insert', category);
    syncCoordinator.triggerSync().catch(console.error);
    return category;
  }

  /**
   * Create a product brand (used by catalog quick-add)
   */
  public static async createBrand(name: string, orgId: string): Promise<ProductBrand> {
    const now = new Date().toISOString();
    const brand: ProductBrand = {
      id: uuidv4(),
      org_id: orgId,
      name: name.trim(),
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.product_brands.add(brand);
    await SyncQueueManager.enqueue('product_brands', brand.id, 'insert', brand);
    syncCoordinator.triggerSync().catch(console.error);
    return brand;
  }

  /**
   * Create a unit of measure (used by catalog quick-add)
   */
  public static async createUnit(name: string, symbol: string, orgId: string): Promise<Unit> {
    const now = new Date().toISOString();
    const unit: Unit = {
      id: uuidv4(),
      org_id: orgId,
      name: name.trim(),
      symbol: symbol.trim() || name.trim(),
      is_active: true,
      created_at: now,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.units.add(unit);
    await SyncQueueManager.enqueue('units', unit.id, 'insert', unit);
    syncCoordinator.triggerSync().catch(console.error);
    return unit;
  }

  /**
   * Toggle or update a product category
   */
  public static async updateCategory(id: string, updates: Partial<ProductCategory>): Promise<ProductCategory | null> {
    const existing = await db.product_categories.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: ProductCategory = {
      ...existing,
      ...updates,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.transaction('rw', [db.product_categories, db.sync_queue], async () => {
      await db.product_categories.put(updated);
      await SyncQueueManager.enqueue('product_categories', id, 'update', updated);
    });
    syncCoordinator.triggerSync().catch(console.error);
    return updated;
  }

  /**
   * Delete a product category
   */
  public static async deleteCategory(id: string): Promise<void> {
    await db.transaction('rw', [db.product_categories, db.sync_queue], async () => {
      await db.product_categories.delete(id);
      await SyncQueueManager.enqueue('product_categories', id, 'delete', { id });
    });
    syncCoordinator.triggerSync().catch(console.error);
  }

  /**
   * Delete a product brand
   */
  public static async deleteBrand(id: string): Promise<void> {
    await db.transaction('rw', [db.product_brands, db.sync_queue], async () => {
      await db.product_brands.delete(id);
      await SyncQueueManager.enqueue('product_brands', id, 'delete', { id });
    });
    syncCoordinator.triggerSync().catch(console.error);
  }

  /**
   * Delete a product type
   */
  public static async deleteProductType(id: string): Promise<void> {
    await db.transaction('rw', [db.product_types, db.sync_queue], async () => {
      await db.product_types.delete(id);
      await SyncQueueManager.enqueue('product_types', id, 'delete', { id });
    });
    syncCoordinator.triggerSync().catch(console.error);
  }

  /**
   * Toggle or update a unit of measure
   */
  public static async updateUnit(id: string, updates: Partial<Unit>): Promise<Unit | null> {
    const existing = await db.units.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: Unit = {
      ...existing,
      ...updates,
      updated_at: now,
      sync_status: 'pending',
    };
    await db.transaction('rw', [db.units, db.sync_queue], async () => {
      await db.units.put(updated);
      await SyncQueueManager.enqueue('units', id, 'update', updated);
    });
    syncCoordinator.triggerSync().catch(console.error);
    return updated;
  }

  /**
   * Get all batches (lots) for a product across warehouses
   */
  public static async getProductBatches(productId: string): Promise<ProductBatch[]> {
    return await db.product_batches
      .where('product_id')
      .equals(productId)
      .reverse()
      .sortBy('created_at');
  }
}
