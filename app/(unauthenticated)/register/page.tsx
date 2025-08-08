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
import { useToast } from "../../providers/ToastProvider";

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const router = useRouter();
  const { notify } = useToast();

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const onBack = (step: number) => {
    if (step > 0) setCurrentStep(step - 1);
    if (step === 0) router.push("/login");
  };

  const handleSubmit = async () => {
    const err = await handleRegisterUser(
      firstName,
      lastName,
      email,
      password,
      bio,
      tags // ✅ use the fresh value directly here
    );

    if (err) {
      notify("We couldn't sign you up 🥲", err);
    } else {
      router.push("/thank-you");
    }
  };

  console.log({ firstName, lastName, email, bio, tags });
  return (
    <div className="relative animate-appearance-in min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-200 via-purple-100 to-white">
      <ParticalBackground />
      <FloatingBackButton onClick={() => onBack(currentStep)} />
      {currentStep === 0 && (
        <NameStep
          firstName={firstName}
          lastName={lastName}
          setFirstName={setFirstName}
          setLastName={setLastName}
          onNext={() => goToStep(1)}
        />
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
