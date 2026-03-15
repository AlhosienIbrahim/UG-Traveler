import { useState } from 'react';
import { uid, today } from '../utils/helpers';

export default function CreateDraftModal({ onSave, onClose }) {
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
        <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 20, color: 'var(--accent)' }}>
          📋 إنشاء مسودة جديدة
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label>اسم المسودة</label>
            <input value={name} onChange={e => setName(e.target.value.slice(0, 30))} autoFocus maxLength={30} />
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
