// components/comments/CommentInput.tsx
"use client";

import { Input } from "@heroui/react";
import Lottie from "lottie-react";
import send from "@/public/lottie/send.json";
import { useRef, useState } from "react";

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
    <div className="flex items-center gap-2">
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
        color="primary"
        className="flex-1 bg-transparent z-10 text-primary"
        size="sm"
      />
      <div onClick={handleSend} className="cursor-pointer">
        <Lottie
          lottieRef={lottieRef}
          animationData={send}
          onComplete={() => {
            lottieRef.current?.goToAndStop(0, true);
          }}
          loop={false}
          autoplay={false}
          style={{ width: "3rem" }}
        />
      </div>
    </div>
  );
}
