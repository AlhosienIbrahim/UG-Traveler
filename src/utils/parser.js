import {
  STOP_WORDS, JUNK_LINE_PATTERNS, NOTES_LINE_PATTERNS,
  WAAW_NAMES, STOP_PHRASES,
} from '../constants';

const ARABIC = /^[\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]+$/;
const PHONE_RX = /0[12]\d{9}/g;

// ─── #1: Pre-compile STOP_PHRASES once at module load ──────────────────────
// بدل new RegExp() في كل استدعاء لـ extractCleanName
const STOP_PHRASE_RXS = STOP_PHRASES.map(ph => new RegExp(ph, 'g'));

/* تحويل الأرقام العربية/الهندية إلى أرقام غربية + تنظيف Unicode خفي */
export function normalizeNums(str) {
  return str
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
    .replace(/[٠-٩۰-۹]/g, d =>
      d.charCodeAt(0) <= 0x0669 ? d.charCodeAt(0) - 0x0660 : d.charCodeAt(0) - 0x06f0
    )
    .replace(/(?:\+20|0020)[\s\-]?(1\d{1,2})[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})[\s\-]?(\d*)/g,
      (_, a, b, c, d) => '0' + a + b + c + d)
    .replace(/(0[12]\d)[\s\-](\d{4})[\s\-](\d{4})/g, '$1$2$3');
}

export function isJunkLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/0[12]\d{9}/.test(normalizeNums(trimmed))) return false;
  return JUNK_LINE_PATTERNS.some(rx => rx.test(trimmed));
}

export function isNotesLine(line) {
  return NOTES_LINE_PATTERNS.some(rx => rx.test(line.trim()));
}

export function preProcessLine(text) {
  let s = text;
  s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '');
  s = s.replace(/^[\s]*(?:[١-٩\d][٠-٩\d]?\s*[-.)\]\s*|[١٢٣٤٥٦٧٨٩]\s*[-.)]\s*)/, '');
  s = s.replace(/^(?:الاسم|اسمه|اسمها|اسم|رقم|منطقه|المنطقه|منطقة|المنطقة|موقف|ركوب)\s*[:ـ]\s*/i, '');

  // ── حذف تحيات البداية المضمنة ──
  s = s.replace(/(?:صباح|مساء)\s+(?:الخير|النور|الفل|الورد|الياسمين|السعد)\s*/gi, '');
  s = s.replace(/(?:هالو|هلو|الو|ألو|مرحبا|مرحباً|أهلاً|اهلا|السلام\s+عليكم|وعليكم\s+السلام)\s*/gi, '');

  // ── حذف نداء: 'يا + لقب/علاقة' في بداية السطر ──
  // 'يا زميلي' / 'يا اخويا' / 'يا باشا' إلخ
  s = s.replace(
    /^يا\s+(?:زميل[يه]?|صاحب[يه]?|حبيب[يه]?|باشا|بيه|فندم|غالي?|عم[يه]?|اخو(?:يا|ه)|اخت[يه]?|استاذ|دكتور|بروف)\s*/i,
  '');

  // ── حذف سؤال الحال المضمن في البداية ──
  // 'عامل ايه يا زميلي انا...' → 'انا...'
  s = s.replace(/^(?:عامل|عاملة|عاملين)\s*(?:ايه|إيه|اي)(?:\s+يا\s+\S+)?\s*/i, '');
  s = s.replace(/^(?:ازيكم|ازيكو|ازيك)(?:\s+يا\s+[\u0600-\u06FF]+)?\s*/i, ''); // أطول أولاً
  // حذف 'يا + كلمة' في بداية السطر لو تبقت بعد الحذف السابق
  s = s.replace(/^يا\s+(?:جماعة|شباب|ناس|اصحاب|زملاء)\s*/i, '');

  // ── حذف عبارات الحجز/الانضمام أينما ظهرت في السطر ──
  s = s.replace(
    /(?:عايز|عاوز|عايزة|عاوزة|حابب|حابة|بدي|ابي|ابغى|نفسي|اريد)\s+(?:احجز|اشترك|اتسجل|اسجل|اضيف|انضم|اركب)\s*(?:معاكم|معكم|معك|معايا|فيكم|معاكو)?\s*/gi,
  '');

  // ── حذف "ممكن تسجيلي / ممكن تضيفني" ──
  s = s.replace(/(?:ممكن|ينفع|يمكن)\s+(?:تسجيلي?|تسجلني|تضيفني|احجزلي|تضيفوني|تسجلوني)\s*/gi, '');

  // ── حذف عبارات الطلب المهذب: "لو سمحت/سمحتوا" / "من فضلك" ──
  s = s.replace(/(?:لو\s+سمحت(?:وا?)?|من\s+فضلك(?:م)?)\s*/gi, '');

  // ── حذف "انا" في أي موضع ──
  s = s.replace(/(?:^|\s)انا(?=\s|$)/g, ' ');

  // ── حذف روابط البيانات "وده / وهو / وهي" ──
  // \b لا يعمل مع العربية — نستخدم space boundary
  s = s.replace(/(?:^|(?<=\s))(?:وده|وهو|وهي)(?=\s|$)/g, ' ');

  s = s.replace(/(?:إسمي|اسمي|اسمه|اسمها|إسمه|اسمي\s+هو|اسمه\s+هو)\s*/gi, '');
  s = s.replace(/(?:هنركب|بيركب|هركب|هاركب|عايز\s+اركب|عاوز\s+اركب)\s+(?:من\s+)?(?:عند\s+)?/g, '');
  s = s.replace(/من\s+(?:عند|قدام|امام|أمام|جنب)\s+/g, '');
  s = s.replace(/(?:و\s*)?(?:رقمي|رقمه|رقمها|نمرتي|نمرته|نمرتها)\s+(?:هو\s+)?/g, ' ');
  s = s.replace(/هنركب\s+(?:عند|في|من)\s*/g, '');
  s = s.replace(/[،,،.]{2,}/g, ' ').replace(/\s{2,}/g, ' ');
  return s.trim();
}

// ─── #2: normCache — رفع الـ threshold لتجنب cold-start مفاجئ ─────────────
const _normCache = new Map();
export function arNorm(str) {
  let r = _normCache.get(str);
  if (r !== undefined) return r;
  r = str
    .split(/\s+/)
    .map(w => w.replace(/^ال(?=[\u0600-\u06FF])/, ''))
    .join(' ')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (_normCache.size > 10_000) _normCache.clear(); // رفعنا من 4000 لـ 10000
  _normCache.set(str, r);
  return r;
}

// ─── #3: editDist — 1D rolling array بدل 2D ────────────────────────────────
// نفس النتيجة بالظبط، بس O(min(m,n)) memory بدل O(m×n)
function editDist(a, b) {
  if (a.length < b.length) { const t = a; a = b; b = t; } // a دايماً الأطول
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array(n + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function similarity(a, b) {
  const na = arNorm(a), nb = arNorm(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  return 1 - editDist(na, nb) / maxLen;
}

function normIncludes(haystack, needle) {
  const nh = arNorm(haystack);
  const nn = arNorm(needle);
  if (!nn) return false;
  if (!nn.includes(' ')) {
    return nh.split(/\s+/).some(w => w === nn);
  }
  return nh.includes(nn);
}

// ─── #4: getRegionIndex — reference check بدل string comparison ─────────────
// بدل .map().join() على كل المناطق في كل call
let _rIdx = null;
let _lastRegionsRef = null;

function getRegionIndex(regions) {
  if (regions === _lastRegionsRef && _rIdx) return _rIdx; // O(1) بدل O(R)
  _lastRegionsRef = regions;

  const active = regions.filter(r => r.active).sort((a, b) => b.name.length - a.name.length);
  const byNorm = new Map();
  const byWord = new Map();

  for (const r of active) {
    const norm = arNorm(r.name);
    byNorm.set(norm, r);
    for (const w of norm.replace(/[^\u0600-\u06FF\s]/g, ' ').split(/\s+/)) {
      if (w.length >= 3) {
        if (!byWord.has(w)) byWord.set(w, []);
        byWord.get(w).push(r);
      }
    }
  }

  _rIdx = { active, byNorm, byWord };
  return _rIdx;
}

// ─── #5: findRegion — cache per normalized text ─────────────────────────────
const _regionCache = new Map();
let _regionCacheRegionsRef = null;

export function findRegion(text, regions) {
  // لو المناطق اتغيرت، امسح الـ cache
  if (regions !== _regionCacheRegionsRef) {
    _regionCache.clear();
    _regionCacheRegionsRef = regions;
  }

  const cacheKey = arNorm(text);
  if (_regionCache.has(cacheKey)) return _regionCache.get(cacheKey);

  const result = _findRegionImpl(text, regions);
  if (_regionCache.size > 500) _regionCache.clear();
  _regionCache.set(cacheKey, result);
  return result;
}

function _findRegionImpl(text, regions) {
  const { active, byNorm, byWord } = getRegionIndex(regions);
  if (!active.length) return null;

  const textNorm = arNorm(text);
  const textWords = textNorm.split(/\s+/);
  const textWordSet = new Set(textWords);

  // ① مطابقة تامة
  if (byNorm.has(textNorm)) {
    const r = byNorm.get(textNorm);
    return { region: r, matchedText: r.name };
  }

  const buildMatchedText = r => {
    const normMap = {};
    text.split(/\s+/).forEach(w => {
      const c = w.replace(/[^\u0600-\u06FF]/g, '');
      if (c) normMap[arNorm(c)] = c;
    });
    return r.name.split(/\s+/)
      .map(w => normMap[arNorm(w.replace(/[^\u0600-\u06FF]/g, ''))] || w)
      .join(' ');
  };

  // ② substring للمناطق متعددة الكلمات
  for (const r of active) {
    const rNorm = arNorm(r.name);
    const rNormClean = rNorm.replace(/[^\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const rWords = rNormClean.split(/\s+/).filter(Boolean);
    if (rWords.length < 2) continue;
    if (textNorm.includes(rNormClean)) {
      return { region: r, matchedText: buildMatchedText(r) };
    }
  }

  // ③ Word-overlap via inverted index
  const scores = new Map();
  for (const tw of textWordSet) {
    if (tw.length < 3) continue;
    for (const r of (byWord.get(tw) || [])) {
      scores.set(r, (scores.get(r) || 0) + 1);
    }
  }

  if (scores.size > 0) {
    let best = null, bestScore = 0, bestExact = false;
    for (const [r, score] of scores) {
      const rNorm = arNorm(r.name);
      const meaningful = rNorm.split(/\s+/).filter(w => w.length > 2).length;
      const isExact = textNorm.includes(rNorm);
      if (meaningful >= 3 && score < 2 && !isExact) continue;
      const ratio = meaningful > 0 ? score / meaningful : 1;
      if (meaningful >= 2 && ratio < 0.34 && !isExact) continue;
      const better = score > bestScore
        || (score === bestScore && isExact && !bestExact)
        || (score === bestScore && isExact && bestExact && r.name.length < (best?.name.length || Infinity));
      if (better) { bestScore = score; best = r; bestExact = isExact; }
    }
    if (best) return { region: best, matchedText: best.name };
  }

  // ②b مطابقة الكلمة المفردة
  for (const r of active) {
    const rNorm = arNorm(r.name);
    const rNormClean = rNorm.replace(/[^\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const rWords = rNormClean.split(/\s+/).filter(Boolean);
    if (rWords.length !== 1) continue;
    if (textWordSet.has(rNormClean)) {
      return { region: r, matchedText: buildMatchedText(r) };
    }
  }

  // ④ مطابقة جزئية
  const msgWords = text.split(/\s+/)
    .map(w => w.replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]/g, ''))
    .filter(w => w.length > 1);

  let bPartial = null, bPartialPhrase = '', bPartialScore = 0;
  for (const r of active) {
    const rMeaningful = r.name.split(/\s+/).filter(w => arNorm(w).length > 2);
    for (let start = 0; start < msgWords.length; start++) {
      for (let len = msgWords.length - start; len >= 1; len--) {
        if (len === 1 && rMeaningful.length >= 2) continue;
        const phrase = msgWords.slice(start, start + len).join(' ');
        const minLen = len === 1 ? 4 : 3;
        if (phrase.length >= minLen && normIncludes(r.name, phrase)) {
          const coverageRatio = len / Math.max(rMeaningful.length, 1);
          if (rMeaningful.length >= 3 && coverageRatio < 0.4) break;
          if (phrase.length > bPartialScore) {
            bPartialScore = phrase.length;
            bPartial = r;
            bPartialPhrase = phrase;
          }
          break;
        }
      }
    }
  }
  if (bPartial) return { region: bPartial, matchedText: bPartialPhrase };

  // ⑤ Fuzzy Levenshtein
  let bFuzzy = null, bFuzzyWord = '', bFuzzyScore = 0;
  for (const r of active) {
    const rWords = r.name.split(/\s+/).filter(w => w.length > 3);
    const rMeaningful = r.name.split(/\s+/).filter(w => arNorm(w).length > 2);
    if (rMeaningful.length >= 2) {
      let matchCount = 0, totalSim = 0;
      for (const mw of msgWords) {
        if (mw.length < 4) continue;
        for (const rw of rWords) {
          const sim = similarity(mw, rw);
          if (sim >= 0.85) { matchCount++; totalSim += sim; break; }
        }
      }
      if (matchCount >= 2 && totalSim > bFuzzyScore) {
        bFuzzyScore = totalSim; bFuzzy = r; bFuzzyWord = r.name;
      }
    } else {
      for (const mw of msgWords) {
        if (mw.length < 4) continue;
        for (const rw of rWords) {
          const sim = similarity(mw, rw);
          const threshold = rw.length >= 6 ? 0.80 : 0.88;
          if (sim >= threshold && sim > bFuzzyScore) {
            bFuzzyScore = sim; bFuzzy = r; bFuzzyWord = mw;
          }
        }
      }
    }
  }
  if (bFuzzy) return { region: bFuzzy, matchedText: bFuzzyWord };

  return null;
}

export function extractCleanName(text, phonesToRemove, regionsToRemove) {
  let s = text;

  phonesToRemove.forEach(p => { s = s.replace(new RegExp(p.replace(/\+/g, '\\+'), 'g'), ' '); });
  s = s.replace(/0[12]\d{9}/g, ' ');

  regionsToRemove.forEach(r => {
    const escName = (r.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escMT = (r.matchedText || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escName) {
      s = s.replace(new RegExp('ال' + escName, 'g'), ' ');
      s = s.replace(new RegExp(escName, 'g'), ' ');
    }
    if (escMT && escMT !== escName) {
      s = s.replace(new RegExp('ال' + escMT, 'g'), ' ');
      s = s.replace(new RegExp(escMT, 'g'), ' ');
    }
    const rWordNorms = (r.name || '').split(/\s+/).filter(w => w.length > 1).map(arNorm);
    s = s.split(/\s+/).filter(sw => {
      const swClean = sw.replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]/g, '');
      if (!swClean) return false;
      const swNorm = arNorm(swClean);
      if (rWordNorms.includes(swNorm)) return false;
      if (swClean.length >= 4) {
        for (const rw of rWordNorms) {
          if (rw.length >= 4 && similarity(swNorm, rw) >= 0.80) return false;
        }
      }
      return true;
    }).join(' ');
  });

  NOTES_LINE_PATTERNS.forEach(rx => { s = s.replace(rx, ' '); });
  // ─── استخدام الـ pre-compiled regexes ────────────────────────────────────
  STOP_PHRASE_RXS.forEach(rx => { rx.lastIndex = 0; s = s.replace(rx, ' '); });
  JUNK_LINE_PATTERNS.forEach(rx => { s = s.replace(rx, ' '); });

  s = s.replace(/[+٠-٩۰-۹0-9?!،.,:;\-_()\[\]\u061F\u060C\u061B\u06D4\u0640]/g, ' ');

  return s
    .split(/[\s\n]+/)
    .map(w => w.replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1]/g, '').trim())
    .filter(w => {
      if (w.length <= 1 || !ARABIC.test(w)) return false;
      if (STOP_WORDS.has(w) || STOP_WORDS.has(arNorm(w))) return false;
      // حذف الكلمات اللي فيها واو عطف + كلمة stop: "ومنطقتي", "وموبايلي"
      if (w.startsWith('و') && w.length > 2) {
        const withoutWaw = w.slice(1);
        if (STOP_WORDS.has(withoutWaw) || STOP_WORDS.has(arNorm(withoutWaw))) return false;
      }
      return true;
    })
    .join(' ')
    .trim();
}

export function classifyLine(line, regions) {
  if (isJunkLine(line)) return { type: 'empty', value: '', phone: '', region: null, nameStr: '' };
  const norm = normalizeNums(preProcessLine(line.trim()));

  PHONE_RX.lastIndex = 0;
  const phoneMatch = norm.match(/0[12]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  const regionResult = findRegion(norm, regions);
  const region = regionResult?.region || null;
  const matchedTx = regionResult?.matchedText || '';

  if (phone && norm.replace(/\d/g, '').trim().length < 3) {
    return { type: 'phone', value: phone, phone, region: null, nameStr: '' };
  }

  if (region && !phone) {
    const withoutRegion = extractCleanName(norm, [], [{ name: region.name, matchedText: matchedTx }]);
    if (!withoutRegion) {
      return { type: 'region', value: region, matchedText: matchedTx, phone: '', region, nameStr: '' };
    }
  }

  let inlineNote = '';
  let normForName = norm;
  for (const rx of NOTES_LINE_PATTERNS) {
    const m = normForName.match(rx);
    if (m) {
      inlineNote = [inlineNote, m[0].trim()].filter(Boolean).join(' ، ');
      normForName = normForName.replace(m[0], ' ');
    }
  }

  const nameStr = extractCleanName(normForName,
    phone ? [phone] : [],
    region ? [{ name: region.name, matchedText: matchedTx }] : []
  );

  if (!phone && !region && !nameStr) return { type: 'empty', value: '' };
  return {
    type: phone ? 'phone' : (region ? 'region' : 'name'),
    value: phone || (region ? region : nameStr),
    matchedText: matchedTx,
    phone, region, nameStr, inlineNote,
  };
}

function splitOnWaaw(text) {
  const rawParts = text.split(/ و(?=[ء-غف-يٰپچژگیہ ])/);
  if (rawParts.length < 2) return [text];
  const merged = [rawParts[0]];
  for (let i = 1; i < rawParts.length; i++) {
    const firstWord = rawParts[i].trim().split(/\s+/)[0] || '';
    if (WAAW_NAMES.has('و' + firstWord) || WAAW_NAMES.has(arNorm('و' + firstWord))) {
      merged[merged.length - 1] += ' و' + rawParts[i];
    } else {
      merged.push(rawParts[i]);
    }
  }
  return merged;
}

export function parseMultilineBlocks(raw, regions) {
  const isCleanNameOnly = seg => {
    if (/0[12]\d{9}/.test(seg)) return false;
    const ws = seg.trim()
      .replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1\s]/g, '')
      .split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w) && !STOP_WORDS.has(arNorm(w)));
    return ws.length >= 1 && ws.length <= 4;
  };

  const expandedLines = [];
  raw.split(/\n/).forEach(line => {
    const t = line.trim();
    if (!t) return;
    if (/\+(?!\s*20|\d{10})/.test(t)) {
      t.split(/\+(?!\s*20|\d{10})/).map(s => s.trim()).filter(Boolean).forEach(s => expandedLines.push(s));
      return;
    }
    const waParts = splitOnWaaw(t);
    if (waParts.length >= 2 && waParts.slice(0, -1).every(p => isCleanNameOnly(p.trim()))) {
      const lastPart = waParts[waParts.length - 1].trim();
      const lastClean = isCleanNameOnly(lastPart);
      // نقسم برضو لو الجزء الأخير فيه رقم تليفون
      // الـ globalPhone logic هتوزع الرقم على الباقين تلقائياً
      const lastHasPhone = /0[12]\d{9}/.test(lastPart);
      if (waParts.length >= 3 || lastClean || lastHasPhone) {
        waParts.map(s => s.trim()).filter(Boolean).forEach(s => expandedLines.push(s));
        return;
      }
    }
    expandedLines.push(t);
  });

  const lines = expandedLines;
  if (lines.length < 2) return null;

  const classified = lines.map(l => classifyLine(l, regions));
  const allPhones = classified.map(c => c.phone).filter(Boolean);
  const allRegions = classified.map(c => c.region).filter(Boolean);
  const globalPhone = allPhones.length === 1 ? allPhones[0] : '';
  const uniqueRegions = [...new Map(allRegions.map(r => [r.id, r])).values()];
  const globalRegion = uniqueRegions.length === 1 ? uniqueRegions[0] : null;

  const blocks = [];
  let cur = null;
  let noteBatchStart = 0;

  classified.forEach((cl, i) => {
    const hasName = !!cl.nameStr;
    const hasPhone = !!cl.phone;
    const hasRegion = !!cl.region;
    const isMixed = (hasName && (hasPhone || hasRegion)) || (hasPhone && hasRegion);
    const curComplete = cur && cur.name && cur.phone;

    if (isNotesLine(lines[i])) {
      const note = lines[i].trim();
      const batch = [...blocks.slice(noteBatchStart), ...(cur ? [cur] : [])].filter(b => b.name);
      batch.forEach(b => { b.notes = [b.notes, note].filter(Boolean).join(' ، '); });
      noteBatchStart = blocks.length;
      return;
    }

    if (isMixed) {
      if (curComplete) {
        blocks.push(cur);
        cur = { name: cl.nameStr || '', phone: cl.phone || '', region: cl.region || null, notes: cl.inlineNote || '' };
        if (cl.phone) { blocks.push(cur); cur = null; }
      } else {
        if (cur) blocks.push(cur);
        cur = { name: cl.nameStr || '', phone: cl.phone || '', region: cl.region || null, notes: cl.inlineNote || '' };
        if (cl.phone) { blocks.push(cur); cur = null; }
      }
    } else if (cl.type === 'name' && cl.value) {
      if (curComplete) {
        const nextHasPhone = classified.slice(i + 1, i + 3).some(nc => nc.phone);
        if (nextHasPhone) {
          blocks.push(cur);
          cur = { name: cl.value, phone: '', region: cur.region || null, notes: cl.inlineNote || '' };
        } else {
          cur.notes = [cur.notes, lines[i].trim()].filter(Boolean).join(' ، ');
        }
      } else {
        if (cur) blocks.push(cur);
        cur = { name: cl.value, phone: '', region: null, notes: cl.inlineNote || '' };
      }
    } else if (cl.type === 'phone') {
      if (!cur) cur = { name: '', phone: cl.value, region: null, notes: cl.inlineNote || '' };
      else if (!cur.phone) cur.phone = cl.value;
      else { blocks.push(cur); cur = { name: '', phone: cl.value, region: null, notes: '' }; }
    } else if (cl.type === 'region') {
      if (!cur) cur = { name: '', phone: '', region: cl.value, notes: cl.inlineNote || '' };
      else cur.region = cl.value;
    } else if (cl.type === 'empty' && cur && lines[i].trim()) {
      cur.notes = [cur.notes, lines[i].trim()].filter(Boolean).join(' ، ');
    }
  });
  if (cur) blocks.push(cur);

  if (blocks.length > 0) {
    let inheritedRegion = globalRegion;
    for (const b of blocks) {
      if (!b.phone && globalPhone) b.phone = globalPhone;
      if (!b.region) b.region = inheritedRegion;
      if (b.region) inheritedRegion = b.region;
    }
  }

  const validBlocks = blocks.filter(b => b.name && b.name.trim());
  if (validBlocks.length === 0) return null;
  if (validBlocks.length <= 1 && lines.length <= 1) return null;
  return validBlocks.length > 0 ? validBlocks : null;
}

export function splitPersonSegments(raw) {
  const plusParts = raw.split(/\+(?!\d{10,}|\s*20)/);
  if (plusParts.length > 1 && plusParts.every(p => p.trim())) {
    return plusParts.map(s => s.trim()).filter(Boolean);
  }

  if (/ومعايا|معايا/.test(raw)) {
    const idx = raw.search(/ومعايا|معايا/);
    return [raw.slice(0, idx).trim(), raw.slice(idx).trim()].filter(Boolean);
  }

  const slashParts = raw.split(/\s*[\/|]\s*/);
  if (slashParts.length > 1) {
    const looksLikePeople = slashParts.every(p => {
      const t = p.trim();
      if (!t) return false;
      if (/0[12]\d{9}/.test(t)) return true;
      const words = t.replace(/[^\u0600-\u06FF\s]/g, '').trim().split(/\s+/).filter(Boolean);
      return words.length >= 1 && words.length <= 5;
    });
    const hasPhone = slashParts.some(p => /0[12]\d{9}/.test(p));
    if (looksLikePeople && (slashParts.length >= 3 || (slashParts.length === 2 && hasPhone))) {
      return slashParts.map(s => s.trim()).filter(Boolean);
    }
  }

  const isCleanNameSeg = seg => {
    PHONE_RX.lastIndex = 0;
    if (PHONE_RX.test(seg)) return false;
    const ws = seg.trim()
      .replace(/[^\u0621-\u063A\u0641-\u064A\u0670\u067E\u0686\u0698\u06AF\u06CC\u06C1\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w) && !STOP_WORDS.has(arNorm(w)));
    return ws.length >= 1 && ws.length <= 4;
  };

  PHONE_RX.lastIndex = 0;
  const waParts = splitOnWaaw(raw);
  if (waParts.length >= 2) {
    const allButLast = waParts.slice(0, -1);
    if (allButLast.every(p => isCleanNameSeg(p.trim()))) {
      const lastPart = waParts[waParts.length - 1].trim();
      const lastClean = isCleanNameSeg(lastPart);
      const lastHasPhone = /0[12]\d{9}/.test(lastPart);
      if (waParts.length >= 3 || lastClean || lastHasPhone) {
        return waParts.map(s => s.trim()).filter(Boolean);
      }
    }
  }

  return [raw];
}

export function parseMessage(text, regions) {
  const cleaned = text.trim().split('\n')
    .map(l => preProcessLine(l))
    .filter(Boolean)
    .join('\n');
  const raw = normalizeNums(cleaned);

  const blocks = parseMultilineBlocks(raw, regions);
  if (blocks && blocks.length > 0) {
    const passengers = blocks
      .filter(b => b.name || b.phone)
      .map(b => ({ name: b.name, phone: b.phone, region: b.region, notes: b.notes || '', originalMessage: raw }));
    const hasPhone = passengers.some(p => p.phone);
    const hasRegion = passengers.some(p => p.region);
    const hasName = passengers.some(p => p.name);
    const conf = (hasPhone ? 40 : 0) + (hasRegion ? 40 : 0) + (hasName ? 20 : 0);
    return { passengers, confidence: conf, needsReview: conf < 80 };
  }

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
    const rawCl = classifyLine(raw, regions);
    passengers.push({ name, phone: phones[0] || '', region, notes: rawCl.inlineNote || '', originalMessage: raw });
  }

  const conf = (phones.length > 0 ? 40 : 0) + (region ? 40 : 0) + (passengers.some(p => p.name) ? 20 : 0);
  return { passengers, confidence: conf, needsReview: conf < 80 };
}