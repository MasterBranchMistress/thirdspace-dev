"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@heroui/react";
import { ParticalBackground } from "@/components/background-animations/ParticlesBackground";
import Typewriter from "typewriter-effect";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  const [sayGoodbye, setsayGoodbye] = useState(false);
  const router = useRouter();

  return (
    <main className="animate-appearance-in min-h-screen flex flex-col items-center justify-center px-4 text-center relative z-20">
      <ParticalBackground />
      <h1
        className={
          "text-xl z-10 text-concrete font-extrabold animate-pulse tracking-wide"
        }
      >
        Welcome to ThirdSpace 🎉
      </h1>
      <div className="py-4 text-concrete font-extralight z-10 text-sm tracking-wider">
        <Typewriter
          onInit={(typewriter) => {
            typewriter
              .pauseFor(1000)
              .typeString("Your account has been successfully created.")
              .pauseFor(1000)
              .typeString(
                " You can now log in and start connecting with your community. 🤝"
              )
              .pauseFor(1000)
              .callFunction(() => setsayGoodbye(true))
              .start();
          }}
          options={{
            delay: 80,
            cursor: "",
          }}
        />
      </div>
      {sayGoodbye && (
        <Button
          onPress={() => router.replace("/login")}
          className="mt-2 px-6 py-1 text-md bg-transparent text-concrete-bold border-1 border-concrete animate-appearance-in tracking-wide hover:opacity-75"
        >
          Login
        </Button>
      )}
    </main>
  );
}
