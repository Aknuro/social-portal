import React, { useState, useEffect, useCallback } from 'react';

let toastCallback = null;

export const showToast = (message, type = 'info') => {
  if (toastCallback) toastCallback(message, type);
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastCallback = (message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { toastCallback = null; };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
};

export default Toast;
