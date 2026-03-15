import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fmtDate } from '../utils/helpers';
import { useModalBackHandler } from '../utils/backHandler';
import { useAppData } from '../contexts/AppDataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import StatsBar from '../components/StatsBar';
import MessageParserPanel from '../components/MessageParserPanel';
import RegionGroup from '../components/RegionGroup';
import PassengerModal from '../components/PassengerModal';
import ExportModal from '../components/ExportModal';

export default function DraftView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drafts, regions, updateDraft } = useAppData();
  const toast = useToast();
  const confirm = useConfirm();

  const [showModal, setShowModal] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useModalBackHandler(showModal,  () => { setShowModal(false); setEditing(null); });
  useModalBackHandler(showExport, () => setShowExport(false));

  const draft = drafts?.find(d => d.id === id);

  if (!draft) {
    return (
      <div className="empty">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">المسودة غير موجودة</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          ← العودة للقائمة
        </button>
      </div>
    );
  }

  const passengers    = draft.passengers  || [];
  const regionStatus  = draft.regionStatus || {};

  const filteredPassengers = useMemo(() => {
    if (!searchQuery.trim()) return passengers;
    const q = searchQuery.trim().toLowerCase();
    return passengers.filter(p =>
      (p.name  && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  }, [passengers, searchQuery]);

  const existingPhones = useMemo(() => new Set(passengers.map(p => p.phone).filter(Boolean)), [passengers]);

  const setPassengers = (ps) => updateDraft({ ...draft, passengers: ps });

  const groups = useMemo(() => {
    const active    = [...regions].filter(r => r.active).sort((a, b) => a.sortOrder - b.sortOrder);
    const activeIds = new Set(active.map(r => r.id));
    const result    = [];

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

  const handleDelete = async (id) => {
    if (await confirm('حذف هذا الراكب؟')) setPassengers(passengers.filter(p => p.id !== id));
  };

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
    updateDraft({ ...draft, regionStatus: { ...regionStatus, [regionId]: action === 'undo' ? 'pending' : 'completed' } });
    if (action !== 'undo') toast('تم تحديد المنطقة كمنتهية ✔', 'success');
  };

  const handleDeleteRegion = async (regionId, regionName) => {
    const count = passengers.filter(p => (p.region?.id || p.regionId) === regionId).length;
    if (!await confirm(`حذف منطقة "${regionName}" وكل ركابها (${count} راكب)؟`)) return;
    setPassengers(passengers.filter(p => (p.region?.id || p.regionId) !== regionId));
    toast(`تم حذف منطقة "${regionName}" وركابها`, 'success');
  };

  const handleDeleteOthers = async () => {
    const activeIds = new Set(regions.filter(r => r.active).map(r => r.id));
    const count = passengers.filter(p => { const rid = p.region?.id || p.regionId; return !rid || !activeIds.has(rid); }).length;
    if (!await confirm(`حذف "مناطق أخرى" وكل ركابها (${count} راكب)؟`)) return;
    setPassengers(passengers.filter(p => { const rid = p.region?.id || p.regionId; return rid && activeIds.has(rid); }));
    toast('تم حذف ركاب مناطق أخرى', 'success');
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{draft.name}</h1>
        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{fmtDate(draft.date)}</p>
      </div>

      <StatsBar passengers={passengers} />
      <MessageParserPanel regions={regions} onAddPassengers={handleAddParsed} />

      <div className="flex gap8" style={{ marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => { setEditing(null); setShowModal(true); }}>
          ➕ إضافة راكب يدوياً
        </button>
        {passengers.length > 0 && (
          <button className="btn btn-secondary" onClick={() => setShowExport(true)} style={{ borderColor: 'rgba(59,130,246,.35)', color: 'var(--accent)' }}>
            📋 تصدير كرسالة
          </button>
        )}
      </div>

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
              {filteredPassengers.length === 0
                ? <span style={{ color: 'var(--red)' }}>لم يتم العثور على نتائج</span>
                : <span>تم العثور على <strong style={{ color: 'var(--accent)' }}>{filteredPassengers.length}</strong> راكب</span>
              }
              <button className="btn btn-ghost btn-sm" style={{ marginRight: 10 }} onClick={() => setSearchQuery('')}>مسح البحث</button>
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
            onDeleteRegion={g.region ? () => handleDeleteRegion(g.region.id, g.region.name) : handleDeleteOthers}
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
        <ExportModal groups={groups} regionStatus={regionStatus} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
