import { useEffect, useRef } from "react";
export default function Modal({ title, onClose, children, wide = false, onKeyDown }) {
  const ref = useRef();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = old;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onKeyDown={onKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close.current();
      }}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button
          autoFocus
          className="icon-button"
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
