import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <>
      {open && (
        <div 
          role="presentation" 
          className="fixed inset-0 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onOpenChange?.(false);
            }
          }}
        >
          {children}
        </div>
      )}
    </>
  );
};

const DialogContent = React.forwardRef(({ className = "", children, onClose, ...props }, ref) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/80 animate-in fade-in-0" />
      <div
        ref={ref}
        className={`
          fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg 
          translate-x-[-50%] translate-y-[-50%] gap-4 
          border bg-white p-6 shadow-lg duration-200 
          animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 
          slide-in-from-top-[48%] rounded-lg
          ${className}
        `}
        {...props}
      >
        {children}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white 
            transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 
            focus:ring-slate-950 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className = "", ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);

const DialogFooter = ({ className = "", ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
);

const DialogTitle = ({ className = "", ...props }) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
);

const DialogDescription = ({ className = "", ...props }) => (
  <p
    className={`text-sm text-slate-500 ${className}`}
    {...props}
  />
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};