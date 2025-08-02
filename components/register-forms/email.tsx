"use client";
import { useState } from "react";
import { Form, Input, Button } from "@heroui/react";
import Typewriter from "typewriter-effect";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ThirdSpaceLogo from "../../public/third-space-logos/thirdspace-logo-3.png";
import FloatingForwardButton from "../navigation/floatingForwardButton";

interface EmailStepProps {
  email: string;
  setEmail: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function EmailStep({ email, setEmail, onNext }: EmailStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const skipIntro = () => {
    setShowTyping(false);
    setShowForm(true);
  };
  const router = useRouter();
  const allowedDomains = [
    "@gmail.com",
    "@yahoo.com",
    "@outlook.com",
    "@icloud.com",
  ];

  //TODO: setup zod to validate on the backendS
  const isEmailValid =
    email.length > 5 && allowedDomains.some((domain) => email.endsWith(domain));

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md flex flex-col space-y-6 items-center text-center bg-transparent">
          <div className="text-xl sm:text-xl font-semibold text-purple-primary min-h-[60px] z-20 animate-fade-in">
            {!showForm && <FloatingForwardButton skipIntro={skipIntro} />}
            {showTyping && (
              <Typewriter
                onInit={(typewriter) => {
                  typewriter
                    .typeString("No ads. No bots. No spam.")
                    .pauseFor(1000)
                    .deleteAll(50)
                    .typeString("Connect with mutuals.")
                    .pauseFor(1000)
                    .deleteAll(50)
                    .typeString("Find your tribe.")
                    .pauseFor(1000)
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

          {/* Form */}
          {showForm && (
            <>
              <Image
                onClick={() => router.push("/")}
                src={ThirdSpaceLogo}
                height={250}
                width={250}
                alt="thirdspace logo"
                className="animate-slide-up z-20 py-3 hover:cursor-pointer"
              />
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  onNext();
                }}
                className="w-full max-w-sm space-y-4 animate-fade-in"
              >
                <Input
                  name="email"
                  placeholder="What's your email?"
                  value={email}
                  onValueChange={setEmail}
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
                <div className="flex flex-col sm:flex-row w-full">
                  <Button
                    isDisabled={!isEmailValid}
                    type="submit"
                    className="w-full sm:w-1/2 bg-transparent text-purple-primary font-bold rounded-md py-2 border-none transition-all duration-300 hover:animate-pulse"
                  >
                    Sounds Good 👍
                  </Button>

                  <Button
                    type="button"
                    onPress={() => router.push("/login")}
                    className="w-full sm:w-1/2 bg-transparent border-none text-pink-primary rounded-md py-2 font-bold hover:animate-pulse"
                  >
                    Gotta Go 🏃‍♀️
                  </Button>
                </div>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
