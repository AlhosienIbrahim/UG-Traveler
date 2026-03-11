import React, { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from 'react'

/* ═══════════════════════════════════════════════════
   CONSTANTS & DEFAULTS
═══════════════════════════════════════════════════ */
const SK = { REGIONS: 'busapp_regions', DRAFTS: 'busapp_drafts' };

const DEFAULT_REGIONS = [
  'مثلث', 'الترعة', 'معرض كالوشة', 'شارع المحكمة مركز طبي', 'موبيل فيصل',
  'المدينة المنورة', 'بورتوفيق', 'شارع المحافظة', 'النمسا', 'بازوكا',
  'الرخاوي', 'الكيال', 'اول باراديس', 'ابو العزايم', 'قصر الشوق',
  'جنينة انيسة', 'مسجد حمزة', 'شارع ناصر برج ارخصهم', 'المرور', 'الملاحة',
  'نايس مارت', 'أبراج الصفوة', 'المميز', 'الاستقامة', 'كلية طب',
  'الاسعاف', 'الجامع الكبير', 'شارع عثمان', 'الشبراوي', 'اول ابراهيم افع',
  'محل الالعاب', 'نبي الله داوود', 'لفظ الجلالة', 'مخبز فتحة خير',
  'الحرية الجديدة', 'كشك الحرية', 'النهضة', 'النهضة أمام مساكن الطلبة',
  'دوران النهضة / كشك حمزة', 'اخر ابراهيم نافع', 'الصفا مصر إيران',
  'الكهرباء مصر ايران', 'نقطة السماد', 'الكبانون', 'اكواريوس',
  'لاسرينا', 'بالميرا', 'الحجاز',
].map((name, i) => ({ id: String(i + 1), name, sortOrder: i + 1, active: true }));

const STOP_WORDS = new Set([
  // ── ضمائر ──
  'انا','انأ','أنا','هو','هي','هم','هن','احنا','إحنا','نحن',
  'انتا','انتي','انت','أنت','انتم',
  'ده','دي','دول','ديل','هاده','هاي',

  // ── أدوات وحروف ──
  'من','في','على','الى','إلى','عن','عند','لو','يا',
  'و','او','أو','ف','ب','ل','ك','إن','ان','لان','لأن',
  'مع','مش','مو','زي','بس','كمان','برضو','برضه','لكن','لكين',
  'تمام','ماشي','اوك','اوكي','ياريت','يعني','يلا','خلاص','حسنا',
  'ايوه','اه','اوه','اوكيه','اهه',

  // ── ألقاب (تُحذف من الأسماء) ──
  'دكتور','دكتوره','دكتورة','دكتور','دكتورة',
  'مهندس','مهندسة','مهندسه',
  'أستاذ','استاذ','أستاذة','استاذة','الاستاذ','الأستاذ',
  'حاج','حاجه','حاجة','الحاج','الحاجة',
  'انسة','آنسة','انسه',
  'السيد','السيده','السيدة',
  'بروفيسور','بروف',
  'معلم','معلمة','معلمه',

  // ── أفعال ركوب وحضور ──
  'ومعايا','معايا','معايه','هنركب','هنركبوا','هنركبوه',
  'يركب','بيركب','هركب','هيركب','بيركبوا','هيركبوا',
  'ركوب','ركب','ركبت','هاركب',
  'هاييجي','هاجي','هاروح','هروح','جاي','رايح',
  'هجي','بجي','بييجي','هييجي',

  // ── صاحب / رفيق ──
  'صاحبي','صاحبتي','صاحبه','صديقي','صديقتي','رفيقي','رفيقتي',
  'زميلي','زميلتي','اخويا','اختي',

  // ── مشتقات "اسم" ──
  'اسم','الاسم','إسم','الإسم',
  'اسمي','اسمه','اسمها','اسمهم','اسمك','اسمنا','اسمو',
  'إسمي','إسمه','إسمها','إسمك',
  'بيتسمي','بتتسمي','اتسمي','يتسمى','تتسمى','يسمى','تسمى',

  // ── مشتقات "رقم" ──
  'رقم','الرقم','رقمي','رقمه','رقمها','رقمنا','رقمهم','رقمك',
  'ورقمي','ورقمه','ورقمها','رقمو',
  'نمرتي','نمرته','نمرتها','نمره','نمرة','النمرة','النمره',

  // ── تليفون / موبايل / هاتف ──
  'تليفون','التليفون','تليفوني','تليفونه','تليفونها','تليفونهم',
  'تلفون','التلفون','تلفوني','تلفونه','تلفونها',
  'موبايل','الموبايل','موبايلي','موبايله','موبايلها','موبايلهم',
  'موبيل','الموبيل','موبيلي','موبيله','موبيلها',
  'هاتف','الهاتف','هاتفي','هاتفه','هاتفها',
  'خط','الخط','خطي','خطه','خطها',
  'نت','واتساب','واتس','وتساب',

  // ── منطقة / مكان ──
  'منطقة','المنطقة','منطقتي','منطقته','منطقتها','منطقه','المنطقه',
  'مكان','المكان','مكاني','مكانه','مكانها',
  'موقف','الموقف','موقفي','موقفه',
  'موقع','الموقع','موقعي','موقعه',
  'ناحية','الناحية','ناحيه','الناحيه',
  'جهة','الجهة','جهتي','جهته','جهه','الجهه',
  'قدام','امام','أمام','قريب','جنب','هناك','هنا',
  'بره','جوه','فوق','تحت','ورا','قبل','بعد',

  // ── ركوب / نقطة ──
  'نقطة','النقطة','نقطه','النقطه',
  'محطة','المحطة','محطه','المحطه',

  // ── بتاع / عندي ──
  'بتاع','بتاعت','بتاعي','بتاعه','بتاعها',
  'عندي','عنده','عندها','عندنا',
  'عايز','عايزة','عاوز','عاوزة','محتاج','محتاجه',
  'ليا','ليه','ليها',

  // ── بقايا "ال" بعد حذف أسماء مناطق ──
  'ال','وال','بال','لل','فال',
]);

// ══════════════════════════════════════════════════
// جمل تُتجاهل تماماً كسطر كامل
// ══════════════════════════════════════════════════
const JUNK_LINE_PATTERNS = [
  /السلام عليكم/,/عليكم السلام/,/وعليكم السلام/,
  /صباح الخير/,/صباح النور/,/مساء الخير/,/مساء النور/,
  /صباح الفل/,/صباح الورد/,/مساء الورد/,/مساء الفل/,
  /أهلاً/,/اهلا/,/أهلا وسهلا/,/اهلا وسهلا/,
  /مرحبا/,/مرحباً/,/هلو/,/هاي/,/هاى/,
  /ازيك/,/ازيكم/,/عامل إيه/,/عاملين ايه/,/ايه الاخبار/,
  /حاضر/,/تمام شكراً/,/شكراً جزيلاً/,/شكرا جزيلا/,
  /جزاكم الله/,/بارك الله/,/الله يبارك/,/جزاك الله/,
  /ربنا يوفقكم/,/ربنا يوفقك/,/ياريت تسجلوني/,
  /(?:لو سمحت|لو سمحتوا|من فضلك|من فضلكم)\s*(?:تسجيل|تسجلوني|تسجلني|ضيفني|ضيفوني|حجزلي|احجزلي|اضيفوني)/,
  /(?:عايز|عايزة|عاوز|عاوزة|محتاج|محتاجة)\s*(?:اتسجل|اتضاف|احجز|اركب)/,
  /(?:ممكن|ينفع|يمكن)\s*(?:تسجيلي|تسجلني|تضيفني|احجزلي)/,
  /تسجيلي?\s*في\s*(?:الباص|البص|العربية|الأتوبيس)/,
  /(?:اشترك|اشتركت|بشترك)\s*(?:في|معاكم|معكم)/,
  /(?:هيجي|هاجي|هجي)\s*معاكم/,
  /(?:اسجلني|اسجلوني|سجلني|سجلوني|ضيفني|ضيفوني|اضيفني|اضيفوني)/,
  /^(?:اوك|اوكي|تمام|ماشي|حسناً|حسنا|خلاص|يلا|ياريت|إن شاء الله|ان شاء الله|بكرة|النهارده|امبارح|كويس|تسلم|يسلمو|يسلموا)\s*[؟!.،]*$/,
  // إضافة: جمل "بكرة" / تأكيد فارغة
  /^(?:ايوه|اه|اهه|معلش|عادي|طب|طيب|يعني ايه)\s*[؟!.،]*$/,
];

function isJunkLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/0[12]\d{9}/.test(normalizeNums(trimmed))) return false;
  return JUNK_LINE_PATTERNS.some(rx => rx.test(trimmed));
}

const STOP_PHRASES = [
  'رقم التليفون','رقم الموبايل','رقم الهاتف','رقم المحمول',
  'رقم تليفوني','رقم تلفوني','رقم موبايلي','رقم موبيلي',
  'رقم تليفونه','رقم موبايله','رقم هاتفه',
  'رقم تليفونها','رقم موبايلها',
  'رقمي هو','رقمه هو','رقمها هو',
  'ورقمي هو','وده رقمي','وده رقمه','وده رقمها',
  'الرقم بتاعي','الرقم بتاعه','الرقم بتاعها',
  'نمرة تليفوني','نمرة موبايلي','نمرتي هي',
  'اسمي هو','اسمه هو','اسمها هو','اسمي بقى',
  'انا اسمي','هو اسمه','هي اسمها',
  'بيتسمى','بتتسمى',
  'هنركب من','هركب من','بركب من','بيركب من',
  'موقف الركوب','نقطة الركوب','نقطه الركوب',
  'مكان الركوب','محطة الركوب',
  'عند منطقة','من منطقة','في منطقة',
  'من عند','من قدام','من امام','من أمام',
  'هنقف عند','هنركب من عند',
  // ألقاب مركبة
  'دكتور مهندس','الدكتور','المهندس','الاستاذ','الأستاذ',
];

/* ══════════════════════════════════════════════
   PRE-PROCESSOR: يُنظّف السطر من الجمل السردية
   قبل أي تحليل — يُحافظ على الاسم والرقم والمنطقة
══════════════════════════════════════════════ */
function preProcessLine(text) {
  let s = text;

  // حذف أحرف Unicode غير مرئية (RLM, LRM, ZWNJ, ZWJ, إلخ)
  s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '');

  // "انا اسمي/اسمه X" → X
  s = s.replace(/(?:انا\s+)?(?:إسمي|اسمي|اسمه|اسمها|إسمه|اسمي\s+هو|اسمه\s+هو)\s*/gi, '');

  // "انا X" → X  (لو في بداية السطر فقط ولا يوجد رقم بعده مباشرة)
  s = s.replace(/^انا\s+(?!\d)/i, '');

  // "هاركب/هنركب/بيركب (من) (عند)?" → حذف الفعل، ابقي المكان
  s = s.replace(/(?:هنركب|بيركب|هركب|هاركب|عايز\s+اركب|عاوز\s+اركب)\s+(?:من\s+)?(?:عند\s+)?/g, '');

  // "من عند / من قدام / من امام" → حذف
  s = s.replace(/من\s+(?:عند|قدام|امام|أمام|جنب)\s+/g, '');

  // "(و)?رقمي/رقمه/نمرتي (هو)?" → حذف البادئة فقط، الرقم يبقى
  s = s.replace(/(?:و\s*)?(?:رقمي|رقمه|رقمها|نمرتي|نمرته|نمرتها)\s+(?:هو\s+)?/g, ' ');

  // "هنركب عند/في" → حذف
  s = s.replace(/هنركب\s+(?:عند|في|من)\s*/g, '');

  // تنظيف علامات الترقيم المتكررة
  s = s.replace(/[،,،.]{2,}/g, ' ').replace(/\s{2,}/g, ' ');

  return s.trim();
}

/* ═══════════════════════════════════════════════════
   INDEXEDDB STORAGE LAYER
   — Replaces the old synchronous localStorage wrapper.
   — All public functions return Promises.
═══════════════════════════════════════════════════ */
const IDB_NAME = 'busapp_db';
const IDB_VERSION = 1;
const IDB_STORE = 'keyval';

// Singleton DB connection — opened once, reused everywhere.
let _db = null;

/** Open (or reuse) the database connection. */
function initDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);   // simple key-value store
      }
    };

    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = e => reject(e.target.error);
  });
}

/** Read a value by key.  Returns the stored value, or `null` if missing. */
function getItem(key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly')
      .objectStore(IDB_STORE)
      .get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = e => reject(e.target.error);
  }));
}

/** Write a value.  The value can be any structured-clone-compatible type. */
function setItem(key, value) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite')
      .objectStore(IDB_STORE)
      .put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  }));
}

/** Delete a key (no-op if it doesn't exist). */
function removeItem(key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite')
      .objectStore(IDB_STORE)
      .delete(key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  }));
}

/* ═══════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════ */
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = d => { try { return new Date(d).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch { return d; } };

/* ═══════════════════════════════════════════════════
   ARABIC MESSAGE PARSER
═══════════════════════════════════════════════════ */
const ARABIC = /^[\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]+$/;
const PHONE_RX = /0[12]\d{9}/g;


/* تحويل الأرقام العربية/الهندية إلى أرقام غربية + تنظيف Unicode خفي */
function normalizeNums(str) {
  return str
    // ① حذف أحرف Unicode غير مرئية (RLM, LRM, ZWNJ, ZWJ, BOM, إلخ)
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
    // ② أرقام عربية/هندية → غربية
    .replace(/[٠-٩۰-۹]/g, d =>
      d.charCodeAt(0) <= 0x0669 ? d.charCodeAt(0) - 0x0660 : d.charCodeAt(0) - 0x06f0
    )
    // ③ +20 / 0020 بأي تنسيق → 01XXXXXXXXX
    .replace(/(?:\+20|0020)[\s\-]?(1\d{1,2})[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})[\s\-]?(\d*)/g,
      (_, a, b, c, d) => '0' + a + b + c + d)
    // ④ رقم محلي مقسّم بمسافات أو شرطات: 010 1234 5678 → 01012345678
    .replace(/(0[12]\d)[\s\-](\d{4})[\s\-](\d{4})/g, '$1$2$3');
}
function extractCleanName(text, phonesToRemove, regionsToRemove) {
  let s = text;

  // 1. حذف أرقام الهواتف
  phonesToRemove.forEach(p => { s = s.replace(new RegExp(p.replace(/\+/g, '\\+'), 'g'), ' '); });
  s = s.replace(/0[12]\d{9}/g, ' ');   // أي رقم تليفون تبقى

  // 2. حذف كلمات المنطقة: أولاً exact string، ثم كلمة كلمة بعد التطبيع
  regionsToRemove.forEach(r => {
    // أ. حذف الاسم الكامل كـ string (exact + matchedText)
    //    نبدأ بـ "ال" + الاسم عشان نشيل المعرّف قبل الاسم المجرد
    const escName = (r.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escMT   = (r.matchedText || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escName) {
      s = s.replace(new RegExp('ال' + escName, 'g'), ' ');
      s = s.replace(new RegExp(escName, 'g'), ' ');
    }
    if (escMT && escMT !== escName) {
      s = s.replace(new RegExp('ال' + escMT, 'g'), ' ');
      s = s.replace(new RegExp(escMT, 'g'), ' ');
    }
    // ب. حذف كل كلمة من كلمات المنطقة كلمة كلمة (يتعامل مع ة/ه، ال، الخ)
    const rWordNorms = (r.name || '').split(/\s+/).filter(w => w.length > 1).map(arNorm);
    s = s.split(/\s+/).filter(sw => {
      const swClean = sw.replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]/g, '');
      return !swClean || !rWordNorms.includes(arNorm(swClean));
    }).join(' ');
  });

  // 3. حذف العبارات المركبة + جمل التحية والطلبات
  STOP_PHRASES.forEach(ph => { s = s.replace(new RegExp(ph, 'g'), ' '); });
  JUNK_LINE_PATTERNS.forEach(rx => { s = s.replace(rx, ' '); });

  // 4. حذف علامات الترقيم وأحرف غير عربية
  s = s.replace(/[+٠-٩۰-۹0-9?!،.,:;\-_()\[\]\u061F\u060C\u061B\u06D4\u0640]/g, ' ');

  // 5. تقطيع وتنظيف
  return s
    .split(/[\s\n]+/)
    .map(w => w.replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]/g, '').trim())
    .filter(w => w.length > 1 && !STOP_WORDS.has(w) && ARABIC.test(w))
    .join(' ')
    .trim();
}

/* ══════════════════════════════════════════════════
   ARABIC TEXT NORMALIZER + FUZZY REGION FINDER
══════════════════════════════════════════════════ */

// تطبيع النص العربي: إزالة ال، توحيد أشكال الحروف المتشابهة
function arNorm(str) {
  // حذف ال من بداية كل كلمة عربية (بديل آمن بدون lookbehind)
  const words = str.split(/\s+/);
  const cleaned = words.map(w => w.replace(/^ال(?=[\u0600-\u06FF])/, ''));
  return cleaned.join(' ')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance بين كلمتين
function editDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// نسبة تشابه 0→1 بين نصّين بعد التطبيع
function similarity(a, b) {
  const na = arNorm(a), nb = arNorm(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - editDist(na, nb) / maxLen;
}

// هل الكلمة/العبارة needle موجودة في النص haystack كـ كلمة كاملة (word-boundary)؟
function normIncludes(haystack, needle) {
  const nh = arNorm(haystack);
  const nn = arNorm(needle);
  if (!nn) return false;
  // لو الـ needle كلمة واحدة: نتحقق إنها كلمة مستقلة (مش substring داخل كلمة أكبر)
  if (!nn.includes(' ')) {
    return nh.split(/\s+/).some(w => w === nn);
  }
  // لو الـ needle عبارة متعددة الكلمات: يكفي وجودها كـ substring
  return nh.includes(nn);
}

/* ── Region finder: يرجع { region, matchedText } ──
   matchedText = الكلمة/العبارة الفعلية اللي المستخدم كتبها في الرسالة
   عشان تتحذف صح من الاسم لاحقاً                               */
function findRegion(text, regions) {
  const active = [...regions].filter(r => r.active).sort((a, b) => b.name.length - a.name.length);

  // ① word-overlap scoring: كل منطقة تاخد نقطة لكل كلمة من اسمها موجودة في النص
  //   المطابقة على حدود الكلمة (word-boundary) — مش substring داخل كلمة أكبر
  //   للمناطق ذات 3+ كلمات مميزة: لازم يتطابق 2+ كلمة (تجنّب مطابقة أسماء أشخاص)
  //   عند التعادل: exact match تكسب (اسم أقصر مكتمل في النص)
  {
    const textNorm = arNorm(text);
    const textWords = new Set(textNorm.split(/\s+/)); // كلمات النص كـ set للبحث السريع
    let overlapBest = null, overlapScore = 0, overlapExact = false;
    for (const r of active) {
      const rWords = r.name.split(/\s+/).filter(w => w.length > 1);
      const meaningfulWords = rWords.filter(w => arNorm(w).length > 2);
      // الكلمات اللي بتشارك في الـ score: لازم 3+ حروف بعد التطبيع (تجنّب "في"، "من"، "به"...)
      const scoringWords = rWords.filter(w => arNorm(w).length >= 3);
      const score = scoringWords.filter(w => textWords.has(arNorm(w))).length;
      const isExact = text.includes(r.name) || arNorm(text).includes(arNorm(r.name));
      if (score === 0) continue;
      if (meaningfulWords.length >= 3 && score < 2 && !isExact) continue;
      const ratio = meaningfulWords.length > 0 ? score / meaningfulWords.length : 1;
      if (meaningfulWords.length >= 2 && ratio < 0.34 && !isExact) continue;
      const better = score > overlapScore
        || (score === overlapScore && isExact && !overlapExact)
        || (score === overlapScore && isExact && overlapExact && r.name.length < (overlapBest?.name.length || Infinity));
      if (better) { overlapScore = score; overlapBest = r; overlapExact = isExact; }
    }
    if (overlapBest) return { region: overlapBest, matchedText: overlapBest.name };
  }

  // ② مطابقة تامة بعد التطبيع — نبحث عن أطول كلمة/عبارة في الرسالة تطابق المنطقة بعد التطبيع
  const normText = arNorm(text);
  const normTextWords = new Set(normText.split(/\s+/));
  const normMap = {};   // normWord → originalWord
  text.split(/\s+/).forEach(w => { const c = w.replace(/[^\u0600-\u06FF]/g, ''); if (c) normMap[arNorm(c)] = c; });

  for (const r of active) {
    const rNorm = arNorm(r.name);
    const rNormWords = rNorm.split(/\s+/);
    // للمناطق أحادية الكلمة: تحقق word-boundary
    // للمناطق متعددة الكلمات: substring كافي (الترتيب مهم)
    const found = rNormWords.length === 1
      ? normTextWords.has(rNorm)
      : normText.includes(rNorm);
    if (found) {
      const rWords = r.name.split(/\s+/).map(w => w.replace(/[^\u0600-\u06FF]/g, ''));
      const matched = rWords.map(rw => normMap[arNorm(rw)] || rw).join(' ');
      return { region: r, matchedText: matched };
    }
  }

  // ③ مطابقة جزئية: أطول تسلسل كلمات من الرسالة موجود داخل اسم المنطقة
  const msgWords = text.split(/\s+/).map(w => w.replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]/g, '')).filter(w => w.length > 1);
  let bPartial = null, bPartialPhrase = '', bPartialScore = 0;
  for (const r of active) {
    const rMeaningfulWords = r.name.split(/\s+/).filter(w => arNorm(w).length > 2);
    for (let start = 0; start < msgWords.length; start++) {
      for (let len = msgWords.length - start; len >= 1; len--) {
        // ③ الكلمة المفردة: تُعالج فقط لو المنطقة نفسها كلمة واحدة
        //   (المناطق متعددة الكلمات تحتاج 2+ كلمات متطابقة هنا)
        if (len === 1 && rMeaningfulWords.length >= 2) continue;
        const phrase = msgWords.slice(start, start + len).join(' ');
        // كلمة مفردة: لازم 4+ حروف على الأقل (تجنّب مطابقة حروف قصيرة)
        const minLen = len === 1 ? 4 : 3;
        if (phrase.length >= minLen && normIncludes(r.name, phrase)) {
          // نسبة التغطية: عدد كلمات العبارة ÷ كلمات المنطقة المميزة
          const coverageRatio = len / Math.max(rMeaningfulWords.length, 1);
          // للمناطق ذات 3+ كلمات مميزة: لازم العبارة تغطي 40%+ من المنطقة
          if (rMeaningfulWords.length >= 3 && coverageRatio < 0.4) break;
          if (phrase.length > bPartialScore) {
            bPartialScore = phrase.length;
            bPartial = r;
            bPartialPhrase = phrase;
          }
          break; // أطول تسلسل لهذا start وجدناه
        }
      }
    }
  }
  if (bPartial) return { region: bPartial, matchedText: bPartialPhrase };

  // ④ مطابقة fuzzy: Levenshtein على مستوى الكلمة
  //   للمناطق متعددة الكلمات (2+): لازم 2+ كلمات تتطابق fuzzy (مش كلمة واحدة)
  //   ده يمنع "ابراهيم" الاسم من الاتطابق مع "اخر ابراهيم نافع" أو "اول ابراهيم افع"
  let bFuzzy = null, bFuzzyWord = '', bFuzzyScore = 0;
  for (const r of active) {
    const rWords = r.name.split(/\s+/).filter(w => w.length > 3);
    const rMeaningful = r.name.split(/\s+/).filter(w => arNorm(w).length > 2);
    // للمناطق متعددة الكلمات: احسب كم كلمة من الرسالة بتتطابق fuzzy مع كلمات المنطقة
    if (rMeaningful.length >= 2) {
      const baseThreshold = 0.85;
      let matchCount = 0;
      let totalSim = 0;
      for (const mw of msgWords) {
        if (mw.length < 4) continue;
        for (const rw of rWords) {
          const sim = similarity(mw, rw);
          if (sim >= baseThreshold) { matchCount++; totalSim += sim; break; }
        }
      }
      // لازم 2+ كلمات تتطابق للمناطق متعددة الكلمات
      if (matchCount >= 2 && totalSim > bFuzzyScore) {
        bFuzzyScore = totalSim;
        bFuzzy = r;
        bFuzzyWord = r.name;
      }
    } else {
      // منطقة كلمة واحدة: الطريقة الأصلية
      for (const mw of msgWords) {
        if (mw.length < 4) continue;
        for (const rw of rWords) {
          const sim = similarity(mw, rw);
          const threshold = rw.length >= 6 ? 0.80 : 0.88;
          if (sim >= threshold && sim > bFuzzyScore) {
            bFuzzyScore = sim;
            bFuzzy = r;
            bFuzzyWord = mw;
          }
        }
      }
    }
  }
  if (bFuzzy) return { region: bFuzzy, matchedText: bFuzzyWord };

  return null;
}

/* ── Line classifier ── */
function classifyLine(line, regions) {
  if (isJunkLine(line)) return { type: 'empty', value: '', phone: '', region: null, nameStr: '' };
  // تطبيق الـ pre-processor أولاً لحذف الجمل السردية
  const norm = normalizeNums(preProcessLine(line.trim()));

  // استخرج الرقم
  PHONE_RX.lastIndex = 0;
  const phoneMatch = norm.match(/0[12]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // استخرج المنطقة
  const regionResult = findRegion(norm, regions);
  const region = regionResult?.region || null;
  const matchedTx = regionResult?.matchedText || '';

  // لو السطر كله رقم فقط → pure phone
  if (phone && norm.replace(/\d/g,'').trim().length < 3) {
    return { type: 'phone', value: phone, phone, region: null, nameStr: '' };
  }

  // لو السطر كله منطقة فقط (بعد حذف الـ phone) → pure region
  if (region && !phone) {
    const withoutRegion = extractCleanName(norm, [], [{ name: region.name, matchedText: matchedTx }]);
    if (!withoutRegion) {
      return { type: 'region', value: region, matchedText: matchedTx, phone: '', region, nameStr: '' };
    }
  }

  // استخرج الاسم
  const nameStr = extractCleanName(norm,
    phone ? [phone] : [],
    region ? [{ name: region.name, matchedText: matchedTx }] : []
  );

  if (!phone && !region && !nameStr) return { type: 'empty', value: '' };
  return {
    type: phone ? 'phone' : (region ? 'region' : 'name'),
    value: phone || (region ? region : nameStr),
    matchedText: matchedTx,
    phone, region, nameStr,
  };
}

/* ── Multiline block parser: one person per name line ── */
function parseMultilineBlocks(raw, regions) {
  // أولاً: شقق كل سطر فيه '+' (فاصل أشخاص) لـ sub-lines
  // استثناء: '+' في أرقام دولية (+20...) مش فاصل
  const expandedLines = [];
  raw.split(/\n/).forEach(line => {
    const t = line.trim();
    if (!t) return;
    if (/\+(?!\s*20|\d{10})/.test(t)) {
      t.split(/\+(?!\s*20|\d{10})/).map(s => s.trim()).filter(Boolean).forEach(s => expandedLines.push(s));
    } else {
      expandedLines.push(t);
    }
  });

  const lines = expandedLines;
  if (lines.length < 2) return null; // not multiline

  const classified = lines.map(l => classifyLine(l, regions));

  // Build person blocks: new person starts when we hit a name line
  const blocks = [];
  let cur = null;

  classified.forEach((cl, i) => {
    const hasName = !!cl.nameStr;
    const hasPhone = !!cl.phone;
    const hasRegion = !!cl.region;
    const isMixed = (hasName && (hasPhone || hasRegion)) || (hasPhone && hasRegion);

    if (isMixed) {
      // سطر مختلط: اسم + رقم + منطقة في نفس الوقت → person جديدة كاملة
      if (cur) blocks.push(cur);
      cur = { name: cl.nameStr || '', phone: cl.phone || '', region: cl.region || null };
      blocks.push(cur); cur = null;
    } else if (cl.type === 'name' && cl.value) {
      if (cur) blocks.push(cur);
      cur = { name: cl.value, phone: '', region: null };
    } else if (cl.type === 'phone') {
      if (!cur) cur = { name: '', phone: cl.value, region: null };
      else if (!cur.phone) cur.phone = cl.value;
      else { blocks.push(cur); cur = { name: '', phone: cl.value, region: null }; }
    } else if (cl.type === 'region') {
      if (!cur) cur = { name: '', phone: '', region: cl.value };
      else cur.region = cl.value;
    }
  });
  if (cur) blocks.push(cur);

  // توزيع الرقم/المنطقة المشتركة
  if (blocks.length > 0) {
    const lastPhone = classified.slice().reverse().find(cl => cl.phone)?.phone || '';
    const lastRegion = classified.slice().reverse().find(cl => cl.region)?.region || null;
    blocks.forEach(b => {
      if (!b.phone && lastPhone) b.phone = lastPhone;
      if (!b.region && lastRegion) b.region = lastRegion;
    });
  }

  // حذف الـ blocks اللي اسمها فاضي — هي بتكون سطر رقم/منطقة مشتركة وليست راكب
  const validBlocks = blocks.filter(b => b.name && b.name.trim());
  // لو كل الـ blocks اتحذفوا (ما فيش اسم خالص) نرجع null عشان الـ parser العادي يتعامل معه
  if (validBlocks.length === 0) return null;
  blocks.length = 0;
  validBlocks.forEach(b => blocks.push(b));

  // If only one block and it's a simple one-liner, let original parser handle
  if (blocks.length <= 1 && lines.length <= 1) return null;
  return blocks.length > 0 ? blocks : null;
}

/* ── Person segmenter ── */
function splitPersonSegments(raw) {
  // ── Rule 1: '+' كـ فاصل بين أشخاص — لكن مش "+" في أرقام دولية (+20...)
  //   نبحث عن '+' مش متبوع برقم دولي
  const plusParts = raw.split(/\+(?!\d{10,}|\s*20)/);
  if (plusParts.length > 1 && plusParts.every(p => p.trim())) {
    return plusParts.map(s => s.trim()).filter(Boolean);
  }

  // ── Rule 2: ومعايا / معايا ──
  if (/ومعايا|معايا/.test(raw)) {
    const idx = raw.search(/ومعايا|معايا/);
    return [raw.slice(0, idx).trim(), raw.slice(idx).trim()].filter(Boolean);
  }

  // ── Rule 3: ' و ' — الجزء الأيسر من كل و لازم يكون اسم نظيف
  const isCleanNameSeg = seg => {
    PHONE_RX.lastIndex = 0;
    if (PHONE_RX.test(seg)) return false;
    const ws = seg.trim()
      .replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));
    return ws.length >= 1 && ws.length <= 4;
  };

  PHONE_RX.lastIndex = 0;
  const waParts = raw.split(/ و /);
  if (waParts.length >= 2) {
    const allButLast = waParts.slice(0, -1);
    if (allButLast.every(p => isCleanNameSeg(p.trim()))) {
      return waParts.map(s => s.trim()).filter(Boolean);
    }
  }

  return [raw];
}

function parseMessage(text, regions) {
  // تطبيق الـ pre-processor على كل سطر أولاً
  const cleaned = text.trim().split('\n')
    .map(l => preProcessLine(l))
    .filter(Boolean)
    .join('\n');
  const raw = normalizeNums(cleaned);

  // ── Priority: multiline block detection ──
  const blocks = parseMultilineBlocks(raw, regions);
  if (blocks && blocks.length > 0) {
    const passengers = blocks
      .filter(b => b.name || b.phone)
      .map(b => ({ name: b.name, phone: b.phone, region: b.region, originalMessage: raw }));
    const hasPhone = passengers.some(p => p.phone);
    const hasRegion = passengers.some(p => p.region);
    const hasName = passengers.some(p => p.name);
    const conf = (hasPhone ? 40 : 0) + (hasRegion ? 40 : 0) + (hasName ? 20 : 0);
    return { passengers, confidence: conf, needsReview: conf < 80 };
  }

  // ── Inline single-line parsing ──
  PHONE_RX.lastIndex = 0;
  const phones = raw.match(PHONE_RX) || [];
  const regionRes = findRegion(raw, regions);
  const region = regionRes?.region || null;
  const regionMatchedText = regionRes?.matchedText || '';
  const segments = splitPersonSegments(raw);

  let passengers = [];

  if (segments.length > 1) {
    segments.forEach((seg, idx) => {
      PHONE_RX.lastIndex = 0;
      const segPhones = seg.match(PHONE_RX) || [];
      const phone = segPhones[0] || phones[idx] || phones[0] || '';
      const segRes = findRegion(seg, regions);
      const segRegion = segRes?.region || region;
      const segMT = segRes?.matchedText || regionMatchedText;
      const name = extractCleanName(seg, [...phones], segRegion ? [{ name: segRegion.name, matchedText: segMT }] : []);
      if (name || phone) {
        passengers.push({ name, phone, region: segRegion, originalMessage: raw });
      }
    });
    if (passengers.length === 0) {
      const name = extractCleanName(raw, phones, region ? [{ name: region.name, matchedText: regionMatchedText }] : []);
      passengers.push({ name, phone: phones[0] || '', region, originalMessage: raw });
    }
  } else {
    const name = extractCleanName(raw, phones, region ? [{ name: region.name, matchedText: regionMatchedText }] : []);
    passengers.push({ name, phone: phones[0] || '', region, originalMessage: raw });
  }

  const conf = (phones.length > 0 ? 40 : 0) + (region ? 40 : 0) + (passengers.some(p => p.name) ? 20 : 0);
  return { passengers, confidence: conf, needsReview: conf < 80 };
}

/* ═══════════════════════════════════════════════════
   TOAST CONTEXT
═══════════════════════════════════════════════════ */
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = uid();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{icons[t.type] || 'ℹ️'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);



/* ═══════════════════════════════════════════════════
   MOBILE DROPDOWN
═══════════════════════════════════════════════════ */
function MobileDropdown({ view, onNav }) {
  const [open, setOpen] = useState(false);
  const menuItems = [
    { id: 'dashboard', label: 'المسودات', icon: '📋' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <div className="dropdown-menu header-nav-mobile">
      {/* Hamburger Button - 3 Lines */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
          border: open ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
          borderRadius: 8,
          padding: 10,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          width: 40,
          height: 40,
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{
          width: 18,
          height: 2,
          background: open ? 'var(--accent)' : 'var(--text2)',
          borderRadius: 2,
          transition: 'all 0.2s',
          transform: open ? 'rotate(45deg) translateY(6px)' : 'none',
        }} />
        <span style={{
          width: 18,
          height: 2,
          background: open ? 'var(--accent)' : 'var(--text2)',
          borderRadius: 2,
          transition: 'all 0.2s',
          opacity: open ? 0 : 1,
        }} />
        <span style={{
          width: 18,
          height: 2,
          background: open ? 'var(--accent)' : 'var(--text2)',
          borderRadius: 2,
          transition: 'all 0.2s',
          transform: open ? 'rotate(-45deg) translateY(-6px)' : 'none',
        }} />
      </button>
      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-content">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`dropdown-item ${view === item.id ? 'active' : ''}`}
                onClick={() => { onNav(item.id); setOpen(false); }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOADING SCREEN
═══════════════════════════════════════════════════ */
const LOGO_SRC = "bus-system-image.png";
function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 9999,
    }}>
      {/* Brand logo */}
      <img src={LOGO_SRC} alt="GU Travel" style={{ height: 52, width: 'auto', objectFit: 'contain', animation: 'pulse 1.4s ease-in-out infinite' }} />
      {/* Spinner ring */}
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border2)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: 'var(--text3)', fontSize: 13, fontWeight: 700 }}>
        جار تحميل البيانات…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════ */
function Header({ view, onNav, draftName }) {
  return (
    <header style={{
      background: 'linear-gradient(180deg, #1a2332 0%, #0f1419 100%)',
      borderBottom: '1px solid var(--border)',
      padding: '0 12px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 10, flexWrap: 'wrap' }}>
        {/* Logo Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
          borderRadius: 10,
          border: '1px solid rgba(59,130,246,0.2)',
          flexShrink: 0,
        }}>
          {/* Logo Image */}
          <img
            src={LOGO_SRC}
            alt="GU Travel"
            style={{
              height: 36,
              width: 'auto',
              objectFit: 'contain',
              borderRadius: 6,
            }}
          />
          {/* Brand Name - Hidden on small screens */}
          <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>GU Travel</span>
            <span style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>نظام إدارة الرحلات</span>
          </div>
        </div>
        {/* Back button */}
        {view !== 'dashboard' && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onNav('dashboard')}
            style={{ gap: 4, color: 'var(--text3)', flexShrink: 0, borderRadius: 8, padding: '5px 10px', border: '1px solid var(--border)' }}
          >
            ← رجوع
          </button>
        )}

        {/* Logo + Brand */}
        <div
          className="flex-center"
          style={{ flex: 1, minWidth: 0, gap: 12, cursor: 'pointer' }}
          onClick={() => onNav('dashboard')}
        >

          {/* Current draft breadcrumb */}
          {draftName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              padding: '4px 10px', border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text4)', fontSize: 12 }}>›</span>
              <span className="text-ellipsis" style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700 }}>{draftName}</span>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <nav className="header-nav" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {[
            { id: 'dashboard', label: '📋 المسودات', mobileLabel: '📋' },
            { id: 'settings', label: '⚙️ الإعدادات', mobileLabel: '⚙️' },
          ].map(n => (
            <button
              key={n.id}
              onClick={() => onNav(n.id)}
              style={{
                fontFamily: "'Cairo', sans-serif",
                cursor: 'pointer',
                border: view === n.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all .2s ease',
                whiteSpace: 'nowrap',
                background: view === n.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                color: view === n.id ? '#60a5fa' : 'var(--text3)',
              }}
            >{n.label}</button>
          ))}
        </nav>
        {/* Mobile Dropdown Nav */}
        <MobileDropdown view={view} onNav={onNav} />
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════
   STATS BAR
═══════════════════════════════════════════════════ */
function StatsBar({ passengers }) {
  const total = passengers.length;
  const arrived = passengers.filter(p => p.status === 'arrived').length;
  const absent = passengers.filter(p => p.status === 'absent').length;
  const pending = passengers.filter(p => p.status === 'pending').length;
  const pct = total ? Math.round(arrived / total * 100) : 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'الإجمالي', val: total, color: 'var(--blue)', bg: 'rgba(96,165,250,.08)', icon: '👥' },
          { label: 'حضر', val: arrived, color: 'var(--green)', bg: 'rgba(16,185,129,.08)', icon: '✅' },
          { label: 'غائب', val: absent, color: 'var(--red)', bg: 'rgba(239,68,68,.08)', icon: '❌' },
          { label: 'لم يُحدَّد', val: pending, color: 'var(--accent)', bg: 'rgba(245,158,11,.08)', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 10, padding: '11px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="flex-center gap8">
          <div className="pbar" style={{ flex: 1 }}>
            <div className="pbar-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, minWidth: 36 }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PASSENGER ROW
═══════════════════════════════════════════════════ */
function PassengerRow({ p, onStatus, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const nameColor = p.status === 'arrived' ? 'var(--green)' : p.status === 'absent' ? 'var(--red)' : 'var(--text)';

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    if (!p.phone) return;
    const doCopy = (text) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => fallback(text));
      } else { fallback(text); }
    };
    const fallback = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    };
    doCopy(p.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`pr ${p.status}`} style={{ gap: 10 }}>
      {/* Status buttons */}
      <div className="flex gap6 shrink0">
        <button
          className="sb"
          title="حضر"
          style={{ borderColor: 'var(--green)', background: p.status === 'arrived' ? 'rgba(16,185,129,.2)' : 'transparent', color: p.status === 'arrived' ? 'var(--green)' : 'var(--border2)' }}
          onClick={() => onStatus(p.id, p.status === 'arrived' ? 'pending' : 'arrived')}
        >✔</button>
        <button
          className="sb"
          title="غائب"
          style={{ borderColor: 'var(--red)', background: p.status === 'absent' ? 'rgba(239,68,68,.2)' : 'transparent', color: p.status === 'absent' ? 'var(--red)' : 'var(--border2)' }}
          onClick={() => onStatus(p.id, p.status === 'absent' ? 'pending' : 'absent')}
        >✖</button>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-ellipsis" style={{ fontWeight: 700, fontSize: 14, color: nameColor }}>
          {p.name || <span style={{ color: 'var(--text4)', fontStyle: 'italic' }}>بدون اسم</span>}
        </div>
        {/* Phone + copy button */}
        {p.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', direction: 'ltr' }}>{p.phone}</span>
            <button
              onClick={handleCopyPhone}
              title={copied ? 'تم النسخ!' : 'انسخ الرقم'}
              style={{
                fontFamily: "'Cairo', sans-serif",
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 6,
                border: copied ? '1px solid rgba(16,185,129,.5)' : '1px solid var(--border2)',
                background: copied ? 'rgba(16,185,129,.15)' : 'var(--card2)',
                cursor: 'pointer',
                fontSize: 11,
                transition: 'all .18s',
                color: copied ? 'var(--green)' : 'var(--text3)',
              }}
            >
              {copied ? '✔' : '⎘'}
            </button>
          </div>
        )}
        {p.notes && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{p.notes}</div>}
      </div>

      {/* Actions */}
      <div className="flex gap6 shrink0">
        <button className="btn btn-ghost btn-icon btn-sm" title="تعديل" onClick={() => onEdit(p)}>✏️</button>
        <button className="btn btn-ghost btn-icon btn-sm" title="حذف" onClick={() => onDelete(p.id)} style={{ color: 'var(--red-dim)' }}>🗑️</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   REGION GROUP
═══════════════════════════════════════════════════ */
function RegionGroup({ region, passengers, onStatus, onEdit, onDelete, onComplete, isDone }) {
  const [open, setOpen] = useState(true);
  const arrived = passengers.filter(p => p.status === 'arrived').length;
  const isOther = !region;

  return (
    <div className="rg" style={{ borderColor: isDone ? 'rgba(16,185,129,.3)' : 'var(--border)' }}>
      <div className={`rg-head ${isDone ? 'done' : ''}`} onClick={() => setOpen(o => !o)}>
        <div className="flex-center gap10">
          {isDone ? <span style={{ fontSize: 16 }}>✅</span> : <span style={{ fontSize: 14, color: 'var(--text4)' }}>{open ? '▾' : '▸'}</span>}
          <span style={{ fontWeight: 800, fontSize: 14, color: isDone ? 'var(--green)' : isOther ? 'var(--text2)' : 'var(--text)' }}>
            {isOther ? '🗂️ مناطق أخرى' : `${region.sortOrder}. ${region.name}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{arrived}/{passengers.length}</span>
        </div>
        <div className="flex-center gap8" onClick={e => e.stopPropagation()}>
          {!isDone && !isOther && passengers.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={() => onComplete(region.id)}>
              ✔ تم الانتهاء من المنطقة
            </button>
          )}
          {isDone && !isOther && (
            <button className="btn btn-secondary btn-sm" onClick={() => onComplete(region.id, 'undo')}>
              ↩ إلغاء
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text4)' }} onClick={() => setOpen(o => !o)}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>
      {open && passengers.map(p => (
        <PassengerRow key={p.id} p={p} onStatus={onStatus} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MESSAGE PARSER PANEL
═══════════════════════════════════════════════════ */
function MessageParserPanel({ regions, draftPassengers, onAddPassengers }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [editable, setEditable] = useState([]);
  const [open, setOpen] = useState(false);

  const handleParse = () => {
    if (!text.trim()) return;
    const r = parseMessage(text.trim(), regions);
    setResult(r);
    setEditable(r.passengers.map(p => ({ ...p, id: uid(), regionId: p.region?.id || '' })));
  };

  const upd = (idx, field, val) => setEditable(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  const updRegion = (idx, rId) => {
    const region = regions.find(r => r.id === rId) || null;
    setEditable(prev => prev.map((p, i) => i === idx ? { ...p, region, regionId: rId } : p));
  };

  const handleSave = () => {
    const toAdd = [];
    editable.forEach(p => {
      toAdd.push({ ...p, status: 'pending' });
    });
    if (toAdd.length > 0) {
      onAddPassengers(toAdd);
      toast(`تم إضافة ${toAdd.length} راكب`, 'success');
      setText(''); setResult(null); setEditable([]);
    }
  };

  const reset = () => { setText(''); setResult(null); setEditable([]); };

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="flex-center gap10" style={{ marginBottom: open || result ? 12 : 0, cursor: 'pointer' }} onClick={() => !result && setOpen(o => !o)}>
        <span style={{ fontSize: 18 }}>📨</span>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)', flex: 1 }}>تحليل رسائل واتساب</span>
        {!result && <span style={{ color: 'var(--text4)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>}
      </div>

      {(open || result) && (
        <>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); if (result) setResult(null); }}
            placeholder="الصق رسالة واتساب هنا مثلاً: انا احمد من النمسا ورقمي 01012345678"
            rows={3}
            style={{ marginBottom: 10 }}
          />
          <div className="flex gap8">
            <button className="btn btn-primary" onClick={handleParse} disabled={!text.trim()}>
              🔍 تحليل
            </button>
            {text && <button className="btn btn-secondary btn-sm" onClick={reset}>مسح</button>}
          </div>

          {result && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }} className="anim">
              {/* Confidence bar */}
              <div className="flex-center gap8" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>نسبة الثقة:</span>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pbar-fill" style={{
                    width: `${result.confidence}%`,
                    background: result.confidence >= 80 ? 'var(--green)' : result.confidence >= 50 ? 'var(--accent)' : 'var(--red)'
                  }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: result.confidence >= 80 ? 'var(--green)' : result.confidence >= 50 ? 'var(--accent)' : 'var(--red)' }}>
                  {result.confidence}%
                </span>
              </div>

              {result.needsReview && (
                <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: 'var(--accent)' }}>
                  ⚠️ يرجى مراجعة البيانات قبل الحفظ — لم يتم التعرف على بعض المعلومات بثقة
                </div>
              )}

              {editable.map((p, idx) => (
                <div key={p.id} style={{ background: 'var(--card2)', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid var(--border2)' }} className="anim">
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>
                    الراكب {idx + 1} من {editable.length}
                  </div>
                  <div className="grid2" style={{ marginBottom: 8 }}>
                    <div>
                      <label>الاسم</label>
                      <input value={p.name} onChange={e => upd(idx, 'name', e.target.value)} placeholder="اسم الراكب" />
                    </div>
                    <div>
                      <label>رقم الهاتف</label>
                      <input value={p.phone} onChange={e => upd(idx, 'phone', e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label>المنطقة</label>
                    <select value={p.regionId || ''} onChange={e => updRegion(idx, e.target.value)}>
                      <option value="">-- مناطق أخرى (غير محددة) --</option>
                      {[...regions].filter(r => r.active).sort((a, b) => a.sortOrder - b.sortOrder).map(r => (
                        <option key={r.id} value={r.id}>{r.sortOrder}. {r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>ملاحظات</label>
                    <input value={p.notes || ''} onChange={e => upd(idx, 'notes', e.target.value)} placeholder="ملاحظات اختيارية" />
                  </div>
                  {editable.length > 1 && (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', marginTop: 8 }} onClick={() => setEditable(prev => prev.filter((_, i) => i !== idx))}>
                      🗑️ حذف هذا الراكب
                    </button>
                  )}
                </div>
              ))}

              <div className="flex gap8" style={{ marginTop: 4 }}>
                <button className="btn btn-success" onClick={handleSave}>
                  💾 حفظ {editable.length > 1 ? `${editable.length} ركاب` : 'الراكب'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setResult(null); setEditable([]); }}>إلغاء</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PASSENGER MODAL
═══════════════════════════════════════════════════ */
function PassengerModal({ init, regions, existingPhones, onSave, onClose }) {
  const [f, setF] = useState(init || { name: '', phone: '', regionId: '', notes: '', status: 'pending', originalMessage: '' });
  const [err, setErr] = useState('');
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!f.name.trim() && !f.phone.trim()) { setErr('يجب إدخال الاسم أو رقم الهاتف على الأقل'); return; }
    if (f.phone && existingPhones.has(f.phone) && f.phone !== init?.phone) {
      setErr('رقم الهاتف موجود بالفعل في هذه المسودة'); return;
    }
    const region = regions.find(r => r.id === f.regionId) || null;
    onSave({ ...f, region, id: init?.id || uid() });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal anim">
        <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 20, color: 'var(--accent)' }}>
          {init?.id ? '✏️ تعديل بيانات الراكب' : '➕ إضافة راكب جديد'}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div className="grid2">
            <div>
              <label>الاسم</label>
              <input value={f.name} onChange={e => upd('name', e.target.value)} placeholder="اسم الراكب" autoFocus />
            </div>
            <div>
              <label>رقم الهاتف</label>
              <input value={f.phone} onChange={e => upd('phone', e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" />
            </div>
          </div>

          <div>
            <label>المنطقة</label>
            <select value={f.regionId || ''} onChange={e => upd('regionId', e.target.value)}>
              <option value="">-- مناطق أخرى (غير محددة) --</option>
              {[...regions].filter(r => r.active).sort((a, b) => a.sortOrder - b.sortOrder).map(r => (
                <option key={r.id} value={r.id}>{r.sortOrder}. {r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>الحالة</label>
            <select value={f.status} onChange={e => upd('status', e.target.value)}>
              <option value="pending">⏳ لم يُحدَّد بعد</option>
              <option value="arrived">✅ حضر</option>
              <option value="absent">❌ غائب</option>
            </select>
          </div>

          <div>
            <label>ملاحظات</label>
            <input value={f.notes || ''} onChange={e => upd('notes', e.target.value)} placeholder="ملاحظات اختيارية" />
          </div>

          {f.originalMessage && (
            <div>
              <label>الرسالة الأصلية</label>
              <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text2)', border: '1px solid var(--border)' }}>
                {f.originalMessage}
              </div>
            </div>
          )}

          {err && (
            <div style={{ color: 'var(--red)', fontSize: 12, background: 'rgba(239,68,68,.08)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,.25)' }}>
              ⚠️ {err}
            </div>
          )}
        </div>

        <div className="flex gap8" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handleSave}>💾 حفظ</button>
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPORT MESSAGE MODAL
═══════════════════════════════════════════════════ */
function fmtPhone(phone, formatPhone) {
  if (!phone) return '';
  if (formatPhone === 'intl')
    return phone.replace(/^0(\d{2})(\d{4})(\d{4})$/, '+20 $1 $2 $3');
  return phone;
}

function buildExportText(groups, regionStatus, options) {
  const lines = [];
  const { onlyArrived, includePhone, formatPhone, includeStats, namePhoneLayout } = options;
  // namePhoneLayout: 'inline' = "اسم | رقم"  |  'stacked' = اسم ثم رقم على سطرين

  groups.forEach(g => {
    const regionName = g.region ? g.region.name : 'مناطق أخرى';
    const passengers = onlyArrived
      ? g.passengers.filter(p => p.status !== 'absent')
      : g.passengers;
    if (passengers.length === 0) return;

    const isDone = g.region && regionStatus[g.region?.id] === 'completed';
    const count = passengers.length;
    lines.push(`${regionName} ✅️ [${count}]`);

    passengers.forEach(p => {
      const ph = includePhone ? fmtPhone(p.phone, formatPhone) : '';
      if (namePhoneLayout === 'inline') {
        // "اسم | رقم"  or just one of them if the other is missing
        if (p.name && ph) lines.push(`${p.name} | ${ph}`);
        else if (p.name) lines.push(p.name);
        else if (ph) lines.push(ph);
      } else {
        // stacked (original behaviour)
        if (p.name) lines.push(p.name);
        if (ph) lines.push(ph);
      }
    });

    if (includeStats) {
      const arrived = passengers.filter(p => p.status === 'arrived').length;
      const absent = passengers.filter(p => p.status === 'absent').length;
      if (arrived || absent) lines.push(`  ✅ ${arrived}  ❌ ${absent}`);
    }

    lines.push('');
  });

  return lines.join('\n').trim();
}

function ExportModal({ groups, regionStatus, onClose }) {
  const toast = useToast();
  const [opts, setOpts] = useState({
    onlyArrived: false,
    includePhone: true,
    formatPhone: 'local',        // 'local' | 'intl'
    namePhoneLayout: 'inline',   // 'inline' | 'stacked'
    includeStats: false,
  });
  const [copied, setCopied] = useState(false);

  const upd = (k, v) => setOpts(o => ({ ...o, [k]: v }));

  const text = useMemo(() => buildExportText(groups, regionStatus, opts), [groups, regionStatus, opts]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast('تم نسخ الرسالة ✔', 'success');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      toast('تم نسخ الرسالة ✔', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const totalPassengers = groups.reduce((s, g) => s + g.passengers.length, 0);
  const previewLines = text.split('\n').length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal anim" style={{ maxWidth: 580 }}>
        <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4, color: 'var(--accent)' }}>
          📋 تصدير كرسالة واتساب
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
          {totalPassengers} راكب — {previewLines} سطر
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>

          <div style={{ background: 'var(--card2)', borderRadius: 10, padding: 12, border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, marginBottom: 10 }}>⚙️ خيارات التصدير</div>
            <div style={{ display: 'grid', gap: 8 }}>

              {/* Only arrived */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                <input type="checkbox" checked={opts.onlyArrived} onChange={e => upd('onlyArrived', e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <span>استثناء الغائبين فقط</span>
              </label>

              {/* Include phone */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                <input type="checkbox" checked={opts.includePhone} onChange={e => upd('includePhone', e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <span>تضمين أرقام الهاتف</span>
              </label>

              {/* Phone format — shown only if includePhone */}
              {opts.includePhone && (
                <div style={{ paddingRight: 26, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>صيغة الرقم:</span>
                  {[
                    { val: 'local', label: 'محلي  01XXXXXXXXX' },
                    { val: 'intl', label: 'دولي  +20 1X XXXX XXXX' },
                  ].map(opt => (
                    <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: opts.formatPhone === opt.val ? 'var(--accent)' : 'var(--text2)', margin: 0, fontFamily: 'monospace' }}>
                      <input type="radio" name="fmt" value={opt.val} checked={opts.formatPhone === opt.val} onChange={() => upd('formatPhone', opt.val)}
                        style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {/* Name/phone layout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>شكل عرض الراكب:</span>
                {[
                  { val: 'inline', label: 'في سطر واحد  اسم | رقم' },
                  { val: 'stacked', label: 'كل معلومة في سطر' },
                ].map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: opts.namePhoneLayout === opt.val ? 'var(--accent)' : 'var(--text2)', margin: 0 }}>
                    <input type="radio" name="layout" value={opt.val} checked={opts.namePhoneLayout === opt.val} onChange={() => upd('namePhoneLayout', opt.val)}
                      style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Include stats */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                <input type="checkbox" checked={opts.includeStats} onChange={e => upd('includeStats', e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <span>إضافة إحصائيات الحضور/الغياب لكل منطقة</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 8 }}>👁️ معاينة الرسالة</div>
            <pre style={{
              fontFamily: "'Cairo', sans-serif", fontSize: 12, color: 'var(--text2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'rtl', textAlign: 'right',
              maxHeight: 280, overflowY: 'auto', lineHeight: 1.8, margin: 0,
            }}>{text || 'لا يوجد ركاب للتصدير'}</pre>
          </div>
        </div>

        <div className="flex gap8">
          <button
            className={`btn btn-lg ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={handleCopy}
            disabled={!text}
            style={{ flex: 1 }}
          >
            {copied ? '✅ تم النسخ!' : '📋 نسخ الرسالة'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DRAFT VIEW
═══════════════════════════════════════════════════ */
function DraftView({ draft, regions, onUpdate }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const passengers = draft.passengers || [];
  const regionStatus = draft.regionStatus || {};

  // Filter passengers by search query
  const filteredPassengers = useMemo(() => {
    if (!searchQuery.trim()) return passengers;
    const query = searchQuery.trim().toLowerCase();
    return passengers.filter(p =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.phone && p.phone.includes(query))
    );
  }, [passengers, searchQuery]);

  const existingPhones = useMemo(() => new Set(passengers.map(p => p.phone).filter(Boolean)), [passengers]);

  const setPassengers = (ps) => onUpdate({ ...draft, passengers: ps });

  /* Group passengers by active region order */
  const groups = useMemo(() => {
    const active = [...regions].filter(r => r.active).sort((a, b) => a.sortOrder - b.sortOrder);
    const activeIds = new Set(active.map(r => r.id));
    const result = [];

    active.forEach(r => {
      const ps = filteredPassengers.filter(p => (p.region?.id || p.regionId) === r.id);
      if (ps.length > 0) result.push({ region: r, passengers: ps });
    });

    const others = filteredPassengers.filter(p => {
      const rid = p.region?.id || p.regionId;
      return !rid || !activeIds.has(rid);
    });
    if (others.length > 0) result.push({ region: null, passengers: others });

    return result;
  }, [filteredPassengers, regions]);

  const handleStatus = (id, status) => setPassengers(passengers.map(p => p.id === id ? { ...p, status } : p));
  const handleDelete = (id) => { if (confirm('حذف هذا الراكب؟')) setPassengers(passengers.filter(p => p.id !== id)); };
  const handleEdit = (p) => { setEditing(p); setShowModal(true); };

  const handleSavePassenger = (p) => {
    const exists = passengers.find(x => x.id === p.id);
    setPassengers(exists ? passengers.map(x => x.id === p.id ? p : x) : [...passengers, p]);
    toast(exists ? 'تم تعديل بيانات الراكب' : 'تم إضافة الراكب', 'success');
    setShowModal(false); setEditing(null);
  };

  const handleAddParsed = (ps) => {
    setPassengers([...passengers, ...ps.map(p => ({ ...p, status: 'pending', regionId: p.region?.id || '' }))]);
  };

  const handleComplete = (regionId, action) => {
    const newStatus = { ...regionStatus, [regionId]: action === 'undo' ? 'pending' : 'completed' };
    onUpdate({ ...draft, regionStatus: newStatus });
    if (action !== 'undo') toast('تم تحديد المنطقة كمنتهية ✔', 'success');
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{draft.name}</h1>
        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{fmtDate(draft.date)}</p>
      </div>

      <StatsBar passengers={passengers} />

      <MessageParserPanel regions={regions} draftPassengers={passengers} onAddPassengers={handleAddParsed} />

      <div className="flex gap8" style={{ marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => { setEditing(null); setShowModal(true); }}>
          ➕ إضافة راكب يدوياً
        </button>
        {passengers.length > 0 && (
          <button className="btn btn-secondary" onClick={() => setShowExport(true)}
            style={{ borderColor: 'rgba(59,130,246,.35)', color: 'var(--accent)' }}>
            📋 تصدير كرسالة
          </button>
        )}
      </div>

      {/* Search Box */}
      {passengers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="search-box" style={{ maxWidth: 400 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن راكب بالاسم أو رقم الهاتف..."
              style={{ paddingRight: 40 }}
            />
          </div>
          {searchQuery && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
              {filteredPassengers.length === 0 ? (
                <span style={{ color: 'var(--red)' }}>لم يتم العثور على نتائج</span>
              ) : (
                <span>تم العثور على <strong style={{ color: 'var(--accent)' }}>{filteredPassengers.length}</strong> راكب</span>
              )}
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginRight: 10 }}
                onClick={() => setSearchQuery('')}
              >
                مسح البحث
              </button>
            </div>
          )}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🚌</div>
          <div className="empty-title">لا يوجد ركاب بعد</div>
          <div className="empty-sub">الصق رسائل واتساب للتحليل أو أضف ركاباً يدوياً</div>
        </div>
      ) : (
        groups.map(g => (
          <RegionGroup
            key={g.region?.id || 'others'}
            region={g.region}
            passengers={g.passengers}
            onStatus={handleStatus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onComplete={handleComplete}
            isDone={g.region && regionStatus[g.region.id] === 'completed'}
          />
        ))
      )}

      {showModal && (
        <PassengerModal
          init={editing}
          regions={regions}
          existingPhones={existingPhones}
          onSave={handleSavePassenger}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
      {showExport && (
        <ExportModal
          groups={groups}
          regionStatus={regionStatus}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════ */
function CreateDraftModal({ onSave, onClose }) {
  const now = new Date();
  const defName = `مسودة ${now.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  const [name, setName] = useState(defName);
  const [date, setDate] = useState(today());
  const [err, setErr] = useState('');

  const handle = () => {
    if (!name.trim()) { setErr('اسم المسودة مطلوب'); return; }
    onSave({ id: uid(), name: name.trim(), date, passengers: [], regionStatus: {}, createdAt: Date.now() });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal anim" style={{ maxWidth: 420 }}>
        <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 20, color: 'var(--accent)' }}>📋 إنشاء مسودة جديدة</div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label>اسم المسودة</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label>التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {err && <div style={{ color: 'var(--red)', fontSize: 12 }}>⚠️ {err}</div>}
        </div>
        <div className="flex gap8" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handle}>إنشاء ✔</button>
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ drafts, onOpen, onCreate, onDelete }) {
  const todayDate = today();
  const sorted = [...drafts].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '16px' }}>
      <div className="flex-center" style={{ marginBottom: 24, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="section-title">المسودات اليومية</h1>
          <p className="section-sub">إدارة رحلات وركاب كل يوم</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onCreate}>➕ مسودة جديدة</button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">لا توجد مسودات حتى الآن</div>
          <div className="empty-sub" style={{ marginBottom: 20 }}>أنشئ مسودة جديدة لبدء تتبع الركاب</div>
          <button className="btn btn-primary btn-lg" onClick={onCreate}>➕ إنشاء أول مسودة</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sorted.map(d => {
            const ps = d.passengers || [];
            const arrived = ps.filter(p => p.status === 'arrived').length;
            const absent = ps.filter(p => p.status === 'absent').length;
            const isToday = d.date === todayDate;
            const pct = ps.length ? Math.round(arrived / ps.length * 100) : 0;

            return (
              <div
                key={d.id}
                className="card2"
                style={{ cursor: 'pointer', borderColor: isToday ? 'rgba(245,158,11,.35)' : undefined, transition: 'border-color .2s' }}
                onClick={() => onOpen(d.id)}
              >
                <div className="flex-center gap12">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-center gap8" style={{ marginBottom: 5 }}>
                      <span style={{ fontWeight: 900, fontSize: 16, color: isToday ? 'var(--accent)' : 'var(--text)' }}>{d.name}</span>
                      {isToday && <span className="badge badge-amber">اليوم</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{fmtDate(d.date)}</div>
                    <div className="flex gap12">
                      <span style={{ fontSize: 12, color: 'var(--blue)' }}>👥 {ps.length}</span>
                      <span style={{ fontSize: 12, color: 'var(--green)' }}>✅ {arrived}</span>
                      <span style={{ fontSize: 12, color: 'var(--red)' }}>❌ {absent}</span>
                    </div>
                    {ps.length > 0 && (
                      <div className="pbar" style={{ marginTop: 8, width: '60%' }}>
                        <div className="pbar-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap8 shrink0" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-primary btn-sm" onClick={() => onOpen(d.id)}>فتح ←</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-dim)' }} onClick={() => { if (confirm('حذف هذه المسودة نهائياً؟')) onDelete(d.id); }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════ */
function SettingsPage({ regions, onUpdate, drafts, onImportDrafts }) {
  const toast = useToast();
  const [list, setList] = useState([...regions].sort((a, b) => a.sortOrder - b.sortOrder));
  const [newName, setNewName] = useState('');
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => { setList([...regions].sort((a, b) => a.sortOrder - b.sortOrder)); }, [regions]);

  const persist = (updated) => { setList(updated); onUpdate(updated); };

  const toggle = (id) => persist(list.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const del = (id) => { if (confirm('حذف هذه المنطقة نهائياً؟')) { persist(list.filter(r => r.id !== id)); toast('تم حذف المنطقة', 'success'); } };

  const addNew = () => {
    if (!newName.trim()) return;
    const max = Math.max(...list.map(r => r.sortOrder), 0);
    persist([...list, { id: uid(), name: newName.trim(), sortOrder: max + 1, active: true }]);
    setNewName('');
    toast('تم إضافة المنطقة', 'success');
  };

  /* ── Drag & drop (Mouse) ── */
  const onDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const arr = [...list];
    const [item] = arr.splice(dragIdx, 1);
    arr.splice(i, 0, item);
    const reordered = arr.map((r, idx) => ({ ...r, sortOrder: idx + 1 }));
    setList(reordered);
    onUpdate(reordered);
    setDragIdx(null);
  };
  const onDragEnd = () => { setDragIdx(null); };

  /* ── Touch drag & drop (Mobile) ── */
  const touchDragIdx = useRef(null);
  const touchClone = useRef(null);
  const touchListRef = useRef(null);
  const touchStartEl = useRef(null);
  const touchMoved = useRef(false);
  const touchStartY = useRef(0);
  const touchCloneX = useRef(0); // نحفظ X ثابت للـ clone

  const DRAG_THRESHOLD = 8; // بكسل — لازم يتحرك أكتر من كده عشان يبدأ السحب

  const onTouchStart = (e, i) => {
    touchDragIdx.current = i;
    touchMoved.current = false;
    touchStartEl.current = e.currentTarget.closest('[data-drag-idx]'); // الـ row كاملة
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e, i) => {
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // لو الحركة أقل من الـ threshold → تجاهل (scroll عادي)
    if (!touchMoved.current && deltaY < DRAG_THRESHOLD) return;

    // أول حركة تتجاوز الـ threshold: أنشئ الـ clone
    if (!touchMoved.current) {
      touchMoved.current = true;
      setDragIdx(touchDragIdx.current);
      e.preventDefault();

      const el = touchStartEl.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        touchCloneX.current = rect.left; // نحفظ X ثابت
        const clone = el.cloneNode(true);
        clone.style.cssText = [
          'position:fixed',
          'z-index:9999',
          'pointer-events:none',
          `width:${rect.width}px`,
          `left:${touchCloneX.current}px`,  // X ثابت دايماً
          `top:${rect.top}px`,
          'opacity:0.85',
          'background:var(--border)',
          'border:1px solid var(--accent)',
          'border-radius:8px',
          'box-shadow:0 8px 28px rgba(0,0,0,.6)',
          'transition:none',
        ].join(';');
        document.body.appendChild(clone);
        touchClone.current = clone;
      }
      return;
    }

    e.preventDefault();

    // حرّك الـ clone رأسياً فقط — X لا يتغير أبداً
    if (touchClone.current) {
      touchClone.current.style.top = `${touch.clientY - 24}px`;
      touchClone.current.style.left = `${touchCloneX.current}px`;
    }

    // اعرف أي عنصر تحت الإصبع
    if (touchClone.current) touchClone.current.style.display = 'none';
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (touchClone.current) touchClone.current.style.display = '';

    if (!elBelow) return;
    const row = elBelow.closest('[data-drag-idx]');
    if (!row) return;
    const targetIdx = parseInt(row.dataset.dragIdx, 10);
    if (isNaN(targetIdx) || touchDragIdx.current === targetIdx) return;

    const arr = [...list];
    const [item] = arr.splice(touchDragIdx.current, 1);
    arr.splice(targetIdx, 0, item);
    const reordered = arr.map((r, idx) => ({ ...r, sortOrder: idx + 1 }));
    setList(reordered);
    touchDragIdx.current = targetIdx;
    setDragIdx(targetIdx);
  };

  const onTouchEnd = useCallback(() => {
    if (touchClone.current) {
      touchClone.current.remove();
      touchClone.current = null;
    }
    if (touchMoved.current) onUpdate(list);
    touchDragIdx.current = null;
    touchMoved.current = false;
    setDragIdx(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const resetRegions = () => {
    if (!confirm('هل تريد إعادة ضبط المناطق للقائمة الافتراضية؟\nسيتم حذف أي مناطق أضفتها يدوياً.')) return;
    persist(DEFAULT_REGIONS);
    toast('تم إعادة ضبط المناطق للقائمة الافتراضية ✔', 'success');
  };

  const exportAll = () => {
    const data = { regions: list, drafts: drafts || [], exportedAt: new Date().toISOString() };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `bus-backup-${today()}.json`;
    a.click();
    toast('تم تصدير البيانات', 'success');
  };

  const importAll = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.regions) onUpdate(data.regions);
        if (data.drafts) onImportDrafts(data.drafts);
        toast('تم الاستيراد — أعد تحميل الصفحة لرؤية التغييرات الكاملة', 'info');
      } catch { toast('خطأ في ملف الاستيراد', 'error'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const activeCount = list.filter(r => r.active).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">⚙️ الإعدادات</h1>
        <p className="section-sub">إدارة المناطق وإعدادات النظام</p>
      </div>

      {/* Regions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-center" style={{ marginBottom: 14, gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)' }}>🗺️ المناطق الرئيسية</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {activeCount} نشطة / {list.length} إجمالي
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={resetRegions}
            title="إعادة ضبط المناطق للقائمة الافتراضية"
            style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,.3)', flexShrink: 0 }}
          >
            🔄 إعادة الضبط
          </button>
        </div>

        {/* Add region */}
        <div className="flex gap8" style={{ marginBottom: 14 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="اسم منطقة جديدة..."
            onKeyDown={e => e.key === 'Enter' && addNew()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={addNew} disabled={!newName.trim()}>+ إضافة</button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text4)', padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, marginBottom: 12 }}>
          💡 اسحب وأفلت ⠿ لإعادة ترتيب المناطق — التغييرات تنعكس فوراً على جميع المسودات
        </div>

        <div ref={touchListRef} style={{ maxHeight: 420, overflowY: 'auto' }}>
          {list.map((r, i) => (
            <div
              key={r.id}
              data-drag-idx={i}
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, i)}
              onDragEnd={onDragEnd}
              onContextMenu={e => e.preventDefault()}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 4,
                background: dragIdx === i ? 'var(--border)' : 'var(--card2)',
                border: `1px solid ${dragIdx === i ? 'var(--accent)' : 'var(--border2)'}`,
                opacity: r.active ? 1 : .5,
                transition: 'all .15s',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
            >
              <span
                className="dh"
                draggable
                onDragStart={e => onDragStart(e, i)}
                onTouchStart={e => onTouchStart(e, i)}
                onTouchMove={e => onTouchMove(e, i)}
                onTouchEnd={onTouchEnd}
                onContextMenu={e => e.preventDefault()}
                style={{ touchAction: 'none', cursor: 'grab', padding: '4px 8px', fontSize: 20 }}
              >⠿</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{r.sortOrder}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{r.name}</span>
              <label className="flex-center gap6" style={{ cursor: 'pointer', fontSize: 11, color: r.active ? 'var(--green)' : 'var(--red)', margin: 0 }}>
                <input type="checkbox" checked={r.active} onChange={() => toggle(r.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                {r.active ? 'نشط' : 'معطل'}
              </label>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                style={{ color: 'var(--red-dim)' }}
                onClick={() => del(r.id)}
                title="حذف المنطقة"
              >🗑️</button>
            </div>
          ))}
        </div>
      </div>

      {/* Export / Import */}
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)', marginBottom: 14 }}>💾 النسخ الاحتياطي</div>
        <div className="flex gap10" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-secondary" onClick={exportAll}>📤 تصدير البيانات</button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📥 استيراد البيانات
            <input type="file" accept=".json" onChange={importAll} style={{ display: 'none' }} />
          </label>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
          يتم تصدير جميع المسودات والمناطق كملف JSON — يمكن استيراده على أي جهاز
        </p>
      </div>

      {/* Info */}
      <div className="card" style={{ marginTop: 16, borderColor: 'rgba(96,165,250,.2)', background: 'rgba(96,165,250,.04)' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--blue)', marginBottom: 10 }}>📖 أمثلة على الرسائل المدعومة</div>
        {[
          '"انا احمد من النمسا ورقمي 01012345678"',
          '"محمد علي الترعة 01099999999"',
          '"انا محمود ومعايا صاحبي كريم هنركب من قصر الشوق 01111111111"',
        ].map((ex, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, marginBottom: 6, direction: 'rtl' }}>
            {ex}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════ */
export default function App() {
  // ── State ── null means "not yet loaded from IDB"
  const [regions, setRegions] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('dashboard');
  const [draftId, setDraftId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Timers for debounced writes — one ref per store key
  const regionsTimer = useRef(null);
  const draftsTimer = useRef(null);

  /* ── Boot: load both keys in parallel from IndexedDB ── */
  useEffect(() => {
    Promise.all([
      getItem(SK.REGIONS),
      getItem(SK.DRAFTS),
    ]).then(([savedRegions, savedDrafts]) => {
      const r = savedRegions
        ? [...savedRegions].sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999))
        : DEFAULT_REGIONS;
      setRegions(r);
      setDrafts(savedDrafts || []);
    }).catch(() => {
      // Fallback to defaults on any IDB error
      setRegions(DEFAULT_REGIONS);
      setDrafts([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  /* ── Debounced save: regions (~800 ms after last change) ──
     Guard: skip the first render (null) to avoid overwriting IDB
     with empty data before the load completes.               */
  useEffect(() => {
    if (regions === null) return;
    if (regionsTimer.current) clearTimeout(regionsTimer.current);
    regionsTimer.current = setTimeout(() => {
      setItem(SK.REGIONS, regions).catch(console.error);
    }, 800);
    return () => clearTimeout(regionsTimer.current);
  }, [regions]);

  /* ── Debounced save: drafts (~800 ms after last change) ── */
  useEffect(() => {
    if (drafts === null) return;
    if (draftsTimer.current) clearTimeout(draftsTimer.current);
    draftsTimer.current = setTimeout(() => {
      setItem(SK.DRAFTS, drafts).catch(console.error);
    }, 800);
    return () => clearTimeout(draftsTimer.current);
  }, [drafts]);

  // Show a full-screen spinner while IDB is loading
  if (loading) return <LoadingScreen />;

  const currentDraft = drafts.find(d => d.id === draftId);

  const nav = (v) => { setView(v); if (v !== 'draft') setDraftId(null); };

  const openDraft = (id) => { setDraftId(id); setView('draft'); };
  const createDraft = (data) => { setDrafts(p => [...p, data]); setShowCreate(false); openDraft(data.id); };
  const deleteDraft = (id) => setDrafts(p => p.filter(d => d.id !== id));
  const updateDraft = (d) => setDrafts(p => p.map(x => x.id === d.id ? d : x));

  // Called by SettingsPage's import — replaces the draft list immediately
  const handleImportDrafts = (importedDrafts) => {
    setDrafts(importedDrafts);
  };

  return (
    <ToastProvider>
      <Header
        view={view}
        onNav={nav}
        draftName={view === 'draft' && currentDraft ? currentDraft.name : null}
      />

      <main style={{ paddingBottom: 48 }}>
        {view === 'dashboard' && (
          <Dashboard
            drafts={drafts}
            onOpen={openDraft}
            onCreate={() => setShowCreate(true)}
            onDelete={deleteDraft}
          />
        )}
        {view === 'draft' && currentDraft && (
          <DraftView draft={currentDraft} regions={regions} onUpdate={updateDraft} />
        )}
        {view === 'draft' && !currentDraft && (
          <div className="empty">
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">المسودة غير موجودة</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => nav('dashboard')}>
              ← العودة للقائمة
            </button>
          </div>
        )}
        {view === 'settings' && (
          <SettingsPage
            regions={regions}
            onUpdate={setRegions}
            drafts={drafts}
            onImportDrafts={handleImportDrafts}
          />
        )}
      </main>

      {showCreate && (
        <CreateDraftModal onSave={createDraft} onClose={() => setShowCreate(false)} />
      )}
    </ToastProvider>
  );
}
