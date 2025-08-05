"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@heroui/react";
import { ParticalBackground } from "@/components/background-animations/ParticlesBackground";
import Typewriter from "typewriter-effect";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import animationData from "@/public/lottie/social-media.json";

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
    <>
      <ParticalBackground />
      <main className="animate-appearance-in absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center px-4 text-center z-20">
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ height: "300px", width: "300px", marginBottom: "2rem" }}
        />
        <h1
          className={
            "text-xl z-10 text-concrete font-extrabold animate-pulse tracking-wide"
          }
        >
          Welcome to ThirdSpace 🎉
        </h1>
        <div className="py-4 text-concrete font-extralight z-10 text-sm tracking-tight">
          <Typewriter
            onInit={(typewriter) => {
              typewriter
                .pauseFor(100)
                .typeString(
                  "Your account has been successfully created. You can now log in and start connecting with your community."
                )
                .pauseFor(500)
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
    </>
  );
}
