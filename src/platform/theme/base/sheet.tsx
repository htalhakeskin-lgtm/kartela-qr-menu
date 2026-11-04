"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * Bottom sheet on the native <dialog> (D-09): modal, focus kept inside, Escape and the backdrop
 * close it, the page behind is inert. Rises from the bottom in 220 ms (Sade's signature motion,
 * plan §11.8); still under prefers-reduced-motion.
 */
export function Sheet({
  label,
  closeLabel,
  onClose,
  children,
  footer,
}: {
  label: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // A click on the backdrop lands on the <dialog> itself (Escape is handled by the browser).
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) close.current();
    };
    dialog.addEventListener("click", onBackdrop);
    return () => {
      dialog.removeEventListener("click", onBackdrop);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={ref} aria-label={label} className="kt-sheet" onClose={onClose}>
      <div className="flex max-h-[92dvh] flex-col">
        <div className="relative flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute end-2 top-1 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-6">
          {children}
        </div>
        {footer ? (
          <div className="kt-bottom-bar border-t border-border bg-background px-4 pt-3 pb-3">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
