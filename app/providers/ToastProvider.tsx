"use client";

import * as Toast from "@radix-ui/react-toast";
import { createContext, useContext, useState } from "react";
import { useSession } from "next-auth/react";

type ToastContextType = {
  notify: (title: string, description: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastDesc, setToastDesc] = useState("");
  const { data: session, status } = useSession();

  const notify = (title: string, description: string) => {
    setToastTitle(title);
    setToastDesc(description);
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      <Toast.Provider swipeDirection="right">
        {children}
        <Toast.Root
          open={open}
          onOpenChange={setOpen}
          className={`
    shadow-lg 
    text-sm           
    px-4 py-2 rounded-lg
    data-[state=open]:animate-appearance-in
    data-[state=closed]:animate-appearance-out
    text-center
    ${status === "authenticated" ? "text-concrete bg-primary" : "text-white bg-white/20 backdrop-blur-md border-none border-white/25"}
  `}
        >
          <div className="flex items-center">
            <div className="flex-1 text-center">
              <Toast.Title className="font-light">{toastTitle}</Toast.Title>
              <Toast.Description>{toastDesc}</Toast.Description>
            </div>
            <Toast.Close
              className="ml-2 inline-flex items-center px-2 py-1 text-xs text-white font-light"
              aria-label="Close"
            >
              ✕
            </Toast.Close>
          </div>
        </Toast.Root>

        <Toast.Viewport className="fixed bottom-50 left-1/2 translate-x-[-50%] z-50 w-[90vw] max-w-auto outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
