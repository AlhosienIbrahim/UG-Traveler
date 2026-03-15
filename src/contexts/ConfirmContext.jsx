import { createContext, useContext, useState, useCallback } from 'react';
import { useModalBackHandler } from '../utils/backHandler';

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((msg) => {
    return new Promise((resolve) => {
      setState({
        msg,
        onOk: () => { setState(null); resolve(true); },
        onCancel: () => { setState(null); resolve(false); },
      });
    });
  }, []);

  useModalBackHandler(!!state, () => state?.onCancel());

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={state.onCancel}>
          <div className="modal anim" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20, lineHeight: 1.6 }}>
              {state.msg}
            </div>
            <div className="flex gap8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={state.onCancel}>إلغاء</button>
              <button className="btn btn-danger" onClick={state.onOk}>تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);
