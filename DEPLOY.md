# دليل النشر على DigitalOcean App Platform

هذا الدليل يشرح كيفية نشر مشروع Quran-Data (الـAPI + الواجهة العربية) على
DigitalOcean App Platform مع ربطه بدومين خاص و SSL مجاني.

## نظرة عامة على المعمارية

```
                     ┌──────────────────────────────────────┐
                     │  https://your-domain.com             │
                     │  ─────────────────────────────────  │
   ┌─────────────┐   │  Gateway تلقائي (HTTPS + CDN)        │
   │ المتصفح     │──→│                                      │
   └─────────────┘   │  /api/*  →  api  (Web Service)       │
                     │  /data/* →  api  (Web Service)       │
                     │  /*      →  client (Static Site)     │
                     └──────────────────────────────────────┘
```

- **api** (Web Service): Node.js/Express من `Dockerfile` الجذر — $5/شهر
- **client** (Static Site): React+Vite يُبنى من مجلد `/client` ويُخدَم عبر CDN — مجاني

التكلفة الإجمالية: **~$5/شهر** + شهادة SSL مجانية + DNS مجاني.

---

## الخطوة 1 — رفع المستودع إلى GitHub

تأكد أن آخر تغييرات في `version-2.0` مدفوعة:

```bash
cd /Users/eyadrasmi/Quran-Data
git status
git add .
git commit -m "chore: prepare for DigitalOcean App Platform deployment"
git push origin version-2.0
```

(الريبو المستهدف: `eyadrasmi78/Quran-Data`)

---

## الخطوة 2 — إنشاء التطبيق على App Platform

ملف `.do/app.yaml` جاهز ومضبوط. لاستخدامه:

### الطريقة أ — عبر الـ Dashboard (الأسهل)

1. افتح [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) ثم **Create App**.
2. اختر **GitHub** كمصدر، فوّض الوصول لـ `eyadrasmi78/Quran-Data`.
3. اختر فرع `version-2.0`.
4. عند صفحة **Resources** سيكتشف App Platform المكوّنين تلقائياً:
   - `api` كـ Web Service من `Dockerfile`
   - أنشئ يدوياً **Static Site** للواجهة:
     - **Source Directory**: `/client`
     - **Build Command**: `npm install && npm run build`
     - **Output Directory**: `dist`
     - أضف متغير بيئة `VITE_API_URL=/api` (Build-time)
5. في **Settings → Component Routes**:
   - api: أضف مسارين `/api` و `/data`
   - client: مسار `/`
6. اختر **Plan**: Basic-XXS لـ api ($5)، Static site مجاني.
7. اضغط **Create Resources** — البناء الأول يستغرق ~5–8 دقائق.

### الطريقة ب — استخدام الـ App Spec (أنظف وأسرع)

استخدم ملف `.do/app.yaml` المُجهَّز:

```bash
# تثبيت doctl إن لم يكن مثبتاً
brew install doctl

# تسجيل الدخول
doctl auth init

# إنشاء التطبيق من الـ spec
doctl apps create --spec .do/app.yaml
```

سيعطيك ID للتطبيق ورابطاً مؤقتاً مثل `https://quran-data-XXXXX.ondigitalocean.app`.

---

## الخطوة 3 — التحقق الأوّلي

بعد اكتمال البناء، اختبر:

```bash
APP_URL=https://quran-data-XXXXX.ondigitalocean.app

curl -s -o /dev/null -w "homepage:    %{http_code}\n" $APP_URL/
curl -s -o /dev/null -w "api/surahs:  %{http_code}\n" $APP_URL/api/surahs
curl -s -o /dev/null -w "page image:  %{http_code}\n" $APP_URL/data/quran_image/1.png
curl -s -o /dev/null -w "SPA route:   %{http_code}\n" $APP_URL/surah/2
```

كلها يجب أن ترجع 200.

---

## الخطوة 4 — ربط الدومين الخاص

### 4.1 — في DigitalOcean

1. افتح App في الـ Dashboard → **Settings → Domains → Add Domain**.
2. أدخل دومينك (مثال: `quran.example.com` أو `example.com`).
3. اختر **You manage your domain** إن كان DNS عند مزوّدك (Namecheap، GoDaddy، Cloudflare، إلخ)، أو **DigitalOcean** إن كنت ستنقل الـDNS إلى DO.

### 4.2 — في إعدادات DNS عند مزوّد الدومين

أضف **CNAME record** يشير إلى رابط App Platform:

| النوع | الاسم | القيمة |
|------|------|------|
| `CNAME` | `quran` (أو `@` للجذر) | `quran-data-XXXXX.ondigitalocean.app` |

> ملاحظة: لا يدعم بعض المزوّدين CNAME على الـ apex (`@`). في هذه الحالة استخدم
> **A record** للـ IP الذي يقدّمه DO أو ALIAS/ANAME.

### 4.3 — انتظر انتشار DNS (5–30 دقيقة)

App Platform سيُصدر شهادة Let's Encrypt تلقائياً بمجرد التحقق من الدومين.
ستظهر علامة **✓ Active SSL** في الـ Dashboard.

اختبر:

```bash
curl -I https://quran.example.com/
curl -I https://quran.example.com/api/surahs
```

---

## الخطوة 5 — النشر التلقائي عند كل push

`deploy_on_push: true` مفعّل في الـ spec. لذلك:

```bash
# عدّل أي ملف
git add .
git commit -m "feat: add some new feature"
git push origin version-2.0
```

App Platform سيعيد البناء والنشر تلقائياً (~3–5 دقائق).

---

## ملاحظات تشغيل وتكلفة

### الحدود في الباقة الأساسية

- **api basic-xxs**: 512MB RAM, 1 vCPU shared — كافٍ تماماً لهذا المشروع
  (الـ Quran data ~133MB ثابتة، ولا قاعدة بيانات).
- **Static site**: حركة وحجم غير محدودَين فعلياً، يُخدَم عبر Cloudflare CDN مدمج.
- **Outbound bandwidth**: 1TB/شهر مجاناً، ثم $0.01/GB.

### كيف تخفّض التكلفة لاحقاً

- لو لاحظت استهلاك RAM عالٍ، يمكنك التوسعة لـ basic-xs (1GB) بـ $12/شهر.
- لإضافة instance ثانٍ (HA): زد `instance_count` إلى 2 → سيكلّفك ضعف القيمة.
- لو الصور ضغطت bandwidth كثيراً، انقلها لـ DO Spaces ($5/شهر بـ 250GB CDN).

### المراقبة والـ Logs

```bash
doctl apps logs <APP_ID> --type run --follow         # سجلات الـ API
doctl apps logs <APP_ID> --type build --component client  # سجلات بناء الواجهة
```

أو من الـ Dashboard: **Apps → Quran-Data → Runtime Logs / Build Logs**.

### Rollback سريع

```bash
doctl apps create-deployment <APP_ID> --force-rebuild
# أو من الـ Dashboard اضغط "Deploy from older commit"
```

---

## استكشاف الأخطاء الشائعة

| العَرَض | السبب | الحل |
|--------|------|------|
| 502 Bad Gateway على `/api/*` | الـ API لم يستمع على `0.0.0.0:5000` | تحقّق أن `PORT=5000` ضمن env vars |
| Static site يرجع 404 لمسارات SPA | `catchall_document` ناقص | تأكّد أنه `index.html` في الـ spec |
| الصور لا تظهر | مسار `/data` غير موجّه لـ api | تحقّق من **Routes** في إعدادات api |
| Build فاشل: "vite: not found" | `npm install` لم يضع devDeps | App Platform يثبّت `dependencies` و `devDependencies` معاً افتراضياً — جرّب إعادة البناء |
| رابط الدومين بطيء أول مرة | الـ container بارد | health check يحلّ هذا تدريجياً |

---

## مراجعة سريعة للتغييرات المطلوبة في الكود

تم بالفعل:
- ✅ `app.listen(config.port)` يستمع على كل واجهات الشبكة افتراضياً (0.0.0.0).
- ✅ الـ API يستخدم `process.env.PORT` (في `server/config.mjs`).
- ✅ `.dockerignore` يستثني `client/` من صورة الـ API.
- ✅ الواجهة تستخدم `VITE_API_URL` نسبياً (`/api`) فلا تحتاج تعديل عند تغيير الدومين.

لا تغييرات إضافية مطلوبة في الكود.

---

## بعد النشر — اختبارات نهائية

1. افتح `https://your-domain.com/` — تظهر الصفحة الرئيسية بـ 114 سورة.
2. ادخل سورة → الإحصائيات + الصوت + الآيات تعمل.
3. `/stats` → كل البطاقات والمخططات تظهر.
4. `/shared-pages` → جدول الـ51 صفحة المشتركة.
5. `/pages/2` → صورة الصفحة تُحمَّل من `/data/quran_image/2.png` عبر الدومين الخاص.

إن نجحت هذه الخمسة، الإطلاق مكتمل. 🎉
