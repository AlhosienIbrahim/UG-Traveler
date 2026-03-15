import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { today, fmtDate, uid } from '../utils/helpers';
import { useAppData } from '../contexts/AppDataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import CreateDraftModal from '../components/CreateDraftModal';
import { useModalBackHandler } from '../utils/backHandler';

export default function Dashboard() {
  const navigate = useNavigate();
  const { drafts, createDraft, deleteDraft, updateDraft, clearAllDrafts } = useAppData();
  const todayDate = today();
  const confirm = useConfirm();
  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useModalBackHandler(showCreate, () => setShowCreate(false));

  const sorted = [...drafts].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const handleCreate = (data) => {
    const id = createDraft(data);
    setShowCreate(false);
    navigate(`/draft/${id}`);
  };

  const startEdit = (e, d) => {
    e.stopPropagation();
    setEditingId(d.id);
    setEditingName(d.name);
  };

  const saveEdit = (d) => {
    if (editingName.trim()) {
      updateDraft({ ...d, name: editingName.trim() });
      toast('تم تعديل اسم المسودة', 'success');
    }
    setEditingId(null);
  };

  const handleClearAll = async () => {
    if (!await confirm('هل أنت متأكد من حذف جميع المسودات؟\nلا يمكن التراجع عن هذا الإجراء.')) return;
    await clearAllDrafts();
    toast('تم حذف جميع المسودات', 'success');
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '16px' }}>
      <div className="flex-center" style={{ marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <h1 className="section-title">المسودات اليومية</h1>
          <p className="section-sub">إدارة رحلات وركاب كل يوم</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {sorted.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleClearAll} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,.3)' }}>
              🗑️ حذف الكل
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>➕ مسودة جديدة</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">لا توجد مسودات حتى الآن</div>
          <div className="empty-sub" style={{ marginBottom: 20 }}>أنشئ مسودة جديدة لبدء تتبع الركاب</div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>➕ إنشاء أول مسودة</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sorted.map(d => {
            const ps = d.passengers || [];
            const arrived = ps.filter(p => p.status === 'arrived').length;
            const absent  = ps.filter(p => p.status === 'absent').length;
            const isToday = d.date === todayDate;
            const pct     = ps.length ? Math.round(arrived / ps.length * 100) : 0;

            return (
              <div
                key={d.id}
                className="card2"
                style={{ cursor: 'pointer', borderColor: isToday ? 'rgba(245,158,11,.35)' : undefined, transition: 'border-color .2s' }}
                onClick={() => navigate(`/draft/${d.id}`)}
              >
                <div className="flex-center gap12" style={{ flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, minWidth: 0, overflow: 'hidden' }}>
                      {editingId === d.id ? (
                        <input
                          value={editingName}
                          onChange={e => setEditingName(e.target.value.slice(0, 30))}
                          onBlur={() => saveEdit(d)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(d); if (e.key === 'Escape') setEditingId(null); }}
                          onClick={e => e.stopPropagation()}
                          autoFocus maxLength={30}
                          style={{ fontWeight: 900, fontSize: 15, flex: 1, minWidth: 0, padding: '4px 8px' }}
                        />
                      ) : (
                        <>
                          <span className="text-ellipsis" style={{ fontWeight: 900, fontSize: 16, color: isToday ? 'var(--accent)' : 'var(--text)', minWidth: 0, flexShrink: 1 }}>{d.name}</span>
                          {isToday && <span className="badge badge-amber" style={{ flexShrink: 0 }}>اليوم</span>}
                          <button className="btn btn-ghost btn-icon btn-sm" title="تعديل الاسم" onClick={e => startEdit(e, d)} style={{ opacity: 0.6, fontSize: 12, flexShrink: 0 }}>✏️</button>
                        </>
                      )}
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
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/draft/${d.id}`)}>فتح ←</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red-dim)' }}
                      onClick={async () => { if (await confirm('حذف هذه المسودة نهائياً؟')) deleteDraft(d.id); }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateDraftModal onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
