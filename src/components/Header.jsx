import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppData } from '../contexts/AppDataContext';
import { LOGO_SRC } from '../constants';

function MobileDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/',         label: 'المسودات', icon: '📋' },
    { path: '/settings', label: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <div className="dropdown-menu header-nav-mobile">
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
          border: open ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
          borderRadius: 8, padding: 10, cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4, width: 40, height: 40, transition: 'all 0.2s ease',
        }}
      >
        {[
          open ? 'rotate(45deg) translateY(6px)' : 'none',
          null,
          open ? 'rotate(-45deg) translateY(-6px)' : 'none',
        ].map((transform, i) => (
          <span key={i} style={{
            width: 18, height: 2,
            background: open ? 'var(--accent)' : 'var(--text2)',
            borderRadius: 2, transition: 'all 0.2s',
            ...(transform !== null ? { transform } : {}),
            ...(i === 1 ? { opacity: open ? 0 : 1 } : {}),
          }} />
        ))}
      </button>
      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-content">
            {menuItems.map(item => (
              <button
                key={item.path}
                className={`dropdown-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setOpen(false); }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { drafts } = useAppData();

  const isDraftPage = location.pathname.startsWith('/draft/');
  const isHomePage  = location.pathname === '/';

  const draftId = isDraftPage ? location.pathname.split('/draft/')[1] : null;
  const currentDraft = draftId && drafts ? drafts.find(d => d.id === draftId) : null;

  const navItems = [
    { path: '/',         label: '📋 المسودات' },
    { path: '/settings', label: '⚙️ الإعدادات' },
  ];

  return (
    <header style={{
      background: 'linear-gradient(180deg, #1a2332 0%, #0f1419 100%)',
      borderBottom: '1px solid var(--border)',
      padding: '0 12px',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 10, flexWrap: 'wrap' }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
          borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', flexShrink: 0,
        }}>
          <img src={LOGO_SRC} alt="GU Travel" style={{ height: 36, width: 'auto', objectFit: 'contain', borderRadius: 6 }} />
          <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>GU Travel</span>
            <span style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>نظام إدارة الرحلات</span>
          </div>
        </div>

        {/* Back button */}
        {!isHomePage && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/')}
            style={{ gap: 4, color: 'var(--text3)', flexShrink: 0, borderRadius: 8, padding: '5px 10px', border: '1px solid var(--border)' }}
          >← رجوع</button>
        )}

        {/* Breadcrumb */}
        <div className="flex-center" style={{ flex: 1, minWidth: 0, gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          {currentDraft && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              padding: '4px 10px', border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text4)', fontSize: 12 }}>›</span>
              <span className="text-ellipsis" style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700 }}>{currentDraft.name}</span>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <nav className="header-nav" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {navItems.map(n => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              style={{
                fontFamily: "'Cairo', sans-serif", cursor: 'pointer',
                border: location.pathname === n.path ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)',
                borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'all .2s ease', whiteSpace: 'nowrap',
                background: location.pathname === n.path ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                color: location.pathname === n.path ? '#60a5fa' : 'var(--text3)',
              }}
            >{n.label}</button>
          ))}
        </nav>

        <MobileDropdown />
      </div>
    </header>
  );
}
