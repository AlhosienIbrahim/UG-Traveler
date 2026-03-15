import { useState, useEffect, useRef, useCallback } from 'react';
import { uid, today } from '../utils/helpers';
import { DEFAULT_REGIONS } from '../constants';
import { useAppData } from '../contexts/AppDataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function SettingsPage() {
  const { regions, setRegions, drafts, importDrafts } = useAppData();
  const toast   = useToast();
  const confirm = useConfirm();

  const [list, setList] = useState([...regions].sort((a, b) => a.sortOrder - b.sortOrder));
  const [newName, setNewName] = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [editingRegionId, setEditingRegionId] = useState(null);
  const [editingRegionName, setEditingRegionName] = useState('');

  useEffect(() => { setList([...regions].sort((a, b) => a.sortOrder - b.sortOrder)); }, [regions]);

  const persist = (updated) => { setList(updated); setRegions(updated); };

  const startRegionEdit = (e, r) => { e.stopPropagation(); setEditingRegionId(r.id); setEditingRegionName(r.name); };
  const saveRegionEdit  = (r) => {
    if (editingRegionName.trim() && editingRegionName.trim() !== r.name) {
      persist(list.map(x => x.id === r.id ? { ...x, name: editingRegionName.trim() } : x));
      toast('تم تعديل اسم المنطقة', 'success');
    }
    setEditingRegionId(null);
  };

  const toggle = (id) => persist(list.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const del    = async (id) => {
    if (await confirm('حذف هذه المنطقة نهائياً؟')) { persist(list.filter(r => r.id !== id)); toast('تم حذف المنطقة', 'success'); }
  };
  const addNew = () => {
    if (!newName.trim()) return;
    const max = Math.max(...list.map(r => r.sortOrder), 0);
    persist([...list, { id: uid(), name: newName.trim(), sortOrder: max + 1, active: true }]);
    setNewName(''); toast('تم إضافة المنطقة', 'success');
  };

  /* ── Mouse Drag ── */
  const onDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver  = (e) => e.preventDefault();
  const onDrop      = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const arr = [...list]; const [item] = arr.splice(dragIdx, 1); arr.splice(i, 0, item);
    const reordered = arr.map((r, idx) => ({ ...r, sortOrder: idx + 1 }));
    setList(reordered); setRegions(reordered); setDragIdx(null);
  };
  const onDragEnd = () => setDragIdx(null);

  /* ── Touch Drag ── */
  const touchDragIdx = useRef(null); const touchClone = useRef(null);
  const touchListRef = useRef(null); const touchStartEl = useRef(null);
  const touchMoved = useRef(false);  const touchStartY = useRef(0);
  const touchCloneX = useRef(0);     const DRAG_THRESHOLD = 8;

  const onTouchStart = (e, i) => {
    touchDragIdx.current = i; touchMoved.current = false;
    touchStartEl.current = e.currentTarget.closest('[data-drag-idx]');
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e, i) => {
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    if (!touchMoved.current && deltaY < DRAG_THRESHOLD) return;

    if (!touchMoved.current) {
      touchMoved.current = true; setDragIdx(touchDragIdx.current); e.preventDefault();
      const el = touchStartEl.current;
      if (el) {
        const rect = el.getBoundingClientRect(); touchCloneX.current = rect.left;
        const clone = el.cloneNode(true);
        clone.style.cssText = `position:fixed;z-index:9999;pointer-events:none;width:${rect.width}px;left:${touchCloneX.current}px;top:${rect.top}px;opacity:0.85;background:var(--border);border:1px solid var(--accent);border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.6);transition:none`;
        document.body.appendChild(clone); touchClone.current = clone;
      }
      return;
    }

    e.preventDefault();
    if (touchClone.current) { touchClone.current.style.top = `${touch.clientY - 24}px`; touchClone.current.style.left = `${touchCloneX.current}px`; }

    if (touchClone.current) touchClone.current.style.display = 'none';
    const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (touchClone.current) touchClone.current.style.display = '';
    if (!elBelow) return;
    const row = elBelow.closest('[data-drag-idx]');
    if (!row) return;
    const targetIdx = parseInt(row.dataset.dragIdx, 10);
    if (isNaN(targetIdx) || touchDragIdx.current === targetIdx) return;

    const arr = [...list]; const [item] = arr.splice(touchDragIdx.current, 1); arr.splice(targetIdx, 0, item);
    setList(arr.map((r, idx) => ({ ...r, sortOrder: idx + 1 })));
    touchDragIdx.current = targetIdx; setDragIdx(targetIdx);
  };

  const onTouchEnd = useCallback(() => {
    if (touchClone.current) { touchClone.current.remove(); touchClone.current = null; }
    if (touchMoved.current) setRegions(list);
    touchDragIdx.current = null; touchMoved.current = false; setDragIdx(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  const resetRegions = async () => {
    if (!await confirm('هل تريد إعادة ضبط المناطق للقائمة الافتراضية؟\nسيتم حذف أي مناطق أضفتها يدوياً.')) return;
    persist(DEFAULT_REGIONS); toast('تم إعادة ضبط المناطق للقائمة الافتراضية ✔', 'success');
  };

  const exportAll = () => {
    const data = { regions: list, drafts: drafts || [], exportedAt: new Date().toISOString() };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `bus-backup-${today()}.json`; a.click();
    toast('تم تصدير البيانات', 'success');
  };

  const importAll = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.regions) setRegions(data.regions);
        if (data.drafts)  importDrafts(data.drafts);
        toast('تم الاستيراد — أعد تحميل الصفحة لرؤية التغييرات الكاملة', 'info');
      } catch { toast('خطأ في ملف الاستيراد', 'error'); }
    };
    reader.readAsText(f); e.target.value = '';
  };

  const activeCount = list.filter(r => r.active).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">⚙️ الإعدادات</h1>
        <p className="section-sub">إدارة المناطق وإعدادات النظام</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-center" style={{ marginBottom: 14, gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)' }}>🗺️ المناطق الرئيسية</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{activeCount} نشطة / {list.length} إجمالي</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={resetRegions} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,.3)', flexShrink: 0 }}>🔄 إعادة الضبط</button>
        </div>

        <div className="flex gap8" style={{ marginBottom: 14 }}>
          <input value={newName} onChange={e => setNewName(e.target.value.slice(0, 60))} placeholder="اسم منطقة جديدة..." onKeyDown={e => e.key === 'Enter' && addNew()} maxLength={60} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={addNew} disabled={!newName.trim()}>+ إضافة</button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text4)', padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, marginBottom: 12 }}>
          💡 اسحب وأفلت ⠿ لإعادة ترتيب المناطق — التغييرات تنعكس فوراً على جميع المسودات
        </div>

        <div ref={touchListRef} style={{ maxHeight: 420, overflowY: 'auto' }}>
          {list.map((r, i) => (
            <div key={r.id} data-drag-idx={i}
              onDragOver={onDragOver} onDrop={e => onDrop(e, i)} onDragEnd={onDragEnd}
              onContextMenu={e => e.preventDefault()}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 4, background: dragIdx === i ? 'var(--border)' : 'var(--card2)', border: `1px solid ${dragIdx === i ? 'var(--accent)' : 'var(--border2)'}`, opacity: r.active ? 1 : .5, transition: 'all .15s', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
            >
              <span className="dh" draggable onDragStart={e => onDragStart(e, i)}
                onTouchStart={e => onTouchStart(e, i)} onTouchMove={e => onTouchMove(e, i)} onTouchEnd={onTouchEnd}
                onContextMenu={e => e.preventDefault()}
                style={{ touchAction: 'none', cursor: 'grab', padding: '4px 8px', fontSize: 20 }}>⠿</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{r.sortOrder}</span>

              {editingRegionId === r.id ? (
                <input value={editingRegionName} onChange={e => setEditingRegionName(e.target.value.slice(0, 60))}
                  onBlur={() => saveRegionEdit(r)} onKeyDown={e => { if (e.key === 'Enter') saveRegionEdit(r); if (e.key === 'Escape') setEditingRegionId(null); }}
                  onClick={e => e.stopPropagation()} autoFocus maxLength={60}
                  style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, padding: '3px 8px' }} />
              ) : (
                <span className="text-ellipsis" title={r.name} onClick={e => startRegionEdit(e, r)} style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, cursor: 'text' }}>{r.name}</span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <label className="flex-center gap6" style={{ cursor: 'pointer', fontSize: 11, color: r.active ? 'var(--green)' : 'var(--red)', margin: 0, flexShrink: 0 }}>
                  <input type="checkbox" checked={r.active} onChange={() => toggle(r.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                  {r.active ? 'نشط' : 'معطل'}
                </label>
                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red-dim)', flexShrink: 0 }} onClick={() => del(r.id)} title="حذف المنطقة">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent)', marginBottom: 14 }}>💾 النسخ الاحتياطي</div>
        <div className="flex gap10" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-secondary" onClick={exportAll}>📤 تصدير البيانات</button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📥 استيراد البيانات
            <input type="file" accept=".json" onChange={importAll} style={{ display: 'none' }} />
          </label>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>يتم تصدير جميع المسودات والمناطق كملف JSON — يمكن استيراده على أي جهاز</p>
      </div>

      <div className="card" style={{ marginTop: 16, borderColor: 'rgba(96,165,250,.2)', background: 'rgba(96,165,250,.04)' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--blue)', marginBottom: 10 }}>📖 أمثلة على الرسائل المدعومة</div>
        {[
          '"انا احمد من النمسا ورقمي 01012345678"',
          '"محمد علي الترعة 01099999999"',
          '"انا محمود ومعايا صاحبي كريم هنركب من قصر الشوق 01111111111"',
        ].map((ex, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '6px 10px', background: 'var(--surface)', borderRadius: 6, marginBottom: 6, direction: 'rtl' }}>{ex}</div>
        ))}
      </div>
    </div>
  );
}
