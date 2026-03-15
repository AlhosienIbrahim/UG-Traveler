export default function StatsBar({ passengers }) {
  const total = passengers.length;
  const arrived = passengers.filter(p => p.status === 'arrived').length;
  const absent = passengers.filter(p => p.status === 'absent').length;
  const pending = passengers.filter(p => p.status === 'pending').length;
  const pct = total ? Math.round(arrived / total * 100) : 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'الإجمالي', val: total,   color: 'var(--blue)',   bg: 'rgba(96,165,250,.08)',  icon: '👥' },
          { label: 'حضر',      val: arrived, color: 'var(--green)',  bg: 'rgba(16,185,129,.08)',  icon: '✅' },
          { label: 'غائب',     val: absent,  color: 'var(--red)',    bg: 'rgba(239,68,68,.08)',   icon: '❌' },
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
