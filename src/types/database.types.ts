/**
 * Falcon Pharmacy System - Generated Supabase Database Types
 *
 * Source: Supabase Management API (`/v1/projects/sqskyglaapeeuvazbfld/types/typescript`).
 * Regenerate with:  node scripts/generate-types.mjs
 *
 * DO NOT EDIT MANUALLY. The schema is the single source of truth and mirrors
 * the live `pharmacy_system` cloud database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_reset_markers: {
        Row: {
          account_id: string
          device_id: string | null
          id: string
          reset_at: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          device_id?: string | null
          id: string
          reset_at?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          device_id?: string | null
          id?: string
          reset_at?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      app_notifications: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          last_modified: string | null
          message: string | null
          sync_version: number | null
          target_route: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          last_modified?: string | null
          message?: string | null
          sync_version?: number | null
          target_route?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          last_modified?: string | null
          message?: string | null
          sync_version?: number | null
          target_route?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          account_id: string
          address: string | null
          allow_selling_expired_items: boolean | null
          auto_open_cash_drawer: boolean | null
          auto_print_receipt: boolean | null
          barcode_label_height_mm: number | null
          barcode_label_margin_mm: number | null
          barcode_label_size: string | null
          barcode_label_width_mm: number | null
          barcode_labels_per_row: number | null
          barcode_printer_name: string | null
          barcode_symbology: string | null
          branch_id: string
          commercial_registry: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          currency_position: string | null
          currency_symbol: string | null
          default_low_stock_threshold: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          email: string | null
          enable_dark_mode: boolean | null
          enable_expiry_automation: boolean | null
          enable_expiry_tracking: boolean | null
          enable_sound_alerts: boolean | null
          enable_vat: boolean | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          logo_url: string | null
          near_expiry_alert_days: number | null
          pharmacy_name: string | null
          pharmacy_name_en: string | null
          phone: string | null
          receipt_footer_notes: string | null
          receipt_header_text: string | null
          receipt_paper_size: string | null
          show_batch_number_on_label: boolean | null
          show_customer_info_on_receipt: boolean | null
          show_doctor_name_on_receipt: boolean | null
          show_expiry_on_label: boolean | null
          show_expiry_on_receipt: boolean | null
          show_invoice_barcode_on_receipt: boolean | null
          show_item_name_on_label: boolean | null
          show_pharmacy_logo_on_receipt: boolean | null
          show_pharmacy_name_on_label: boolean | null
          show_price_on_label: boolean | null
          show_saved_amount_on_receipt: boolean | null
          show_tax_number_on_receipt: boolean | null
          show_unit_name_on_label: boolean | null
          sync_version: number | null
          tax_number: string | null
          theme_colors: Json | null
          vat_percentage: number | null
        }
        Insert: {
          account_id: string
          address?: string | null
          allow_selling_expired_items?: boolean | null
          auto_open_cash_drawer?: boolean | null
          auto_print_receipt?: boolean | null
          barcode_label_height_mm?: number | null
          barcode_label_margin_mm?: number | null
          barcode_label_size?: string | null
          barcode_label_width_mm?: number | null
          barcode_labels_per_row?: number | null
          barcode_printer_name?: string | null
          barcode_symbology?: string | null
          branch_id: string
          commercial_registry?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          currency_position?: string | null
          currency_symbol?: string | null
          default_low_stock_threshold?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          enable_dark_mode?: boolean | null
          enable_expiry_automation?: boolean | null
          enable_expiry_tracking?: boolean | null
          enable_sound_alerts?: boolean | null
          enable_vat?: boolean | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          logo_url?: string | null
          near_expiry_alert_days?: number | null
          pharmacy_name?: string | null
          pharmacy_name_en?: string | null
          phone?: string | null
          receipt_footer_notes?: string | null
          receipt_header_text?: string | null
          receipt_paper_size?: string | null
          show_batch_number_on_label?: boolean | null
          show_customer_info_on_receipt?: boolean | null
          show_doctor_name_on_receipt?: boolean | null
          show_expiry_on_label?: boolean | null
          show_expiry_on_receipt?: boolean | null
          show_invoice_barcode_on_receipt?: boolean | null
          show_item_name_on_label?: boolean | null
          show_pharmacy_logo_on_receipt?: boolean | null
          show_pharmacy_name_on_label?: boolean | null
          show_price_on_label?: boolean | null
          show_saved_amount_on_receipt?: boolean | null
          show_tax_number_on_receipt?: boolean | null
          show_unit_name_on_label?: boolean | null
          sync_version?: number | null
          tax_number?: string | null
          theme_colors?: Json | null
          vat_percentage?: number | null
        }
        Update: {
          account_id?: string
          address?: string | null
          allow_selling_expired_items?: boolean | null
          auto_open_cash_drawer?: boolean | null
          auto_print_receipt?: boolean | null
          barcode_label_height_mm?: number | null
          barcode_label_margin_mm?: number | null
          barcode_label_size?: string | null
          barcode_label_width_mm?: number | null
          barcode_labels_per_row?: number | null
          barcode_printer_name?: string | null
          barcode_symbology?: string | null
          branch_id?: string
          commercial_registry?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          currency_position?: string | null
          currency_symbol?: string | null
          default_low_stock_threshold?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          enable_dark_mode?: boolean | null
          enable_expiry_automation?: boolean | null
          enable_expiry_tracking?: boolean | null
          enable_sound_alerts?: boolean | null
          enable_vat?: boolean | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          logo_url?: string | null
          near_expiry_alert_days?: number | null
          pharmacy_name?: string | null
          pharmacy_name_en?: string | null
          phone?: string | null
          receipt_footer_notes?: string | null
          receipt_header_text?: string | null
          receipt_paper_size?: string | null
          show_batch_number_on_label?: boolean | null
          show_customer_info_on_receipt?: boolean | null
          show_doctor_name_on_receipt?: boolean | null
          show_expiry_on_label?: boolean | null
          show_expiry_on_receipt?: boolean | null
          show_invoice_barcode_on_receipt?: boolean | null
          show_item_name_on_label?: boolean | null
          show_pharmacy_logo_on_receipt?: boolean | null
          show_pharmacy_name_on_label?: boolean | null
          show_price_on_label?: boolean | null
          show_saved_amount_on_receipt?: boolean | null
          show_tax_number_on_receipt?: boolean | null
          show_unit_name_on_label?: boolean | null
          sync_version?: number | null
          tax_number?: string | null
          theme_colors?: Json | null
          vat_percentage?: number | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder_name: string | null
          account_id: string
          account_number: string
          balance_piasters: number
          bank_name: string
          branch_id: string
          branch_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          swift_code: string | null
          sync_version: number | null
        }
        Insert: {
          account_holder_name?: string | null
          account_id: string
          account_number: string
          balance_piasters?: number
          bank_name: string
          branch_id: string
          branch_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          iban?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          swift_code?: string | null
          sync_version?: number | null
        }
        Update: {
          account_holder_name?: string | null
          account_id?: string
          account_number?: string
          balance_piasters?: number
          bank_name?: string
          branch_id?: string
          branch_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          swift_code?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      barcode_label_configs: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          height_mm: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_deleted: boolean | null
          label_margin_mm: number | null
          labels_per_row: number | null
          last_modified: string | null
          name: string
          sync_version: number | null
          width_mm: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          height_mm?: number | null
          id: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_deleted?: boolean | null
          label_margin_mm?: number | null
          labels_per_row?: number | null
          last_modified?: string | null
          name: string
          sync_version?: number | null
          width_mm?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          height_mm?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_deleted?: boolean | null
          label_margin_mm?: number | null
          labels_per_row?: number | null
          last_modified?: string | null
          name?: string
          sync_version?: number | null
          width_mm?: number | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          account_id: string
          address: string | null
          code: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_active: boolean
          is_deleted: boolean
          is_main_branch: boolean
          last_modified: string
          name: string
          phone: string | null
          sync_version: number
        }
        Insert: {
          account_id: string
          address?: string | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_active?: boolean
          is_deleted?: boolean
          is_main_branch?: boolean
          last_modified?: string
          name: string
          phone?: string | null
          sync_version?: number
        }
        Update: {
          account_id?: string
          address?: string | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          is_main_branch?: boolean
          last_modified?: string
          name?: string
          phone?: string | null
          sync_version?: number
        }
        Relationships: []
      }
      cashier_shifts: {
        Row: {
          account_id: string
          branch_id: string
          cashier_id: string
          cashier_name: string | null
          closed_at: string | null
          closed_by: string | null
          closed_by_name: string | null
          counted_card_piasters: number | null
          counted_cash_piasters: number | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          device_id: string | null
          difference_card_piasters: number | null
          difference_piasters: number | null
          expected_card_piasters: number | null
          expected_cash_piasters: number | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          opened_at: string | null
          opened_by: string | null
          opened_by_name: string | null
          opening_cash_piasters: number | null
          shift_number: number | null
          status: string | null
          sync_version: number | null
          treasury_account_id: string | null
          treasury_name: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          cashier_id: string
          cashier_name?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closed_by_name?: string | null
          counted_card_piasters?: number | null
          counted_cash_piasters?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          device_id?: string | null
          difference_card_piasters?: number | null
          difference_piasters?: number | null
          expected_card_piasters?: number | null
          expected_cash_piasters?: number | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          opened_at?: string | null
          opened_by?: string | null
          opened_by_name?: string | null
          opening_cash_piasters?: number | null
          shift_number?: number | null
          status?: string | null
          sync_version?: number | null
          treasury_account_id?: string | null
          treasury_name?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          cashier_id?: string
          cashier_name?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closed_by_name?: string | null
          counted_card_piasters?: number | null
          counted_cash_piasters?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          device_id?: string | null
          difference_card_piasters?: number | null
          difference_piasters?: number | null
          expected_card_piasters?: number | null
          expected_cash_piasters?: number | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          opened_at?: string | null
          opened_by?: string | null
          opened_by_name?: string | null
          opening_cash_piasters?: number | null
          shift_number?: number | null
          status?: string | null
          sync_version?: number | null
          treasury_account_id?: string | null
          treasury_name?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_id: string
          account_type: string
          balance_piasters: number | null
          code: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          parent_id: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          account_type: string
          balance_piasters?: number | null
          code: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          parent_id?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          account_type?: string
          balance_piasters?: number | null
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          parent_id?: string | null
          sync_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_ledgers: {
        Row: {
          account_id: string
          branch_id: string
          contact_id: string
          contact_type: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          credit_amount_piasters: number | null
          debit_amount_piasters: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          reference_number: string
          running_balance_piasters: number
          sync_version: number | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          account_id: string
          branch_id: string
          contact_id: string
          contact_type?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          credit_amount_piasters?: number | null
          debit_amount_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          reference_number: string
          running_balance_piasters?: number
          sync_version?: number | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          account_id?: string
          branch_id?: string
          contact_id?: string
          contact_type?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          credit_amount_piasters?: number | null
          debit_amount_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          reference_number?: string
          running_balance_piasters?: number
          sync_version?: number | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: []
      }
      customer_groups: {
        Row: {
          account_id: string
          branch_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          price_group_id: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          discount_percentage?: number | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          price_group_id?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          price_group_id?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          account_id: string
          address: string | null
          advance_balance_piasters: number | null
          balance_piasters: number | null
          branch_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          email: string | null
          entity_type: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          max_credit_piasters: number | null
          name: string
          notes: string | null
          opening_balance_piasters: number | null
          phone: string | null
          sync_version: number | null
          tax_number: string | null
        }
        Insert: {
          account_id: string
          address?: string | null
          advance_balance_piasters?: number | null
          balance_piasters?: number | null
          branch_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          entity_type?: string | null
          group_id?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          max_credit_piasters?: number | null
          name: string
          notes?: string | null
          opening_balance_piasters?: number | null
          phone?: string | null
          sync_version?: number | null
          tax_number?: string | null
        }
        Update: {
          account_id?: string
          address?: string | null
          advance_balance_piasters?: number | null
          balance_piasters?: number | null
          branch_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          entity_type?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          max_credit_piasters?: number | null
          name?: string
          notes?: string | null
          opening_balance_piasters?: number | null
          phone?: string | null
          sync_version?: number | null
          tax_number?: string | null
        }
        Relationships: []
      }
      damaged_stock_logs: {
        Row: {
          account_id: string
          batch_number: string | null
          branch_id: string
          category_name: string | null
          cost_price_piasters: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          damage_type: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          entered_quantity: number | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          notes: string | null
          quantity: number
          reason: string
          recovered_cost_piasters: number | null
          reference_id: string | null
          reference_number: string | null
          sync_version: number | null
          total_cost_piasters: number | null
          unit_level: number | null
        }
        Insert: {
          account_id: string
          batch_number?: string | null
          branch_id: string
          category_name?: string | null
          cost_price_piasters?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          damage_type?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          entered_quantity?: number | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          notes?: string | null
          quantity?: number
          reason: string
          recovered_cost_piasters?: number | null
          reference_id?: string | null
          reference_number?: string | null
          sync_version?: number | null
          total_cost_piasters?: number | null
          unit_level?: number | null
        }
        Update: {
          account_id?: string
          batch_number?: string | null
          branch_id?: string
          category_name?: string | null
          cost_price_piasters?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          damage_type?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          entered_quantity?: number | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          notes?: string | null
          quantity?: number
          reason?: string
          recovered_cost_piasters?: number | null
          reference_id?: string | null
          reference_number?: string | null
          sync_version?: number | null
          total_cost_piasters?: number | null
          unit_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "damaged_stock_logs_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          account_id: string
          branch_id: string | null
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          manager_id: string | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id?: string | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          manager_id?: string | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string | null
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          manager_id?: string | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          account_id: string
          branch_id: string
          clinic_address: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          notes: string | null
          phone: string | null
          specialty: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          clinic_address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          specialty?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          clinic_address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          specialty?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          account_id: string
          branch_id: string
          category: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          file_path: string | null
          file_url: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          sync_version: number | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          category: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          file_path?: string | null
          file_url?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      employee_advances: {
        Row: {
          account_id: string
          adjustment_type: string
          amount_piasters: number
          branch_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          issue_date: string
          last_modified: string | null
          reason: string | null
          status: string | null
          sync_version: number | null
          user_id: string
        }
        Insert: {
          account_id: string
          adjustment_type: string
          amount_piasters?: number
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          issue_date?: string
          last_modified?: string | null
          reason?: string | null
          status?: string | null
          sync_version?: number | null
          user_id: string
        }
        Update: {
          account_id?: string
          adjustment_type?: string
          amount_piasters?: number
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          issue_date?: string
          last_modified?: string | null
          reason?: string | null
          status?: string | null
          sync_version?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attendance: {
        Row: {
          account_id: string
          branch_id: string
          check_in_time: string
          check_out_time: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          late_minutes: number | null
          notes: string | null
          overtime_minutes: number | null
          status: string | null
          sync_version: number | null
          user_id: string
        }
        Insert: {
          account_id: string
          branch_id: string
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          late_minutes?: number | null
          notes?: string | null
          overtime_minutes?: number | null
          status?: string | null
          sync_version?: number | null
          user_id: string
        }
        Update: {
          account_id?: string
          branch_id?: string
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          late_minutes?: number | null
          notes?: string | null
          overtime_minutes?: number | null
          status?: string | null
          sync_version?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          file_type: string | null
          file_url: string
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          sync_version: number | null
          title: string
          user_id: string
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          file_type?: string | null
          file_url: string
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
          title: string
          user_id: string
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leaves: {
        Row: {
          account_id: string
          approved_by: string | null
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          end_date: string
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          leave_type: string
          reason: string | null
          start_date: string
          status: string | null
          sync_version: number | null
          total_days: number
          user_id: string
        }
        Insert: {
          account_id: string
          approved_by?: string | null
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          end_date: string
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string | null
          sync_version?: number | null
          total_days?: number
          user_id: string
        }
        Update: {
          account_id?: string
          approved_by?: string | null
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          end_date?: string
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          sync_version?: number | null
          total_days?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_leaves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_messages: {
        Row: {
          account_id: string
          branch_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_broadcast: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          read_by_ids: Json | null
          recipient_ids: Json | null
          sender_id: string
          sync_version: number | null
          title: string
        }
        Insert: {
          account_id: string
          branch_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_broadcast?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          read_by_ids?: Json | null
          recipient_ids?: Json | null
          sender_id: string
          sync_version?: number | null
          title: string
        }
        Update: {
          account_id?: string
          branch_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          read_by_ids?: Json | null
          recipient_ids?: Json | null
          sender_id?: string
          sync_version?: number | null
          title?: string
        }
        Relationships: []
      }
      employee_payrolls: {
        Row: {
          account_id: string
          advances_piasters: number | null
          allowances_piasters: number | null
          balance_piasters: number | null
          base_salary_piasters: number | null
          branch_id: string
          created_at: string | null
          deductions_piasters: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          net_salary_piasters: number | null
          overtime_piasters: number | null
          paid_at: string | null
          payment_voucher_id: string | null
          payroll_period: string
          status: string | null
          sync_version: number | null
          user_id: string
        }
        Insert: {
          account_id: string
          advances_piasters?: number | null
          allowances_piasters?: number | null
          balance_piasters?: number | null
          base_salary_piasters?: number | null
          branch_id: string
          created_at?: string | null
          deductions_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          net_salary_piasters?: number | null
          overtime_piasters?: number | null
          paid_at?: string | null
          payment_voucher_id?: string | null
          payroll_period: string
          status?: string | null
          sync_version?: number | null
          user_id: string
        }
        Update: {
          account_id?: string
          advances_piasters?: number | null
          allowances_piasters?: number | null
          balance_piasters?: number | null
          base_salary_piasters?: number | null
          branch_id?: string
          created_at?: string | null
          deductions_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          net_salary_piasters?: number | null
          overtime_piasters?: number | null
          paid_at?: string | null
          payment_voucher_id?: string | null
          payroll_period?: string
          status?: string | null
          sync_version?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payrolls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          account_id: string | null
          app_version: string | null
          branch_id: string | null
          created_at: string | null
          device_id: string | null
          error_message: string
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          log_level: string | null
          stack_trace: string | null
          sync_version: number | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          app_version?: string | null
          branch_id?: string | null
          created_at?: string | null
          device_id?: string | null
          error_message: string
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          log_level?: string | null
          stack_trace?: string | null
          sync_version?: number | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          app_version?: string | null
          branch_id?: string | null
          created_at?: string | null
          device_id?: string | null
          error_message?: string
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          log_level?: string | null
          stack_trace?: string | null
          sync_version?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          account_id: string
          branch_id: string | null
          code: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string
          amount_piasters: number
          branch_id: string
          category_id: string | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expense_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          shift_id: string | null
          sync_version: number | null
          title: string
          treasury_account_id: string | null
        }
        Insert: {
          account_id: string
          amount_piasters?: number
          branch_id: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expense_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          shift_id?: string | null
          sync_version?: number | null
          title: string
          treasury_account_id?: string | null
        }
        Update: {
          account_id?: string
          amount_piasters?: number
          branch_id?: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expense_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          shift_id?: string | null
          sync_version?: number | null
          title?: string
          treasury_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_treasury_account_id_fkey"
            columns: ["treasury_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      free_returns: {
        Row: {
          account_id: string
          branch_id: string
          cash_register_id: string | null
          cashier_id: string | null
          cashier_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_amount_piasters: number | null
          id: string
          is_deleted: boolean | null
          is_discount_percent: boolean | null
          is_free_return: boolean | null
          items: Json
          last_modified: string | null
          original_invoice_id: string | null
          original_invoice_number: string | null
          party_id: string | null
          party_name: string | null
          party_type: string | null
          payment_method: string | null
          reason_notes: string | null
          return_category: string | null
          return_number: string | null
          shift_id: string | null
          sync_version: number | null
          total_amount_piasters: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          cash_register_id?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          id: string
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          is_free_return?: boolean | null
          items?: Json
          last_modified?: string | null
          original_invoice_id?: string | null
          original_invoice_number?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type?: string | null
          payment_method?: string | null
          reason_notes?: string | null
          return_category?: string | null
          return_number?: string | null
          shift_id?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          cash_register_id?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          id?: string
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          is_free_return?: boolean | null
          items?: Json
          last_modified?: string | null
          original_invoice_id?: string | null
          original_invoice_number?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type?: string | null
          payment_method?: string | null
          reason_notes?: string | null
          return_category?: string | null
          return_number?: string | null
          shift_id?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Relationships: []
      }
      inventory_audit_items: {
        Row: {
          account_id: string
          actual_quantity: number | null
          actual_unit1_qty: number | null
          actual_unit2_qty: number | null
          actual_unit3_qty: number | null
          audit_id: string
          batch_number: string | null
          book_qty_smallest: number | null
          book_quantity_text: string | null
          book_unit1_qty: number
          book_unit2_qty: number
          book_unit3_qty: number
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          notes: string | null
          sku: string | null
          sync_version: number | null
          system_quantity: number | null
          unit_cost: number | null
          unit_price_piasters: number | null
          unit1_name: string | null
          unit2_factor: number | null
          unit2_name: string | null
          unit3_factor: number | null
          unit3_name: string | null
          variance_quantity: number | null
          variance_value_piasters: number | null
        }
        Insert: {
          account_id: string
          actual_quantity?: number | null
          actual_unit1_qty?: number | null
          actual_unit2_qty?: number | null
          actual_unit3_qty?: number | null
          audit_id: string
          batch_number?: string | null
          book_qty_smallest?: number | null
          book_quantity_text?: string | null
          book_unit1_qty?: number
          book_unit2_qty?: number
          book_unit3_qty?: number
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          notes?: string | null
          sku?: string | null
          sync_version?: number | null
          system_quantity?: number | null
          unit_cost?: number | null
          unit_price_piasters?: number | null
          unit1_name?: string | null
          unit2_factor?: number | null
          unit2_name?: string | null
          unit3_factor?: number | null
          unit3_name?: string | null
          variance_quantity?: number | null
          variance_value_piasters?: number | null
        }
        Update: {
          account_id?: string
          actual_quantity?: number | null
          actual_unit1_qty?: number | null
          actual_unit2_qty?: number | null
          actual_unit3_qty?: number | null
          audit_id?: string
          batch_number?: string | null
          book_qty_smallest?: number | null
          book_quantity_text?: string | null
          book_unit1_qty?: number
          book_unit2_qty?: number
          book_unit3_qty?: number
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          notes?: string | null
          sku?: string | null
          sync_version?: number | null
          system_quantity?: number | null
          unit_cost?: number | null
          unit_price_piasters?: number | null
          unit1_name?: string | null
          unit2_factor?: number | null
          unit2_name?: string | null
          unit3_factor?: number | null
          unit3_name?: string | null
          variance_quantity?: number | null
          variance_value_piasters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "inventory_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audits: {
        Row: {
          account_id: string
          audit_number: string | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          status: string | null
          sync_version: number | null
          total_variance_piasters: number | null
        }
        Insert: {
          account_id: string
          audit_number?: string | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          status?: string | null
          sync_version?: number | null
          total_variance_piasters?: number | null
        }
        Update: {
          account_id?: string
          audit_number?: string | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          status?: string | null
          sync_version?: number | null
          total_variance_piasters?: number | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          account_id: string
          batch_number: string | null
          branch_id: string
          buy_price_piasters: number | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_percentage: number | null
          expiry_date: string | null
          id: string
          invoice_date: string | null
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string | null
          new_unit1_qty: number | null
          new_unit2_qty: number | null
          new_unit3_qty: number | null
          prev_unit1_qty: number | null
          prev_unit2_qty: number | null
          prev_unit3_qty: number | null
          purchased_by_name: string | null
          quantity_change: number
          reference_id: string | null
          reference_number: string | null
          sell_price_piasters: number | null
          sync_version: number | null
          transaction_type: string
          unit_level: number
          unit_name: string | null
          unit_price: number | null
        }
        Insert: {
          account_id: string
          batch_number?: string | null
          branch_id: string
          buy_price_piasters?: number | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id: string
          invoice_date?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name?: string | null
          new_unit1_qty?: number | null
          new_unit2_qty?: number | null
          new_unit3_qty?: number | null
          prev_unit1_qty?: number | null
          prev_unit2_qty?: number | null
          prev_unit3_qty?: number | null
          purchased_by_name?: string | null
          quantity_change: number
          reference_id?: string | null
          reference_number?: string | null
          sell_price_piasters?: number | null
          sync_version?: number | null
          transaction_type: string
          unit_level?: number
          unit_name?: string | null
          unit_price?: number | null
        }
        Update: {
          account_id?: string
          batch_number?: string | null
          branch_id?: string
          buy_price_piasters?: number | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          invoice_date?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string | null
          new_unit1_qty?: number | null
          new_unit2_qty?: number | null
          new_unit3_qty?: number | null
          prev_unit1_qty?: number | null
          prev_unit2_qty?: number | null
          prev_unit3_qty?: number | null
          purchased_by_name?: string | null
          quantity_change?: number
          reference_id?: string | null
          reference_number?: string | null
          sell_price_piasters?: number | null
          sync_version?: number | null
          transaction_type?: string
          unit_level?: number
          unit_name?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_return_items: {
        Row: {
          account_id: string
          batch_number: string | null
          branch_id: string
          brand_name: string | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          quantity: number
          return_id: string
          sync_version: number | null
          total_price_piasters: number | null
          unit_level: number | null
          unit_name: string | null
          unit_price_piasters: number | null
        }
        Insert: {
          account_id: string
          batch_number?: string | null
          branch_id: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          quantity?: number
          return_id: string
          sync_version?: number | null
          total_price_piasters?: number | null
          unit_level?: number | null
          unit_name?: string | null
          unit_price_piasters?: number | null
        }
        Update: {
          account_id?: string
          batch_number?: string | null
          branch_id?: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          quantity?: number
          return_id?: string
          sync_version?: number | null
          total_price_piasters?: number | null
          unit_level?: number | null
          unit_name?: string | null
          unit_price_piasters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "invoice_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_returns: {
        Row: {
          account_id: string
          branch_id: string
          cash_register_id: string | null
          cashier_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_amount_piasters: number | null
          id: string
          is_deleted: boolean | null
          is_discount_percent: boolean | null
          last_modified: string | null
          original_invoice_id: string | null
          payment_method: string | null
          reason_notes: string | null
          return_number: string | null
          sync_version: number | null
          total_amount_piasters: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          cash_register_id?: string | null
          cashier_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          id: string
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          last_modified?: string | null
          original_invoice_id?: string | null
          payment_method?: string | null
          reason_notes?: string | null
          return_number?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          cash_register_id?: string | null
          cashier_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          id?: string
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          last_modified?: string | null
          original_invoice_id?: string | null
          payment_method?: string | null
          reason_notes?: string | null
          return_number?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_returns_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "sale_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      item_batches: {
        Row: {
          account_id: string
          batch_number: string | null
          branch_id: string
          buy_price_piasters: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          medicine_id: string
          sell_price_piasters: number | null
          sync_version: number | null
          unit_level: number | null
          unit1_quantity: number
          unit2_quantity: number
          unit3_quantity: number
        }
        Insert: {
          account_id: string
          batch_number?: string | null
          branch_id: string
          buy_price_piasters?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          medicine_id: string
          sell_price_piasters?: number | null
          sync_version?: number | null
          unit_level?: number | null
          unit1_quantity?: number
          unit2_quantity?: number
          unit3_quantity?: number
        }
        Update: {
          account_id?: string
          batch_number?: string | null
          branch_id?: string
          buy_price_piasters?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          sell_price_piasters?: number | null
          sync_version?: number | null
          unit_level?: number | null
          unit1_quantity?: number
          unit2_quantity?: number
          unit3_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_batches_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      item_swaps: {
        Row: {
          account_id: string
          branch_id: string
          cash_register_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          items: Json
          last_modified: string | null
          net_cash_difference_piasters: number | null
          notes: string | null
          party_id: string | null
          party_name: string | null
          party_type: string | null
          swap_date: string | null
          swap_number: string
          sync_version: number | null
          total_incoming_amount_piasters: number | null
          total_outgoing_amount_piasters: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          cash_register_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          items?: Json
          last_modified?: string | null
          net_cash_difference_piasters?: number | null
          notes?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type?: string | null
          swap_date?: string | null
          swap_number: string
          sync_version?: number | null
          total_incoming_amount_piasters?: number | null
          total_outgoing_amount_piasters?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          cash_register_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          items?: Json
          last_modified?: string | null
          net_cash_difference_piasters?: number | null
          notes?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type?: string | null
          swap_date?: string | null
          swap_number?: string
          sync_version?: number | null
          total_incoming_amount_piasters?: number | null
          total_outgoing_amount_piasters?: number | null
        }
        Relationships: []
      }
      item_variants: {
        Row: {
          account_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          name: string
          sync_version: number | null
          values: Json | null
        }
        Insert: {
          account_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name: string
          sync_version?: number | null
          values?: Json | null
        }
        Update: {
          account_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name?: string
          sync_version?: number | null
          values?: Json | null
        }
        Relationships: []
      }
      item_warranties: {
        Row: {
          account_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          duration: number | null
          duration_unit: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          duration?: number | null
          duration_unit?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          duration?: number | null
          duration_unit?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          entry_date: string | null
          entry_number: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          reference_id: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          entry_date?: string | null
          entry_number?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          reference_id?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          entry_date?: string | null
          entry_number?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          reference_id?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          branch_id: string
          chart_account_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          credit_piasters: number | null
          debit_piasters: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          journal_entry_id: string
          last_modified: string | null
          notes: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          chart_account_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          credit_piasters?: number | null
          debit_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          journal_entry_id: string
          last_modified?: string | null
          notes?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          chart_account_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          credit_piasters?: number | null
          debit_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          journal_entry_id?: string
          last_modified?: string | null
          notes?: string | null
          sync_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lookups: {
        Row: {
          account_id: string | null
          branch_id: string | null
          code: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          lookup_type: string
          name_ar: string
          name_en: string | null
          sort_order: number | null
          sync_version: number | null
        }
        Insert: {
          account_id?: string | null
          branch_id?: string | null
          code: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          lookup_type: string
          name_ar: string
          name_en?: string | null
          sort_order?: number | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string | null
          branch_id?: string | null
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          lookup_type?: string
          name_ar?: string
          name_en?: string | null
          sort_order?: number | null
          sync_version?: number | null
        }
        Relationships: []
      }
      medicine_barcodes: {
        Row: {
          account_id: string
          barcode: string
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          sync_version: number | null
          unit_level: number | null
        }
        Insert: {
          account_id: string
          barcode: string
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          sync_version?: number | null
          unit_level?: number | null
        }
        Update: {
          account_id?: string
          barcode?: string
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          sync_version?: number | null
          unit_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_barcodes_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_brands: {
        Row: {
          account_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          logo_url: string | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          logo_url?: string | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          logo_url?: string | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      medicine_categories: {
        Row: {
          account_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          name: string
          parent_id: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name: string
          parent_id?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name?: string
          parent_id?: string | null
          sync_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_price_groups: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          price_group_id: string
          price_piasters: number
          sync_version: number | null
          unit_level: number
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          price_group_id: string
          price_piasters?: number
          sync_version?: number | null
          unit_level?: number
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          price_group_id?: string
          price_piasters?: number
          sync_version?: number | null
          unit_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicine_price_groups_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_price_groups_price_group_id_fkey"
            columns: ["price_group_id"]
            isOneToOne: false
            referencedRelation: "price_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_unit_levels: {
        Row: {
          account_id: string
          available_quantity: number | null
          branch_id: string
          buy_price_piasters: number
          conversion_factor: number
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean
          is_default_pos_unit: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          is_sales_suspended: boolean | null
          last_modified: string | null
          medicine_id: string
          new_sell_price_piasters: number | null
          old_sell_price_piasters: number | null
          purchase_discount_type: string | null
          purchase_discount_value: number | null
          sell_price_piasters: number
          sync_version: number | null
          unit_level: number
          unit_name: string
        }
        Insert: {
          account_id: string
          available_quantity?: number | null
          branch_id: string
          buy_price_piasters?: number
          conversion_factor?: number
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id: string
          is_active?: boolean
          is_default_pos_unit?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          is_sales_suspended?: boolean | null
          last_modified?: string | null
          medicine_id: string
          new_sell_price_piasters?: number | null
          old_sell_price_piasters?: number | null
          purchase_discount_type?: string | null
          purchase_discount_value?: number | null
          sell_price_piasters?: number
          sync_version?: number | null
          unit_level?: number
          unit_name?: string
        }
        Update: {
          account_id?: string
          available_quantity?: number | null
          branch_id?: string
          buy_price_piasters?: number
          conversion_factor?: number
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean
          is_default_pos_unit?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          is_sales_suspended?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          new_sell_price_piasters?: number | null
          old_sell_price_piasters?: number | null
          purchase_discount_type?: string | null
          purchase_discount_value?: number | null
          sell_price_piasters?: number
          sync_version?: number | null
          unit_level?: number
          unit_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_unit_levels_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_units: {
        Row: {
          account_id: string
          buy_price_piasters: number | null
          conversion_factor: number | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          sell_price_piasters: number | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          buy_price_piasters?: number | null
          conversion_factor?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          sell_price_piasters?: number | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          buy_price_piasters?: number | null
          conversion_factor?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          sell_price_piasters?: number | null
          sync_version?: number | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          account_id: string
          barcode: string | null
          branch_id: string
          brand_id: string | null
          brand_name: string | null
          buy_price_piasters: number | null
          category_id: string | null
          category_name: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          dosage_form: string | null
          expiry_alert_enabled: boolean | null
          expiry_tracking_enabled: boolean | null
          generic_name: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_deleted: boolean
          is_quick_item: boolean | null
          is_sales_suspended: boolean | null
          is_taxable: boolean | null
          last_modified: string
          manufacturer: string | null
          min_reorder_level: number | null
          name: string
          name_ar: string | null
          name_en: string | null
          new_sell_price_piasters: number | null
          notes: string | null
          old_sell_price_piasters: number | null
          opening_cost_piasters: number | null
          opening_quantity: number | null
          package_size: string | null
          package_type: string | null
          product_type_id: string | null
          product_type_name: string | null
          sell_price_piasters: number | null
          shelf_location: string | null
          strength: string | null
          sync_version: number
          target_profit_margin_percentage: number | null
          tax_type: string | null
          tax_value: number | null
          therapeutic_group_id: string | null
          therapeutic_group_name: string | null
          total_quantity: number | null
          total_quantity_base_units: number | null
          unit_name: string | null
          unit1_buy_price: number | null
          unit1_name: string | null
          unit1_quantity: number | null
          unit1_sell_price: number | null
          unit2_buy_price: number | null
          unit2_enabled: boolean | null
          unit2_factor: number | null
          unit2_name: string | null
          unit2_quantity: number | null
          unit2_sell_price: number | null
          unit3_buy_price: number | null
          unit3_enabled: boolean | null
          unit3_factor: number | null
          unit3_name: string | null
          unit3_quantity: number | null
          unit3_sell_price: number | null
        }
        Insert: {
          account_id: string
          barcode?: string | null
          branch_id: string
          brand_id?: string | null
          brand_name?: string | null
          buy_price_piasters?: number | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          dosage_form?: string | null
          expiry_alert_enabled?: boolean | null
          expiry_tracking_enabled?: boolean | null
          generic_name?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_quick_item?: boolean | null
          is_sales_suspended?: boolean | null
          is_taxable?: boolean | null
          last_modified?: string
          manufacturer?: string | null
          min_reorder_level?: number | null
          name: string
          name_ar?: string | null
          name_en?: string | null
          new_sell_price_piasters?: number | null
          notes?: string | null
          old_sell_price_piasters?: number | null
          opening_cost_piasters?: number | null
          opening_quantity?: number | null
          package_size?: string | null
          package_type?: string | null
          product_type_id?: string | null
          product_type_name?: string | null
          sell_price_piasters?: number | null
          shelf_location?: string | null
          strength?: string | null
          sync_version?: number
          target_profit_margin_percentage?: number | null
          tax_type?: string | null
          tax_value?: number | null
          therapeutic_group_id?: string | null
          therapeutic_group_name?: string | null
          total_quantity?: number | null
          total_quantity_base_units?: number | null
          unit_name?: string | null
          unit1_buy_price?: number | null
          unit1_name?: string | null
          unit1_quantity?: number | null
          unit1_sell_price?: number | null
          unit2_buy_price?: number | null
          unit2_enabled?: boolean | null
          unit2_factor?: number | null
          unit2_name?: string | null
          unit2_quantity?: number | null
          unit2_sell_price?: number | null
          unit3_buy_price?: number | null
          unit3_enabled?: boolean | null
          unit3_factor?: number | null
          unit3_name?: string | null
          unit3_quantity?: number | null
          unit3_sell_price?: number | null
        }
        Update: {
          account_id?: string
          barcode?: string | null
          branch_id?: string
          brand_id?: string | null
          brand_name?: string | null
          buy_price_piasters?: number | null
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          dosage_form?: string | null
          expiry_alert_enabled?: boolean | null
          expiry_tracking_enabled?: boolean | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_deleted?: boolean
          is_quick_item?: boolean | null
          is_sales_suspended?: boolean | null
          is_taxable?: boolean | null
          last_modified?: string
          manufacturer?: string | null
          min_reorder_level?: number | null
          name?: string
          name_ar?: string | null
          name_en?: string | null
          new_sell_price_piasters?: number | null
          notes?: string | null
          old_sell_price_piasters?: number | null
          opening_cost_piasters?: number | null
          opening_quantity?: number | null
          package_size?: string | null
          package_type?: string | null
          product_type_id?: string | null
          product_type_name?: string | null
          sell_price_piasters?: number | null
          shelf_location?: string | null
          strength?: string | null
          sync_version?: number
          target_profit_margin_percentage?: number | null
          tax_type?: string | null
          tax_value?: number | null
          therapeutic_group_id?: string | null
          therapeutic_group_name?: string | null
          total_quantity?: number | null
          total_quantity_base_units?: number | null
          unit_name?: string | null
          unit1_buy_price?: number | null
          unit1_name?: string | null
          unit1_quantity?: number | null
          unit1_sell_price?: number | null
          unit2_buy_price?: number | null
          unit2_enabled?: boolean | null
          unit2_factor?: number | null
          unit2_name?: string | null
          unit2_quantity?: number | null
          unit2_sell_price?: number | null
          unit3_buy_price?: number | null
          unit3_enabled?: boolean | null
          unit3_factor?: number | null
          unit3_name?: string | null
          unit3_quantity?: number | null
          unit3_sell_price?: number | null
        }
        Relationships: []
      }
      opening_stock: {
        Row: {
          account_id: string
          branch_id: string
          buy_price: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string | null
          medicine_name: string | null
          notes: string | null
          recorded_at: string | null
          recorded_by: string | null
          recorded_by_name: string | null
          sync_version: number | null
          unit_1_quantity: number | null
          unit_2_quantity: number | null
          unit_3_quantity: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          buy_price?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string | null
          medicine_name?: string | null
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          sync_version?: number | null
          unit_1_quantity?: number | null
          unit_2_quantity?: number | null
          unit_3_quantity?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          buy_price?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string | null
          medicine_name?: string | null
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          sync_version?: number | null
          unit_1_quantity?: number | null
          unit_2_quantity?: number | null
          unit_3_quantity?: number | null
        }
        Relationships: []
      }
      payment_vouchers: {
        Row: {
          account_id: string
          amount_piasters: number
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          is_reversed: boolean | null
          last_modified: string | null
          notes: string | null
          operation_type: string | null
          party_id: string | null
          party_name: string | null
          party_type: string
          payment_method: string | null
          reference_number: string | null
          reversal_date: string | null
          reversal_reason: string | null
          reversed_voucher_id: string | null
          shift_id: string | null
          sync_version: number | null
          treasury_account_id: string | null
          voucher_date: string | null
          voucher_number: string | null
          voucher_type: string
        }
        Insert: {
          account_id: string
          amount_piasters?: number
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_deleted?: boolean | null
          is_reversed?: boolean | null
          last_modified?: string | null
          notes?: string | null
          operation_type?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type: string
          payment_method?: string | null
          reference_number?: string | null
          reversal_date?: string | null
          reversal_reason?: string | null
          reversed_voucher_id?: string | null
          shift_id?: string | null
          sync_version?: number | null
          treasury_account_id?: string | null
          voucher_date?: string | null
          voucher_number?: string | null
          voucher_type: string
        }
        Update: {
          account_id?: string
          amount_piasters?: number
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          is_reversed?: boolean | null
          last_modified?: string | null
          notes?: string | null
          operation_type?: string | null
          party_id?: string | null
          party_name?: string | null
          party_type?: string
          payment_method?: string | null
          reference_number?: string | null
          reversal_date?: string | null
          reversal_reason?: string | null
          reversed_voucher_id?: string | null
          shift_id?: string | null
          sync_version?: number | null
          treasury_account_id?: string | null
          voucher_date?: string | null
          voucher_number?: string | null
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vouchers_treasury_account_id_fkey"
            columns: ["treasury_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          account_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_allowed: boolean
          is_deleted: boolean
          last_modified: string
          permission_key: string
          sync_version: number
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_allowed?: boolean
          is_deleted?: boolean
          last_modified?: string
          permission_key: string
          sync_version?: number
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_allowed?: boolean
          is_deleted?: boolean
          last_modified?: string
          permission_key?: string
          sync_version?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_groups: {
        Row: {
          account_id: string
          branch_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          markup_percentage: number | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_percentage?: number | null
          id: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          markup_percentage?: number | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          markup_percentage?: number | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      product_types: {
        Row: {
          account_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          account_id: string
          branch_id: string
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_type: string | null
          discount_value: number | null
          end_date: string
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          priority: number | null
          selected_medicine_ids: string[] | null
          start_date: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date: string
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          priority?: number | null
          selected_medicine_ids?: string[] | null
          start_date: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          priority?: number | null
          selected_medicine_ids?: string[] | null
          start_date?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      purchase_invoice_items: {
        Row: {
          account_id: string
          batch_number: string
          bonus_quantity: number | null
          branch_id: string
          brand_name: string | null
          buy_price_piasters: number
          category_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          is_item_discount_percent: boolean | null
          is_item_tax_percent: boolean | null
          item_discount_piasters: number | null
          item_tax_piasters: number | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          purchase_invoice_id: string
          quantity: number
          sell_price_piasters: number
          sync_version: number | null
          total_amount_piasters: number
          unit_level: number | null
          unit_name: string | null
        }
        Insert: {
          account_id: string
          batch_number: string
          bonus_quantity?: number | null
          branch_id: string
          brand_name?: string | null
          buy_price_piasters?: number
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          is_item_discount_percent?: boolean | null
          is_item_tax_percent?: boolean | null
          item_discount_piasters?: number | null
          item_tax_piasters?: number | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          purchase_invoice_id: string
          quantity?: number
          sell_price_piasters?: number
          sync_version?: number | null
          total_amount_piasters?: number
          unit_level?: number | null
          unit_name?: string | null
        }
        Update: {
          account_id?: string
          batch_number?: string
          bonus_quantity?: number | null
          branch_id?: string
          brand_name?: string | null
          buy_price_piasters?: number
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_item_discount_percent?: boolean | null
          is_item_tax_percent?: boolean | null
          item_discount_piasters?: number | null
          item_tax_piasters?: number | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          purchase_invoice_id?: string
          quantity?: number
          sell_price_piasters?: number
          sync_version?: number | null
          total_amount_piasters?: number
          unit_level?: number | null
          unit_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_amount_piasters: number | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_deleted: boolean | null
          is_discount_percent: boolean | null
          is_tax_percent: boolean | null
          last_modified: string | null
          notes: string | null
          other_expense_name: string | null
          other_expenses_amount_piasters: number | null
          paid_amount_piasters: number | null
          payment_type: string | null
          remaining_amount_piasters: number | null
          return_status: string | null
          shipping_amount_piasters: number | null
          status: string | null
          subtotal_amount_piasters: number | null
          supplier_id: string
          supplier_invoice_number: string | null
          supplier_name: string | null
          supplier_type: string | null
          sync_version: number | null
          tax_amount_piasters: number | null
          total_amount_piasters: number | null
          treasury_account_id: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          due_date?: string | null
          id: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          is_tax_percent?: boolean | null
          last_modified?: string | null
          notes?: string | null
          other_expense_name?: string | null
          other_expenses_amount_piasters?: number | null
          paid_amount_piasters?: number | null
          payment_type?: string | null
          remaining_amount_piasters?: number | null
          return_status?: string | null
          shipping_amount_piasters?: number | null
          status?: string | null
          subtotal_amount_piasters?: number | null
          supplier_id: string
          supplier_invoice_number?: string | null
          supplier_name?: string | null
          supplier_type?: string | null
          sync_version?: number | null
          tax_amount_piasters?: number | null
          total_amount_piasters?: number | null
          treasury_account_id?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          is_tax_percent?: boolean | null
          last_modified?: string | null
          notes?: string | null
          other_expense_name?: string | null
          other_expenses_amount_piasters?: number | null
          paid_amount_piasters?: number | null
          payment_type?: string | null
          remaining_amount_piasters?: number | null
          return_status?: string | null
          shipping_amount_piasters?: number | null
          status?: string | null
          subtotal_amount_piasters?: number | null
          supplier_id?: string
          supplier_invoice_number?: string | null
          supplier_name?: string | null
          supplier_type?: string | null
          sync_version?: number | null
          tax_amount_piasters?: number | null
          total_amount_piasters?: number | null
          treasury_account_id?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          account_id: string
          branch_id: string
          brand_name: string | null
          category_name: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expected_buy_price_piasters: number | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          purchase_order_id: string
          quantity_received: number
          quantity_requested: number
          sync_version: number | null
          total_amount_piasters: number | null
          unit_level: number | null
          unit_name: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expected_buy_price_piasters?: number | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          purchase_order_id: string
          quantity_received?: number
          quantity_requested?: number
          sync_version?: number | null
          total_amount_piasters?: number | null
          unit_level?: number | null
          unit_name?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expected_buy_price_piasters?: number | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          purchase_order_id?: string
          quantity_received?: number
          quantity_requested?: number
          sync_version?: number | null
          total_amount_piasters?: number | null
          unit_level?: number | null
          unit_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expected_delivery_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          order_number: string | null
          status: string
          supplier_id: string
          supplier_name: string | null
          sync_version: number | null
          total_amount_piasters: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expected_delivery_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          order_number?: string | null
          status?: string
          supplier_id: string
          supplier_name?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expected_delivery_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          order_number?: string | null
          status?: string
          supplier_id?: string
          supplier_name?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_items: {
        Row: {
          account_id: string
          batch_number: string | null
          branch_id: string
          brand_name: string | null
          buy_price_piasters: number | null
          category_name: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          purchase_return_id: string
          quantity: number
          sync_version: number | null
          total_amount_piasters: number | null
          unit_level: number | null
        }
        Insert: {
          account_id: string
          batch_number?: string | null
          branch_id: string
          brand_name?: string | null
          buy_price_piasters?: number | null
          category_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          purchase_return_id: string
          quantity?: number
          sync_version?: number | null
          total_amount_piasters?: number | null
          unit_level?: number | null
        }
        Update: {
          account_id?: string
          batch_number?: string | null
          branch_id?: string
          brand_name?: string | null
          buy_price_piasters?: number | null
          category_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          purchase_return_id?: string
          quantity?: number
          sync_version?: number | null
          total_amount_piasters?: number | null
          unit_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_amount_piasters: number | null
          id: string
          is_deleted: boolean | null
          is_discount_percent: boolean | null
          last_modified: string | null
          original_purchase_id: string | null
          reason_notes: string | null
          return_number: string | null
          supplier_id: string
          supplier_name: string | null
          supplier_type: string | null
          sync_version: number | null
          total_amount_piasters: number | null
          treasury_account_id: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          id: string
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          last_modified?: string | null
          original_purchase_id?: string | null
          reason_notes?: string | null
          return_number?: string | null
          supplier_id: string
          supplier_name?: string | null
          supplier_type?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
          treasury_account_id?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          id?: string
          is_deleted?: boolean | null
          is_discount_percent?: boolean | null
          last_modified?: string | null
          original_purchase_id?: string | null
          reason_notes?: string | null
          return_number?: string | null
          supplier_id?: string
          supplier_name?: string | null
          supplier_type?: string | null
          sync_version?: number | null
          total_amount_piasters?: number | null
          treasury_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_original_purchase_id_fkey"
            columns: ["original_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          account_id: string
          branch_id: string
          card_received_piasters: number | null
          cash_received_piasters: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_type: string | null
          default_selling_price: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          delivery_agent_id: string | null
          delivery_agent_name: string | null
          id: string
          invoice_design: string | null
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          other_expenses: number
          paid_amount_piasters: number | null
          quotation_number: string | null
          remaining_amount_piasters: number | null
          sale_date: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          shipping_address: string | null
          shipping_details: string | null
          shipping_fees: number
          status: string | null
          sync_version: number | null
          tax_amount: number
          total_amount_piasters: number | null
          valid_until: string | null
        }
        Insert: {
          account_id: string
          branch_id: string
          card_received_piasters?: number | null
          cash_received_piasters?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          default_selling_price?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          delivery_agent_id?: string | null
          delivery_agent_name?: string | null
          id: string
          invoice_design?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          other_expenses?: number
          paid_amount_piasters?: number | null
          quotation_number?: string | null
          remaining_amount_piasters?: number | null
          sale_date?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          shipping_address?: string | null
          shipping_details?: string | null
          shipping_fees?: number
          status?: string | null
          sync_version?: number | null
          tax_amount?: number
          total_amount_piasters?: number | null
          valid_until?: string | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          card_received_piasters?: number | null
          cash_received_piasters?: number | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          default_selling_price?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          delivery_agent_id?: string | null
          delivery_agent_name?: string | null
          id?: string
          invoice_design?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          other_expenses?: number
          paid_amount_piasters?: number | null
          quotation_number?: string | null
          remaining_amount_piasters?: number | null
          sale_date?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          shipping_address?: string | null
          shipping_details?: string | null
          shipping_fees?: number
          status?: string | null
          sync_version?: number | null
          tax_amount?: number
          total_amount_piasters?: number | null
          valid_until?: string | null
        }
        Relationships: []
      }
      receipt_counters: {
        Row: {
          account_id: string | null
          branch_id: string | null
          counter_type: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          last_number: number
          prefix: string | null
          sync_version: number | null
        }
        Insert: {
          account_id?: string | null
          branch_id?: string | null
          counter_type: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          last_number?: number
          prefix?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string | null
          branch_id?: string | null
          counter_type?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          last_number?: number
          prefix?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      sale_invoice_items: {
        Row: {
          account_id: string
          barcode: string | null
          batch_number: string | null
          branch_id: string
          brand_name: string | null
          category_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_piasters: number | null
          expiry_date: string | null
          id: string
          invoice_id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          quantity: number
          sync_version: number | null
          total_price_piasters: number
          unit_level: number
          unit_name: string | null
          unit_price_piasters: number
        }
        Insert: {
          account_id: string
          barcode?: string | null
          batch_number?: string | null
          branch_id: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_piasters?: number | null
          expiry_date?: string | null
          id: string
          invoice_id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          quantity?: number
          sync_version?: number | null
          total_price_piasters?: number
          unit_level?: number
          unit_name?: string | null
          unit_price_piasters?: number
        }
        Update: {
          account_id?: string
          barcode?: string | null
          batch_number?: string | null
          branch_id?: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_piasters?: number | null
          expiry_date?: string | null
          id?: string
          invoice_id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          quantity?: number
          sync_version?: number | null
          total_price_piasters?: number
          unit_level?: number
          unit_name?: string | null
          unit_price_piasters?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sale_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_invoices: {
        Row: {
          account_id: string
          branch_id: string
          card_received_piasters: number
          cash_received_piasters: number
          cash_register_id: string | null
          cashier_id: string | null
          cashier_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_type: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_amount_piasters: number | null
          doctor_id: string | null
          id: string
          invoice_number: string | null
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          paid_amount_piasters: number | null
          payment_method: string | null
          payment_status: string | null
          remaining_amount_piasters: number | null
          shipping_status: string | null
          status: string | null
          subtotal_amount_piasters: number | null
          sync_version: number | null
          tax_amount_piasters: number | null
          total_amount_piasters: number | null
          total_quantity: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          card_received_piasters?: number
          cash_received_piasters?: number
          cash_register_id?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          doctor_id?: string | null
          id: string
          invoice_number?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          paid_amount_piasters?: number | null
          payment_method?: string | null
          payment_status?: string | null
          remaining_amount_piasters?: number | null
          shipping_status?: string | null
          status?: string | null
          subtotal_amount_piasters?: number | null
          sync_version?: number | null
          tax_amount_piasters?: number | null
          total_amount_piasters?: number | null
          total_quantity?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          card_received_piasters?: number
          cash_received_piasters?: number
          cash_register_id?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          doctor_id?: string | null
          id?: string
          invoice_number?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          paid_amount_piasters?: number | null
          payment_method?: string | null
          payment_status?: string | null
          remaining_amount_piasters?: number | null
          shipping_status?: string | null
          status?: string | null
          subtotal_amount_piasters?: number | null
          sync_version?: number | null
          tax_amount_piasters?: number | null
          total_amount_piasters?: number | null
          total_quantity?: number | null
        }
        Relationships: []
      }
      sales_agents: {
        Row: {
          account_id: string
          branch_id: string
          commission_percentage: number | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          notes: string | null
          phone: string | null
          sync_version: number | null
          total_commission_earned_piasters: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          commission_percentage?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          sync_version?: number | null
          total_commission_earned_piasters?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          commission_percentage?: number | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          sync_version?: number | null
          total_commission_earned_piasters?: number | null
        }
        Relationships: []
      }
      shipping_orders: {
        Row: {
          account_id: string
          branch_id: string
          created_at: string | null
          customer_id: string | null
          customer_name: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          delivery_address: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          invoice_id: string | null
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          order_number: string | null
          shipping_fee_piasters: number | null
          status: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          delivery_address: string
          driver_name?: string | null
          driver_phone?: string | null
          id: string
          invoice_id?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          order_number?: string | null
          shipping_fee_piasters?: number | null
          status?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          delivery_address?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          invoice_id?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          order_number?: string | null
          shipping_fee_piasters?: number | null
          status?: string | null
          sync_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sale_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          account_id: string
          adjusted_by: string | null
          adjusted_by_name: string | null
          adjustment_number: string
          adjustment_type: string | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          items: Json
          last_modified: string | null
          notes: string | null
          recovered_amount_piasters: number | null
          sync_version: number | null
          total_amount_piasters: number | null
        }
        Insert: {
          account_id: string
          adjusted_by?: string | null
          adjusted_by_name?: string | null
          adjustment_number: string
          adjustment_type?: string | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          items?: Json
          last_modified?: string | null
          notes?: string | null
          recovered_amount_piasters?: number | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Update: {
          account_id?: string
          adjusted_by?: string | null
          adjusted_by_name?: string | null
          adjustment_number?: string
          adjustment_type?: string | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          items?: Json
          last_modified?: string | null
          notes?: string | null
          recovered_amount_piasters?: number | null
          sync_version?: number | null
          total_amount_piasters?: number | null
        }
        Relationships: []
      }
      stock_reservations: {
        Row: {
          account_id: string
          branch_id: string
          created_by: string | null
          expires_at: string
          id: string
          medicine_id: string
          quantity_base_units: number
          reserved_at: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          created_by?: string | null
          expires_at: string
          id: string
          medicine_id: string
          quantity_base_units?: number
          reserved_at?: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          medicine_id?: string
          quantity_base_units?: number
          reserved_at?: string
          sync_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          account_id: string
          batch_number: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          quantity: number
          sync_version: number | null
          transfer_id: string
          unit_cost: number | null
          unit_level: number | null
          unit_name: string | null
        }
        Insert: {
          account_id: string
          batch_number?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          quantity?: number
          sync_version?: number | null
          transfer_id: string
          unit_cost?: number | null
          unit_level?: number | null
          unit_name?: string | null
        }
        Update: {
          account_id?: string
          batch_number?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          quantity?: number
          sync_version?: number | null
          transfer_id?: string
          unit_cost?: number | null
          unit_level?: number | null
          unit_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          account_id: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          from_branch_id: string
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          received_at: string | null
          received_by: string | null
          received_by_name: string | null
          shipped_at: string | null
          status: string
          sync_version: number | null
          to_branch_id: string
          transfer_number: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          from_branch_id: string
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          received_by_name?: string | null
          shipped_at?: string | null
          status?: string
          sync_version?: number | null
          to_branch_id: string
          transfer_number: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          from_branch_id?: string
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          received_by_name?: string | null
          shipped_at?: string | null
          status?: string
          sync_version?: number | null
          to_branch_id?: string
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      supplied_items: {
        Row: {
          account_id: string
          barcode: string | null
          batch_number: string | null
          bonus_quantity: number | null
          branch_id: string
          brand_name: string | null
          category_name: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          date: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_type: string | null
          discount_value: number | null
          expiry_date: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string | null
          medicine_name: string | null
          price_with_tax: number | null
          purchase_invoice_id: string | null
          quantity: number | null
          reference_number: string | null
          supplier_name: string | null
          sync_version: number | null
          tax_amount: number | null
          total_amount: number | null
          unit_level: number | null
          unit_name: string | null
          unit_price: number | null
        }
        Insert: {
          account_id: string
          barcode?: string | null
          batch_number?: string | null
          bonus_quantity?: number | null
          branch_id: string
          brand_name?: string | null
          category_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          date?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expiry_date?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string | null
          medicine_name?: string | null
          price_with_tax?: number | null
          purchase_invoice_id?: string | null
          quantity?: number | null
          reference_number?: string | null
          supplier_name?: string | null
          sync_version?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          unit_level?: number | null
          unit_name?: string | null
          unit_price?: number | null
        }
        Update: {
          account_id?: string
          barcode?: string | null
          batch_number?: string | null
          bonus_quantity?: number | null
          branch_id?: string
          brand_name?: string | null
          category_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          date?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expiry_date?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string | null
          medicine_name?: string | null
          price_with_tax?: number | null
          purchase_invoice_id?: string | null
          quantity?: number | null
          reference_number?: string | null
          supplier_name?: string | null
          sync_version?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          unit_level?: number | null
          unit_name?: string | null
          unit_price?: number | null
        }
        Relationships: []
      }
      supplier_customers: {
        Row: {
          account_id: string
          address: string | null
          address_line1: string | null
          address_line2: string | null
          branch_id: string
          city: string | null
          contact_code: string | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          customer_balance: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_percent: number | null
          dob: string | null
          email: string | null
          entity_type: string | null
          family_name: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          middle_name: string | null
          name: string
          neighborhood: string | null
          nickname: string | null
          notes: string | null
          opening_customer_balance: number | null
          opening_supplier_balance: number | null
          payment_term_days: number | null
          phone: string | null
          prefix: string | null
          secondary_phone: string | null
          shipping_address: string | null
          state: string | null
          supplier_balance: number | null
          sync_version: number | null
          tax_id: string | null
          zip_code: string | null
        }
        Insert: {
          account_id: string
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          branch_id: string
          city?: string | null
          contact_code?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_balance?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_percent?: number | null
          dob?: string | null
          email?: string | null
          entity_type?: string | null
          family_name?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          middle_name?: string | null
          name: string
          neighborhood?: string | null
          nickname?: string | null
          notes?: string | null
          opening_customer_balance?: number | null
          opening_supplier_balance?: number | null
          payment_term_days?: number | null
          phone?: string | null
          prefix?: string | null
          secondary_phone?: string | null
          shipping_address?: string | null
          state?: string | null
          supplier_balance?: number | null
          sync_version?: number | null
          tax_id?: string | null
          zip_code?: string | null
        }
        Update: {
          account_id?: string
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          branch_id?: string
          city?: string | null
          contact_code?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_balance?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_percent?: number | null
          dob?: string | null
          email?: string | null
          entity_type?: string | null
          family_name?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          middle_name?: string | null
          name?: string
          neighborhood?: string | null
          nickname?: string | null
          notes?: string | null
          opening_customer_balance?: number | null
          opening_supplier_balance?: number | null
          payment_term_days?: number | null
          phone?: string | null
          prefix?: string | null
          secondary_phone?: string | null
          shipping_address?: string | null
          state?: string | null
          supplier_balance?: number | null
          sync_version?: number | null
          tax_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          account_id: string
          address: string | null
          balance_piasters: number | null
          branch_id: string
          code: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          notes: string | null
          opening_balance_piasters: number | null
          payment_terms_days: number | null
          phone: string | null
          sync_version: number | null
          tax_number: string | null
        }
        Insert: {
          account_id: string
          address?: string | null
          balance_piasters?: number | null
          branch_id: string
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          notes?: string | null
          opening_balance_piasters?: number | null
          payment_terms_days?: number | null
          phone?: string | null
          sync_version?: number | null
          tax_number?: string | null
        }
        Update: {
          account_id?: string
          address?: string | null
          balance_piasters?: number | null
          branch_id?: string
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          notes?: string | null
          opening_balance_piasters?: number | null
          payment_terms_days?: number | null
          phone?: string | null
          sync_version?: number | null
          tax_number?: string | null
        }
        Relationships: []
      }
      suspended_sale_items: {
        Row: {
          account_id: string
          barcode: string | null
          batch_number: string | null
          branch_id: string
          brand_name: string | null
          category_name: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          medicine_id: string
          medicine_name: string
          quantity: number
          suspended_sale_id: string
          sync_version: number | null
          total_price_piasters: number | null
          unit_level: number | null
          unit_name: string | null
          unit_price_piasters: number | null
        }
        Insert: {
          account_id: string
          barcode?: string | null
          batch_number?: string | null
          branch_id: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id: string
          medicine_name: string
          quantity?: number
          suspended_sale_id: string
          sync_version?: number | null
          total_price_piasters?: number | null
          unit_level?: number | null
          unit_name?: string | null
          unit_price_piasters?: number | null
        }
        Update: {
          account_id?: string
          barcode?: string | null
          batch_number?: string | null
          branch_id?: string
          brand_name?: string | null
          category_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          medicine_id?: string
          medicine_name?: string
          quantity?: number
          suspended_sale_id?: string
          sync_version?: number | null
          total_price_piasters?: number | null
          unit_level?: number | null
          unit_name?: string | null
          unit_price_piasters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "suspended_sale_items_suspended_sale_id_fkey"
            columns: ["suspended_sale_id"]
            isOneToOne: false
            referencedRelation: "suspended_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      suspended_sales: {
        Row: {
          account_id: string
          branch_id: string
          cashier_id: string | null
          cashier_name: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_type: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          discount_amount_piasters: number | null
          draft_number: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          notes: string | null
          paid_amount_piasters: number | null
          payment_method: string | null
          payment_status: string | null
          remaining_amount_piasters: number | null
          shipping_status: string | null
          status: string | null
          subtotal_amount_piasters: number | null
          sync_version: number | null
          total_amount_piasters: number | null
          total_quantity: number | null
        }
        Insert: {
          account_id: string
          branch_id: string
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          draft_number?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          paid_amount_piasters?: number | null
          payment_method?: string | null
          payment_status?: string | null
          remaining_amount_piasters?: number | null
          shipping_status?: string | null
          status?: string | null
          subtotal_amount_piasters?: number | null
          sync_version?: number | null
          total_amount_piasters?: number | null
          total_quantity?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          discount_amount_piasters?: number | null
          draft_number?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          notes?: string | null
          paid_amount_piasters?: number | null
          payment_method?: string | null
          payment_status?: string | null
          remaining_amount_piasters?: number | null
          shipping_status?: string | null
          status?: string | null
          subtotal_amount_piasters?: number | null
          sync_version?: number | null
          total_amount_piasters?: number | null
          total_quantity?: number | null
        }
        Relationships: []
      }
      system_configs: {
        Row: {
          account_id: string
          branch_id: string | null
          config_key: string
          config_value: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          branch_id?: string | null
          config_key: string
          config_value?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          branch_id?: string | null
          config_key?: string
          config_value?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      therapeutic_groups: {
        Row: {
          account_id: string
          code: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_quick_item: boolean | null
          last_modified: string | null
          name: string
          sync_version: number | null
        }
        Insert: {
          account_id: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name: string
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          code?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_quick_item?: boolean | null
          last_modified?: string | null
          name?: string
          sync_version?: number | null
        }
        Relationships: []
      }
      treasuries: {
        Row: {
          account_id: string
          balance_piasters: number
          branch_id: string
          code: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          id: string
          is_active: boolean
          is_deleted: boolean | null
          is_main: boolean
          last_modified: string | null
          name: string
          notes: string | null
          sync_version: number | null
        }
        Insert: {
          account_id: string
          balance_piasters?: number
          branch_id: string
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id: string
          is_active?: boolean
          is_deleted?: boolean | null
          is_main?: boolean
          last_modified?: string | null
          name: string
          notes?: string | null
          sync_version?: number | null
        }
        Update: {
          account_id?: string
          balance_piasters?: number
          branch_id?: string
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          is_main?: boolean
          last_modified?: string | null
          name?: string
          notes?: string | null
          sync_version?: number | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          account_id: string
          activity_type: string
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          device_id: string | null
          id: string
          ip_address: string | null
          is_deleted: boolean | null
          last_modified: string | null
          sync_version: number | null
          user_id: string | null
        }
        Insert: {
          account_id: string
          activity_type: string
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          device_id?: string | null
          id: string
          ip_address?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
          user_id?: string | null
        }
        Update: {
          account_id?: string
          activity_type?: string
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          is_deleted?: boolean | null
          last_modified?: string | null
          sync_version?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_id: string
          active_device_id: string | null
          all_branches_access: boolean | null
          allow_login: boolean
          allowances_piasters: number | null
          allowed_branch_ids: Json | null
          assigned_branch_id: string | null
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_branch_name: string | null
          bank_name: string | null
          bank_swift_code: string | null
          base_salary_piasters: number | null
          blood_group: string | null
          created_at: string
          current_address: string | null
          custom_field_1: string | null
          custom_field_2: string | null
          custom_field_3: string | null
          custom_field_4: string | null
          date_of_birth: string | null
          deductions_piasters: number | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          department: string | null
          email: string
          emergency_phone: string | null
          employee_pin_code: string | null
          employment_type: string | null
          enable_service_pin: boolean | null
          facebook_url: string | null
          family_name: string | null
          gender: string | null
          id: string
          is_active: boolean
          is_deleted: boolean
          is_quick_item: boolean | null
          last_login: string | null
          last_modified: string
          marital_status: string | null
          max_discount_percentage: number | null
          name: string
          name_in_national_id: string | null
          national_id: string | null
          password_hash: string
          permanent_address: string | null
          phone: string | null
          role: string
          salary_period: string | null
          sales_commission_percentage: number | null
          secondary_phone: string | null
          social_media_1: string | null
          social_media_2: string | null
          sync_version: number
          tax_payer_id: string | null
          title: string | null
          twitter_url: string | null
          username: string | null
        }
        Insert: {
          account_id: string
          active_device_id?: string | null
          all_branches_access?: boolean | null
          allow_login?: boolean
          allowances_piasters?: number | null
          allowed_branch_ids?: Json | null
          assigned_branch_id?: string | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_branch_name?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          base_salary_piasters?: number | null
          blood_group?: string | null
          created_at?: string
          current_address?: string | null
          custom_field_1?: string | null
          custom_field_2?: string | null
          custom_field_3?: string | null
          custom_field_4?: string | null
          date_of_birth?: string | null
          deductions_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          department?: string | null
          email: string
          emergency_phone?: string | null
          employee_pin_code?: string | null
          employment_type?: string | null
          enable_service_pin?: boolean | null
          facebook_url?: string | null
          family_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean
          is_deleted?: boolean
          is_quick_item?: boolean | null
          last_login?: string | null
          last_modified?: string
          marital_status?: string | null
          max_discount_percentage?: number | null
          name: string
          name_in_national_id?: string | null
          national_id?: string | null
          password_hash?: string
          permanent_address?: string | null
          phone?: string | null
          role?: string
          salary_period?: string | null
          sales_commission_percentage?: number | null
          secondary_phone?: string | null
          social_media_1?: string | null
          social_media_2?: string | null
          sync_version?: number
          tax_payer_id?: string | null
          title?: string | null
          twitter_url?: string | null
          username?: string | null
        }
        Update: {
          account_id?: string
          active_device_id?: string | null
          all_branches_access?: boolean | null
          allow_login?: boolean
          allowances_piasters?: number | null
          allowed_branch_ids?: Json | null
          assigned_branch_id?: string | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_branch_name?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          base_salary_piasters?: number | null
          blood_group?: string | null
          created_at?: string
          current_address?: string | null
          custom_field_1?: string | null
          custom_field_2?: string | null
          custom_field_3?: string | null
          custom_field_4?: string | null
          date_of_birth?: string | null
          deductions_piasters?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          department?: string | null
          email?: string
          emergency_phone?: string | null
          employee_pin_code?: string | null
          employment_type?: string | null
          enable_service_pin?: boolean | null
          facebook_url?: string | null
          family_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          is_quick_item?: boolean | null
          last_login?: string | null
          last_modified?: string
          marital_status?: string | null
          max_discount_percentage?: number | null
          name?: string
          name_in_national_id?: string | null
          national_id?: string | null
          password_hash?: string
          permanent_address?: string | null
          phone?: string | null
          role?: string
          salary_period?: string | null
          sales_commission_percentage?: number | null
          secondary_phone?: string | null
          social_media_1?: string | null
          social_media_2?: string | null
          sync_version?: number
          tax_payer_id?: string | null
          title?: string | null
          twitter_url?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_reserve_stock: {
        Args: {
          p_medicine_id: string
          p_requested_qty: number
          p_unit_level?: number
        }
        Returns: boolean
      }
      count_filtered_medicines: {
        Args: {
          p_branch_id: string
          p_expiring_days?: number
          p_filter?: string
          p_search?: string
        }
        Returns: number
      }
      create_employee_auth_user: {
        Args: {
          p_account_id: string
          p_assigned_branch_id: string
          p_email: string
          p_id: string
          p_name: string
          p_password: string
          p_role: string
        }
        Returns: Json
      }
      current_user_account_id: { Args: never; Returns: string }
      current_user_branch_id: { Args: never; Returns: string }
      deduct_batch_unit_stock: {
        Args: {
          p_batch_id: string
          p_deduct_quantity: number
          p_unit_level: number
        }
        Returns: boolean
      }
      delete_authenticated_user: { Args: never; Returns: undefined }
      delete_employee_account: {
        Args: { p_account_id: string; p_user_id: string }
        Returns: Json
      }
      factory_reset_account: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      format_medicine_quantity_breakdown: {
        Args: { p_medicine_id: string }
        Returns: string
      }
      get_filtered_medicines: {
        Args: {
          p_branch_id: string
          p_expiring_days?: number
          p_filter?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          account_id: string
          barcode: string | null
          branch_id: string
          brand_id: string | null
          brand_name: string | null
          buy_price_piasters: number | null
          category_id: string | null
          category_name: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          description: string | null
          dosage_form: string | null
          expiry_alert_enabled: boolean | null
          expiry_tracking_enabled: boolean | null
          generic_name: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_deleted: boolean
          is_quick_item: boolean | null
          is_sales_suspended: boolean | null
          is_taxable: boolean | null
          last_modified: string
          manufacturer: string | null
          min_reorder_level: number | null
          name: string
          name_ar: string | null
          name_en: string | null
          new_sell_price_piasters: number | null
          notes: string | null
          old_sell_price_piasters: number | null
          opening_cost_piasters: number | null
          opening_quantity: number | null
          package_size: string | null
          package_type: string | null
          product_type_id: string | null
          product_type_name: string | null
          sell_price_piasters: number | null
          shelf_location: string | null
          strength: string | null
          sync_version: number
          target_profit_margin_percentage: number | null
          tax_type: string | null
          tax_value: number | null
          therapeutic_group_id: string | null
          therapeutic_group_name: string | null
          total_quantity: number | null
          total_quantity_base_units: number | null
          unit_name: string | null
          unit1_buy_price: number | null
          unit1_name: string | null
          unit1_quantity: number | null
          unit1_sell_price: number | null
          unit2_buy_price: number | null
          unit2_enabled: boolean | null
          unit2_factor: number | null
          unit2_name: string | null
          unit2_quantity: number | null
          unit2_sell_price: number | null
          unit3_buy_price: number | null
          unit3_enabled: boolean | null
          unit3_factor: number | null
          unit3_name: string | null
          unit3_quantity: number | null
          unit3_sell_price: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "medicines"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_medicine_card_summary: {
        Args: { p_medicine_id: string }
        Returns: Json
      }
      get_nearest_expiring_batches_for_pos: {
        Args: {
          p_medicine_id: string
          p_requested_qty?: number
          p_requested_unit_level?: number
        }
        Returns: {
          available_quantity: number
          batch_id: string
          batch_number: string
          days_until_expiry: number
          expiry_date: string
          suggested_units_to_take: number
        }[]
      }
      get_next_branch_draft_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_free_return_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_invoice_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_invoice_return_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_purchase_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_purchase_order_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_purchase_return_number: {
        Args: { p_branch_id: string }
        Returns: string
      }
      get_next_branch_shift_number: {
        Args: { p_branch_id: string }
        Returns: number
      }
      get_profit_loss_report: {
        Args: {
          p_account_id: string
          p_branch_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          audit_gains_losses_piasters: number
          cogs_piasters: number
          earned_discounts_piasters: number
          ending_inventory_buy_piasters: number
          ending_inventory_sell_piasters: number
          gross_profit_piasters: number
          net_profit_piasters: number
          net_purchases_piasters: number
          net_sales_piasters: number
          opening_inventory_buy_piasters: number
          opening_inventory_sell_piasters: number
          purchase_returns_piasters: number
          purchases_shipping_piasters: number
          sales_discounts_piasters: number
          sales_returns_piasters: number
          sales_shipping_piasters: number
          total_expenses_piasters: number
          total_purchases_piasters: number
          total_salaries_piasters: number
          total_sales_piasters: number
        }[]
      }
      is_account_owner: { Args: { p_account_id: string }; Returns: boolean }
      next_receipt_number: {
        Args: { p_branch_id: string; p_counter_type: string; p_prefix: string }
        Returns: string
      }
      recalculate_medicine_stock: {
        Args: { p_medicine_id: string }
        Returns: number
      }
      release_stock_reservations: {
        Args: { p_medicine_id: string }
        Returns: undefined
      }
      reset_operational_transactions: {
        Args: { p_account_id: string; p_user_id?: string }
        Returns: undefined
      }
      user_has_branch_access: {
        Args: { p_branch_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
