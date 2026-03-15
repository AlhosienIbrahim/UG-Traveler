export const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const today = () => new Date().toISOString().split('T')[0];

export const fmtDate = d => {
  try {
    return new Date(d).toLocaleDateString('ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return d;
  }
};
