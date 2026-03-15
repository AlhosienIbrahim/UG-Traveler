import { useState } from 'react';
import { parseMessage } from '../utils/parser';
import { uid } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

const PAGE = 10;

export default function MessageParserPanel({ regions, onAddPassengers }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [editable, setEditable] = useState([]);
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE);

  const handleParse = () => {
    if (!text.trim()) return;
    const r = parseMessage(text.trim(), regions);
    setResult(r);
    setEditable(r.passengers.map(p => ({ ...p, id: uid(), regionId: p.region?.id || '' })));
    setVisibleCount(PAGE);
  };

  const upd = (idx, field, val) =>
    setEditable(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));

  const updRegion = (idx, rId) => {
    const region = regions.find(r => r.id === rId) || null;
    setEditable(prev => prev.map((p, i) => i === idx ? { ...p, region, regionId: rId } : p));
  };

  const handleSave = () => {
    const toAdd = editable.map(p => ({ ...p, status: 'pending' }));
    if (toAdd.length > 0) {
      onAddPassengers(toAdd);
      toast(`تم إضافة ${toAdd.length} راكب`, 'success');
      setText(''); setResult(null); setEditable([]);
    }
  };

  const reset = () => { setText(''); setResult(null); setEditable([]); };

  const sortedRegions = [...regions].filter(r => r.active).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div
        className="flex-center gap10"
        style={{ marginBottom: open || result ? 12 : 0, cursor: 'pointer' }}
        onClick={() => !result && setOpen(o => !o)}
      >
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
                    background: result.confidence >= 80 ? 'var(--green)' : result.confidence >= 50 ? 'var(--accent)' : 'var(--red)',
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

              {editable.length > 10 && (
                <div className="flex gap8" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-success" onClick={handleSave}>💾 حفظ {editable.length} ركاب</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setResult(null); setEditable([]); }}>إلغاء</button>
                </div>
              )}

              {editable.slice(0, visibleCount).map((p, idx) => (
                <div key={p.id} style={{ background: 'var(--card2)', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid var(--border2)' }} className="anim">
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, fontWeight: 700 }}>
                    الراكب {idx + 1} من {editable.length}
                  </div>
                  <div className="grid2" style={{ marginBottom: 8 }}>
                    <div>
                      <label>الاسم</label>
                      <input value={p.name} onChange={e => upd(idx, 'name', e.target.value.slice(0, 60))} placeholder="اسم الراكب" maxLength={60} />
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
                      {sortedRegions.map(r => (
                        <option key={r.id} value={r.id}>{r.sortOrder}. {r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>ملاحظات</label>
                    <input value={p.notes || ''} onChange={e => upd(idx, 'notes', e.target.value)} placeholder="ملاحظات اختيارية" />
                  </div>
                  <div className="flex gap8" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        onAddPassengers([{ ...p, status: 'pending' }]);
                        toast(`تم إضافة ${p.name || 'الراكب'}`, 'success');
                        setEditable(prev => prev.filter((_, i) => i !== idx));
                        if (editable.length === 1) { setResult(null); setText(''); }
                      }}
                    >✔ إضافة هذا الراكب</button>
                    {editable.length > 1 && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setEditable(prev => prev.filter((_, i) => i !== idx))}>
                        🗑️ حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {visibleCount < editable.length && (
                <div style={{ textAlign: 'center', margin: '8px 0' }}>
                  <button className="btn btn-secondary" onClick={() => setVisibleCount(v => v + PAGE)}>
                    ▼ عرض {Math.min(PAGE, editable.length - visibleCount)} أكتر
                    <span style={{ color: 'var(--text4)', fontSize: 11, marginRight: 6 }}>
                      (متبقي {editable.length - visibleCount})
                    </span>
                  </button>
                </div>
              )}

              <div className="flex gap8" style={{ marginTop: 4, flexWrap: 'wrap' }}>
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
