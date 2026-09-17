# إرشادات وقواعد العمل على مشروع Falcon ERP (`erp_system_net`)

## 1. نظرة عامة على المشروع (Project Overview)
نظام **Falcon ERP** هو نظام إدارة صيدليات وتجزئة متقدم، مبني وفق معمارية **Offline-First** لضمان استمرارية العمل في نقاط البيع (POS) وإدارة المخازن والفواتير بكفاءة عالية وبشكل مستقل عن انقطاع الإنترنت، مع مزامنة سحابية لحظية وثنائية الاتجاه مع Supabase.

---

## 2. البنية التقنية (Tech Stack)
- **الإطار البرمجي:** Next.js 16 (App Router) + React 19 + TypeScript (Strict Mode).
- **محرك التخزين المحلي (Offline DB):** Dexie.js (IndexedDB) - متوافق مع أجهزة نقاط البيع الكلاسيكية (Windows 7 / Chrome 109+).
- **الواجهة الخلفية والمزامنة السحابية:** Supabase (PostgreSQL + Realtime Subscriptions).
- **إدارة الحالة (State Management):** Zustand.
- **التصميم والواجهة:** Tailwind CSS v4 + Radix UI Primitives + Lucide React + Sonner (Toasts)، مع دعم كامل للاتجاه من اليمين لليسار (RTL).

---

## 3. الهيكل المعماري (Architecture & Structure)
المشروع مبني وفق معمارية الوحدات المستقلة الموجهة لمجالات الأعمال (Modular Domain-Driven Architecture):
- `src/core/`: البنية التحتية ومحركات النظام:
  - `db/`: مخطط قاعدة البيانات المحلية (`app_database.ts`) وبيانات التهيئة الأولية (`seed.ts`).
  - `sync/`: محرك المزامنة المتكامل (`sync_coordinator.ts`, `sync_queue_manager.ts`, `pull_sync_service.ts`, `realtime_sync_listener.ts`, `network_listener.ts`).
  - `supabase/`: عميل Supabase وإعدادات الربط السحابي.
  - `state/`: مخازن حالة التطبيق المشتركة عبر Zustand.
  - `hooks/`: الخطافات البرمجية المساعدة المشتركة.
- `src/modules/`: وحدات منطق الأعمال:
  - `sales/`: نقاط البيع (POS)، فواتير المبيعات، المرتجعات، وإدارة الورديات (Shifts).
  - `purchases/`: فواتير المشتريات، الموردين، وإشعارات الخصم والمرتجع.
  - `inventory/`: المنتجات، الوحدات، التصنيفات، حركات المخزون، والباركود.
  - `treasury/`: الخزائن، المصروفات، والحسابات وسندات القبض والصرف.
  - `contacts/`: العملاء، الموردين، وكشوف الحسابات.
  - `employees/`: إدارة الموظفين والصلاحيات.
  - `settings/`: إعدادات النظام، الفروع، الطابعات، وتفضيلات الفواتير.
  - `auth/`: المصادقة والجلسات وإدارة الأدوار.
- `src/types/`: تعريفات TypeScript الموحدة لجميع الكيانات والعمليات.
- `src/components/`: مكونات واجهة المستخدم التشاركية.

---

## 4. القواعد والمعايير الصارمة (Strict Engineering Guidelines)

### أ. معمارية العمل دون اتصال (Offline-First)
1. **أولوية الكتابة المحلية (Local Write First):**
   - تتم كافة عمليات الإنشاء والتعديل والحذف أولاً في قاعدة بيانات Dexie المحلية.
   - لا يجوز أبداً حجب تفاعل المستخدم أو شاشات نقاط البيع بانتظار استجابة الشبكة.
2. **تسجيل المزامنة (Sync Queue):**
   - يُدرج كل إجراء محلي يتطلب المزامنة في طابور `sync_queue` كعنصر (`SyncQueueItem`).
   - يتولى `sync_coordinator` معالجة الطابور ورفعه إلى Supabase تلقائياً فور توفر الاتصال.
3. **المعرفات الموحدة (Client-Generated UUIDs):**
   - يجب دائماً توليد معرف السجل `id` في العميل باستخدام UUID v4، لمنع أي تعارض في أرقام السجلات بين الفروع المتعددة.
4. **الحذف المنطقي (Soft Deletes):**
   - تُحذف السجلات منطقياً باستخدام حقول مثل `is_deleted` أو `deleted_at` لضمان تعميم أمر الحذف سحابياً ولكافة الأجهزة المتزامنة.

### ب. تكامل المزامنة وفض التعارضات (Sync & Conflict Resolution)
- تطبيق قاعدة آخر تحديث معتمد (Last-Write-Wins) استناداً إلى الحقل الزمني `updated_at`.
- التحقق من عدم تكرار السجلات (Deduplication) قبل إدراجها محلياً أو سحابياً بالاعتماد على الـ Primary Key الموحد.
- ضمان أن تكون عمليات المزامنة خاملة ومتكررة بأمان (Idempotent).

### ج. توافقية Next.js 16 و React 19
- استخدام `'use client'` في بداية كل ملف يحتاج إلى الوصول لـ IndexedDB، Dexie، واجهات المتصفح، أو Zustand Stores.
- التعامل مع معلمات المسار (`params` و `searchParams`) في Next.js 16 كوعود (`Promises`) وفق توثيق الإصدار الحديث.
- الحرص على عدم إبطاء الـ Main Thread، واستغلال الفهارس (Indexes) المعرفة في `app_database.ts` لعمليات الاستعلام السريعة للباركود والبحث.

### د. جودة الشفرة البرمجية والواجهات
- التزام صارم بـ TypeScript، وتجنب استخدام `any`.
- دعم كامل ومثالي للواجهة العربية ومحاذاة الـ RTL مع استخدام اتجاهات النصوص والمسافات الملائمة.
- معالجة شاملة للأخطاء (Error Handling) والتعامل الهادئ مع حالات انقطاع الشبكة أو أخطاء المزامنة مع إظهار إشعارات مناسبة عبر Sonner.

---


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## 5. بيانات ومعلومات حساسة (Sensitive Data & Credentials)
- **Supabase Database Token:** `sbp_v0_64c8332772a82202da829b55713ff276b70b2188` (يُستخدم للربط والمزامنة مع قاعدة البيانات السحابية).
