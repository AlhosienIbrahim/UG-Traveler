import { useState, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';

function fmtPhone(phone, formatPhone) {
  if (!phone) return '';
  if (formatPhone === 'intl')
    return phone.replace(/^0(\d{2})(\d{4})(\d{4})$/, '+20 $1 $2 $3');
  return phone;
}

function buildExportText(groups, regionStatus, options) {
  const lines = [];
  const { onlyArrived, includePhone, formatPhone, includeStats, namePhoneLayout } = options;

  groups.forEach(g => {
    const regionName = g.region ? g.region.name : 'مناطق أخرى';
    const passengers = onlyArrived
      ? g.passengers.filter(p => p.status !== 'absent')
      : g.passengers;
    if (passengers.length === 0) return;

    lines.push(`${regionName} ✅️ [${passengers.length}]`);

    passengers.forEach(p => {
      const ph = includePhone ? fmtPhone(p.phone, formatPhone) : '';
      if (namePhoneLayout === 'inline') {
        if (p.name && ph) lines.push(`${p.name} | ${ph}`);
        else if (p.name) lines.push(p.name);
        else if (ph) lines.push(ph);
      } else {
        if (p.name) lines.push(p.name);
        if (ph) lines.push(ph);
      }
    });

    if (includeStats) {
      const arrived = passengers.filter(p => p.status === 'arrived').length;
      const absent = passengers.filter(p => p.status === 'absent').length;
      if (arrived || absent) lines.push(`  ✅ ${arrived}  ❌ ${absent}`);
    }

    lines.push('');
  });

  return lines.join('\n').trim();
}

export default function ExportModal({ groups, regionStatus, onClose }) {
  const toast = useToast();
  const [opts, setOpts] = useState({
    onlyArrived: false,
    includePhone: true,
    formatPhone: 'local',
    namePhoneLayout: 'inline',
    includeStats: false,
  });
  const [copied, setCopied] = useState(false);

  const upd = (k, v) => setOpts(o => ({ ...o, [k]: v }));
  const text = useMemo(() => buildExportText(groups, regionStatus, opts), [groups, regionStatus, opts]);
  const totalPassengers = groups.reduce((s, g) => s + g.passengers.length, 0);

  const handleCopy = () => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    };
    navigator.clipboard?.writeText(text).catch(fallback) ?? fallback();
    setCopied(true);
    toast('تم نسخ الرسالة ✔', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal anim" style={{ maxWidth: 580 }}>
        <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4, color: 'var(--accent)' }}>
          📋 تصدير كرسالة واتساب
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
          {totalPassengers} راكب — {text.split('\n').length} سطر
        </div>

        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'var(--card2)', borderRadius: 10, padding: 12, border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, marginBottom: 10 }}>⚙️ خيارات التصدير</div>
            <div style={{ display: 'grid', gap: 8 }}>

              {[
                { key: 'onlyArrived', label: 'استثناء الغائبين فقط' },
                { key: 'includePhone', label: 'تضمين أرقام الهاتف' },
              ].map(opt => (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                  <input type="checkbox" checked={opts[opt.key]} onChange={e => upd(opt.key, e.target.checked)} style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                  <span>{opt.label}</span>
                </label>
              ))}

              {opts.includePhone && (
                <div style={{ paddingRight: 26, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>صيغة الرقم:</span>
                  {[
                    { val: 'local', label: 'محلي  01XXXXXXXXX' },
                    { val: 'intl', label: 'دولي  +20 1X XXXX XXXX' },
                  ].map(opt => (
                    <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: opts.formatPhone === opt.val ? 'var(--accent)' : 'var(--text2)', margin: 0, fontFamily: 'monospace' }}>
                      <input type="radio" name="fmt" value={opt.val} checked={opts.formatPhone === opt.val} onChange={() => upd('formatPhone', opt.val)} style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>شكل عرض الراكب:</span>
                {[
                  { val: 'inline', label: 'في سطر واحد  اسم | رقم' },
                  { val: 'stacked', label: 'كل معلومة في سطر' },
                ].map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: opts.namePhoneLayout === opt.val ? 'var(--accent)' : 'var(--text2)', margin: 0 }}>
                    <input type="radio" name="layout" value={opt.val} checked={opts.namePhoneLayout === opt.val} onChange={() => upd('namePhoneLayout', opt.val)} style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                    {opt.label}
                  </label>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                <input type="checkbox" checked={opts.includeStats} onChange={e => upd('includeStats', e.target.checked)} style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <span>إضافة إحصائيات الحضور/الغياب لكل منطقة</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 8 }}>👁️ معاينة الرسالة</div>
            <pre style={{
              fontFamily: "'Cairo', sans-serif", fontSize: 12, color: 'var(--text2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'rtl', textAlign: 'right',
              maxHeight: 280, overflowY: 'auto', lineHeight: 1.8, margin: 0,
            }}>{text || 'لا يوجد ركاب للتصدير'}</pre>
          </div>
        </div>

        <div className="flex gap8">
          <button
            className={`btn btn-lg ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={handleCopy}
            disabled={!text}
            style={{ flex: 1 }}
          >
            {copied ? '✅ تم النسخ!' : '📋 نسخ الرسالة'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
