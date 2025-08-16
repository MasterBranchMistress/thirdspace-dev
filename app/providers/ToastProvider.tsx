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
    bg-white/20           
    backdrop-blur-md      
    border-none border-white/25 
    shadow-lg 
    text-sm           
    px-4 py-2 rounded-lg
    data-[state=open]:animate-appearance-in
    data-[state=closed]:animate-appearance-out
    text-center
    ${status === "authenticated" ? "text-primary" : "text-white"}
  `}
        >
          <Toast.Title className="font-bold">{toastTitle}</Toast.Title>
          <Toast.Description>{toastDesc}</Toast.Description>
        </Toast.Root>

        <Toast.Viewport className="fixed top-4 left-1/2 translate-x-[-50%] z-50 w-[90vw] max-w-sm outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
