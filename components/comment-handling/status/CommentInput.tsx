// components/comments/CommentInput.tsx
"use client";

import { Input } from "@heroui/react";
import Lottie from "lottie-react";
import send from "@/public/lottie/send.json";
import { useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function CommentInput({
  onSubmit,
  placeholder = "Add a comment...",
}: {
  onSubmit: (text: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const lottieRef = useRef<any>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
    lottieRef.current?.play();
  };

  return (
    <div className="flex items-center gap-2 px-3 shadow-none mt-6">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={placeholder}
        variant="underlined"
        color="secondary"
        className="flex-1 bg-transparent z-10 text-secondary"
        size="sm"
        classNames={{
          input: "text-white placeholder:text-white/80",
          inputWrapper: "bg-transparent",
        }}
      />
      <div onClick={handleSend} className="cursor-pointer">
        <PaperAirplaneIcon className="text-secondary" width={25} />
      </div>
    </div>
  );
}
