"use client";

import { Form, Input, Button } from "@heroui/react";
import { useState } from "react";
import { useToast } from "@/app/providers/ToastProvider";
import { useRouter } from "next/navigation";
import Typewriter from "typewriter-effect";
import Image from "next/image";
import ThirdSpaceLogo from "../../public/third-space-logos/thirdspace-logo-3.png";
import FloatingForwardButton from "../navigation/floatingForwardButton";

interface NameStepProps {
  firstName: string;
  lastName: string;
  setFirstName: (val: string) => void;
  setLastName: (val: string) => void;
  onNext: () => void;
}

export default function NameStep({
  firstName,
  lastName,
  setFirstName,
  setLastName,
  onNext,
}: NameStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const router = useRouter();

  <NameStep
    firstName={firstName}
    lastName={lastName}
    setFirstName={setFirstName}
    setLastName={setLastName}
    onNext={() => console.log("next!")}
  />;

  const skipIntro = () => {
    setShowTyping(false);
    setShowForm(true);
  };

  const isFormValid =
    (firstName?.length ?? 0) > 3 && (lastName?.length ?? 0) > 3;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 tracking-wide">
      <div className="w-full max-w-md flex flex-col space-y-6 items-center text-center bg-transparent">
        <div className="text-xl sm:text-xl font-semibold text-white z-20">
          {!showForm && <FloatingForwardButton skipIntro={skipIntro} />}

          {showTyping && (
            <Typewriter
              onInit={(typewriter) => {
                typewriter
                  .typeString("Welcome to ThirdSpace.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Not work.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Not home.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Just real plans with real people.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Ready to find your space?")
                  .pauseFor(2000)
                  .deleteAll(50)
                  .callFunction(() => {
                    setShowForm(true);
                  })
                  .start();
              }}
              options={{
                delay: 65,
                cursor: "",
              }}
            />
          )}
        </div>
        {showForm && (
          <>
            <Image
              onClick={() => router.push("/login")}
              src={ThirdSpaceLogo}
              height={250}
              width={250}
              alt="thirdspace logo"
              className="animate-appearance-in z-20 py-3 hover:cursor-pointer"
            />
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                if (isFormValid) onNext();
              }}
              className="w-full max-w-sm space-y-4 animate-appearance-in text-center"
            >
              <Input
                name="firstName"
                placeholder="First name"
                value={firstName}
                onValueChange={setFirstName}
                classNames={{
                  inputWrapper:
                    "bg-transparent hover:bg-transparent focus:bg-transparent border-b-2 border-white focus-within:border-white ring-0 shadow-none transition duration-300 rounded-none",
                  input: "text-white placeholder-white focus:outline-none",
                }}
                style={{
                  WebkitTextFillColor: "white",
                  boxShadow: "0 0 0px 1000px transparent inset",
                }}
              />
              <Input
                name="lastName"
                placeholder="Last name"
                value={lastName}
                onValueChange={setLastName}
                classNames={{
                  inputWrapper:
                    "bg-transparent hover:bg-transparent focus:bg-transparent border-b-2 border-white focus-within:border-white ring-0 shadow-none transition duration-300 rounded-none",
                  input: "text-white placeholder-white focus:outline-none",
                }}
                style={{
                  WebkitTextFillColor: "white",
                  boxShadow: "0 0 0px 1000px transparent inset",
                }}
              />
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button
                  isDisabled={!isFormValid}
                  type="submit"
                  className="w-full bg-transparent text-purple-primary font-bold rounded-md py-2 border-none transition-all duration-300 hover:animate-pulse"
                >
                  Let’s Go 🙌
                </Button>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
