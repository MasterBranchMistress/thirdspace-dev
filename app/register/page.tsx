// components/RegisterForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import NameStep from "@/components/register-forms/name";
import EmailStep from "@/components/register-forms/email";
import BioStep from "@/components/register-forms/bio";
import { useRouter } from "next/navigation";
import { ParticalBackground } from "@/components/background-animations/ParticlesBackground";
import FloatingBackButton from "@/components/navigation/floatingBackButton";
import PasswordStep from "@/components/register-forms/password";
import { handleRegisterUser } from "@/utils/frontend-backend-connection/handleRegisterUser";
import { useToast } from "../providers/ToastProvider";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const router = useRouter();
  const { notify } = useToast();

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };
  useEffect(() => {
    if (showConfetti) {
      const timeout = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [showConfetti]);

  const onBack = (step: number) => {
    if (step > 0) setCurrentStep(step - 1);
    if (step === 0) router.push("/login");
  };

  const handleSubmit = async () => {
    //TODO: verfiy these on the backend
    console.log({ name, email, bio });
    const err = await handleRegisterUser(name, email, password, bio, router);
    if (err) {
      notify("We couldn't sign you up 🥲", err);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="relative animate-fade-in min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-200 via-purple-100 to-white">
      {showConfetti && <Confetti width={width ?? 500} height={height ?? 500} />}

      <ParticalBackground />
      <FloatingBackButton onClick={() => onBack(currentStep)} />
      {currentStep === 0 && (
        <NameStep name={name} setName={setName} onNext={() => goToStep(1)} />
      )}

      {currentStep === 1 && (
        <EmailStep
          email={email}
          setEmail={setEmail}
          onNext={() => goToStep(2)}
          onBack={() => goToStep(0)}
        />
      )}

      {currentStep === 2 && (
        <PasswordStep
          password={password}
          setPassword={setPassword}
          onNext={() => goToStep(3)}
        />
      )}

      {currentStep === 3 && (
        <BioStep
          bio={bio}
          setBio={setBio}
          onBack={() => goToStep(1)}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
