import { createContext, useContext, useState, useCallback } from 'react';
import { uid } from '../utils/helpers';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type = 'info') => {
    const id = uid();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{icons[t.type] || 'ℹ️'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
