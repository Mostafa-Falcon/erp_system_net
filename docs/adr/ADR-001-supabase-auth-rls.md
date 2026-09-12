# ADR-001 — Supabase Auth + RLS لفرض العزل متعدد الأطراف

- **التاريخ:** 2026-09-08
- **الحالة:** مقترح (بانتظار اعتماد Al-Saqr قبل التنفيذ)
- **المشروع:** erp_system_net (ref: `swsmmnuisefafzofezus`)

## Context (السياق)

التطبيق offline-first: كل البيانات محلية في IndexedDB (Dexie) وترسل للخارج من
خلال `SyncQueueManager` (Outbox) ثم `SyncCoordinator` يرفعها عبر مفتاح anon
publishable. بعد إنشاء المشروع السحابي الجديد ودفع الـ migrations، **لا توجد
سياسات RLS إطلاقاً** — أي حامل للمفتاح العام (الظاهر في سكريبت المتصفح بالضرورة)
يستطيع قراءة/تعديل/حذف بيانات **كل الجهات** العاملة بالنظام. هذا انتهاك لمبدأ
الـ Principle of Least Privilege ولبند Falcon الصريح: "RLS: every Supabase table
is protected by a Row Level Security policy".

نظام المصادقة الحالي محلي بالكامل: `AuthRepository.loginWithPin/loginWithEmail`
يسجل دخولاً محلياً ويخزن المستخدم في localStorage، و`users.id` الحالية قيم عشوائية
uuid لا ترتبط بـ `auth.users` في Supabase إطلاقاً. بدون ربط الهوية مع Supabase Auth
لا توجد طريقة آمنة لتحديد `org_id` الموثوق في الـ JWT.

## Decision (القرار)

اعتماد **Supabase Auth كطبقة هوية** مع **RLS معزولة بالمنشأة (org_id)** عبر نمط
"المنشأة عبر دالة":

1. **ربط الهوية:** `users.id` محلياً = `auth.users.id` في Supabase (نفس `uuid`).
   عند التسجيل أونلاين، يُنشأ السجل أولاً في `auth.users` عبر `signUp` ثم تُنشأ
   المنشأة والفرع والمستودع والخزينة وحساب `super_admin` عبر RPC
   `register_organization` (SECURITY DEFINER) بذات الـ uid.
2. **دالة تعيين المنشأة:** دالة SQL `current_org_id()` ترجع
   `select org_id from users where id = auth.uid()`. كل سياسات RLS تقارن عمود
   `org_id` بالدالة (`using` و`with check`).
3. **وضع الدخول:**
   - `loginWithEmail` أونلاين → `signInWithPassword` → جلسة Supabase في
     `supabase-client` (persistSession مفعّل أصلاً) → محلي `users.id = uid`.
   - `loginWithPin` → **محلي فقط** (احتياط عدم الاتصال) دون جلسة سحابية؛
     خلالها يتوقف الدفع السحابي بآلية أمان محلية.
4. **ال«Outbox» محصّن:** `SyncCoordinator` لا يرفع أي عنصر دون جلسة Supabase
   فعّالة؛ وأثناء الرفع تُزال أسرار محلية (`pin_code_hash`) من الحمل.
5. **التسجيل دون اتصال:** يبقى المسار الحالي (إنشاء محلي uuid عشوائي مع انتظار
   في الـ Outbox) كاحتياط؛ عند أول دخول أونلاين يُعاد ربط الهوية إن أمكن
   (فئة منفصلة مدرجة تحت «الحدود»).

## Rationale (المبرر)

- المفتاح الوحيد المقبول لنموذج "سجل دخول PIN محلي سريع" مع "سحابة مشتركة" هو
  ربط الـ auth بالجلسة الفعلية؛ أي مفتاح عام بدون هوية يفتح باباً لكشف جميع
  البيانات.
- `SECURITY DEFINER` في `register_organization` تحل مشكلة الـ chicken-and-egg
  (لا يمكن إدراج أول مستخدم بالسياسات أعلاه قبل وجود المنشأة أصلاً).
- يُبقي `persistSession: true` الجلسة حية عبر التنقل، فلا تتغير بنية
  `supabase-client` الموجود.
- نفصل PIN المحلي عن كلمة مرور Supabase: كلمة المرور تذهب إلى `auth.users` فقط،
  و`pin_code_hash` يبقى للمحلي (شتّان بينهما أمنياً).

## Consequences (النتائج)

- **الإيجابي:** عزلة كاملة عبر الاستعلامات RLS لجميع الجداول؛ لا يمكن لأي طرف
  رؤية بيانات طرف آخر حتى مع كشف المفتاح العام.
- **السعر:** التغيير يمس `register`, `login`, `auth_repository`, وأي استدعاء
  سحابي يمر بالجلسة؛ وقد يحتاج مستخدمو الفروع القائمة لإعادة تسجيل الدخول مرة
  واحدة بعد إطلاق النسخة الأمنية.
- **سلوك دون اتصال:** PIN يعمل محلياً كالمعتاد؛ المزامنة تتجمد حتى دخول أونلاين.
- **السيناريو الهامشي:** مستخدمون سُجلوا محلياً (uuid عشوائي) بقوائم سحابية
  سابقة لن تُربط تلقائياً؛ تُدار بالترحيل اليدوي (داخل النطاق لاحقاً عند الحاجة).
- **الأمان:** إزالة `pin_code_hash` من الحمل السحابي لمنع تسريب PIN لو تَعرضت
  بيانات org ما للاطلاع؛ وثقب صغير متبقّ هو أن الجداول بين إزالة وصول anon
  وتفعيل RLS «مفتوحة» — سنغلقها في نفس migration.

## Scope (النطاق)

1. Migration 04: إغلاق anon نهائياً، دالة `current_org_id()`, RPC
   `register_organization`, سياسات RLS لكل الجداول (بما فيها جداول الـ items التي
   لا تملك `org_id` عبر join على الأب).
2. تسجيل أونلاين عبر `signUp` + RPC؛ محلي دون اتصال كما هو.
3. `AuthRepository` + `useSessionStore` ربط الهوية والجلسة؛ جلسة PIN محلّية فقط.
4. `SyncCoordinator` حاجز الجلسة + إزالة `pin_code_hash` و`sync_status`.
5. تحقق نهائي: lint + build (عادي/static) + `db push` + اختبار حقيقي لسلوك RLS
   (قراءة طرف آخر مرفوضة).