import { useState } from 'react';
import PassengerRow from './PassengerRow';

const PAGE = 10;

export default function RegionGroup({ region, passengers, onStatus, onEdit, onDelete, onComplete, onDeleteRegion, isDone }) {
  const [open, setOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE);

  const arrived = passengers.filter(p => p.status === 'arrived').length;
  const isOther = !region;
  const visiblePassengers = passengers.slice(0, visibleCount);

  return (
    <div className="rg" style={{ borderColor: isDone ? 'rgba(16,185,129,.3)' : 'var(--border)' }}>
      <div className={`rg-head ${isDone ? 'done' : ''}`} onClick={() => setOpen(o => !o)}>
        <div className="flex-center gap10">
          {isDone
            ? <span style={{ fontSize: 16 }}>✅</span>
            : <span style={{ fontSize: 14, color: 'var(--text4)' }}>{open ? '▾' : '▸'}</span>
          }
          <span style={{ fontWeight: 800, fontSize: 14, color: isDone ? 'var(--green)' : isOther ? 'var(--text2)' : 'var(--text)' }}>
            {isOther
              ? '🗂️ مناطق أخرى'
              : <span className="text-ellipsis" style={{ maxWidth: '18ch', display: 'inline-block' }}>{region.sortOrder}. {region.name}</span>
            }
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
          {passengers.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              title="حذف كل ركاب هذه المنطقة"
              style={{ color: 'var(--red-dim)', padding: '4px 8px' }}
              onClick={onDeleteRegion}
            >🗑️</button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text4)' }} onClick={() => setOpen(o => !o)}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {open && visiblePassengers.map(p => (
        <PassengerRow key={p.id} p={p} onStatus={onStatus} onEdit={onEdit} onDelete={onDelete} />
      ))}

      {open && visibleCount < passengers.length && (
        <div style={{ textAlign: 'center', padding: '8px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setVisibleCount(v => v + PAGE)}>
            ▼ عرض {Math.min(PAGE, passengers.length - visibleCount)} أكتر
            <span style={{ color: 'var(--text4)', fontSize: 11, marginRight: 6 }}>
              (متبقي {passengers.length - visibleCount})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
