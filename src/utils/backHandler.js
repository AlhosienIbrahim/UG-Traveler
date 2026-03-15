import { useEffect, useRef } from 'react';

const _backStack = [];

export function _pushBackHandler(fn) {
  _backStack.push(fn);
  if (window.AndroidBridge) window.AndroidBridge.setCanGoBack(true);
}

export function _popBackHandler() {
  _backStack.pop();
}

export function _fireBackHandler() {
  if (_backStack.length > 0) {
    _backStack[_backStack.length - 1]();
    return true;
  }
  return false;
}

export function useModalBackHandler(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => onCloseRef.current();
    _pushBackHandler(handler);
    return () => _popBackHandler();
  }, [isOpen]);
}
