import { LOGO_SRC } from '../constants';

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, zIndex: 9999,
    }}>
      <img
        src={LOGO_SRC}
        alt="GU Travel"
        style={{ height: 52, width: 'auto', objectFit: 'contain', animation: 'pulse 1.4s ease-in-out infinite' }}
      />
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border2)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: 'var(--text3)', fontSize: 13, fontWeight: 700 }}>
        جار تحميل البيانات…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
