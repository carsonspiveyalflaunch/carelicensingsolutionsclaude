import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const ToastContext = createContext({ show: (msg: string) => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const show = useCallback((msg: string) => {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    showTimerRef.current = window.setTimeout(() => {
      setMessage(msg);
      setVisible(true);
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 4000);
    }, 0);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "#008236",
            color: "#fdc700",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontWeight: "bold",
            fontSize: "16px",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
