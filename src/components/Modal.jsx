import React, { useEffect } from 'react';

export default function Modal({
  open, title, message, children,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card shadow-cardMd w-full max-w-sm p-5">
        {title && <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>}
        {message && <p className="text-sm text-slate-600">{message}</p>}
        {children}
        <div className="mt-5 flex justify-end gap-2">
          {onCancel && <button onClick={onCancel} className="btn-ghost">{cancelLabel}</button>}
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
