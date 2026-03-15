import { useState } from 'react';
import { uid } from '../utils/helpers';

export default function PassengerModal({ init, regions, existingPhones, onSave, onClose }) {
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

  const sortedRegions = [...regions].filter(r => r.active).sort((a, b) => a.sortOrder - b.sortOrder);

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
              <input value={f.name} onChange={e => upd('name', e.target.value.slice(0, 60))} placeholder="اسم الراكب" maxLength={60} autoFocus />
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
              {sortedRegions.map(r => (
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
