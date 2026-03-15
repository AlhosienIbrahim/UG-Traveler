import { useState } from 'react';

export default function PassengerRow({ p, onStatus, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const nameColor = p.status === 'arrived' ? 'var(--green)' : p.status === 'absent' ? 'var(--red)' : 'var(--text)';

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    if (!p.phone) return;
    const fallback = (text) => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(p.phone).catch(() => fallback(p.phone));
    } else {
      fallback(p.phone);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`pr ${p.status}`} style={{ gap: 10 }}>
      {/* Status buttons */}
      <div className="flex gap6 shrink0">
        <button
          className="sb" title="حضر"
          style={{ borderColor: 'var(--green)', background: p.status === 'arrived' ? 'rgba(16,185,129,.2)' : 'transparent', color: p.status === 'arrived' ? 'var(--green)' : 'var(--border2)' }}
          onClick={() => onStatus(p.id, p.status === 'arrived' ? 'pending' : 'arrived')}
        >✔</button>
        <button
          className="sb" title="غائب"
          style={{ borderColor: 'var(--red)', background: p.status === 'absent' ? 'rgba(239,68,68,.2)' : 'transparent', color: p.status === 'absent' ? 'var(--red)' : 'var(--border2)' }}
          onClick={() => onStatus(p.id, p.status === 'absent' ? 'pending' : 'absent')}
        >✖</button>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-ellipsis" style={{ fontWeight: 700, fontSize: 14, color: nameColor, maxWidth: '18ch' }}>
          {p.name || <span style={{ color: 'var(--text4)', fontStyle: 'italic' }}>بدون اسم</span>}
        </div>
        {p.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', direction: 'ltr' }}>{p.phone}</span>
            <button
              onClick={handleCopyPhone}
              title={copied ? 'تم النسخ!' : 'انسخ الرقم'}
              style={{
                fontFamily: "'Cairo', sans-serif", flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 6,
                border: copied ? '1px solid rgba(16,185,129,.5)' : '1px solid var(--border2)',
                background: copied ? 'rgba(16,185,129,.15)' : 'var(--card2)',
                cursor: 'pointer', fontSize: 11, transition: 'all .18s',
                color: copied ? 'var(--green)' : 'var(--text3)',
              }}
            >{copied ? '✔' : '⎘'}</button>
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
