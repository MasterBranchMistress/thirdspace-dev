"use client";

import { Form, Input, Button } from "@heroui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Typewriter from "typewriter-effect";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import ThirdSpaceLogo from "../../public/third-space-logos/thirdspace-logo-3.png";
import FloatingForwardButton from "../navigation/floatingForwardButton";
import { useToast } from "@/app/providers/ToastProvider";

interface PasswordStepProps {
  password: string;
  setPassword: (val: string) => void;
  onNext: () => void;
}

export default function PasswordStep({
  password,
  setPassword,
  onNext,
}: PasswordStepProps) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const [showTyping, setShowTyping] = useState(true);
  const skipIntro = () => {
    setShowTyping(false);
    setShowForm(true);
  };
  const { notify } = useToast();

  const validatePasswords = (password: string) => {
    if (!password) {
      notify("No password entered 😵", "Maybe something is missing here.");
      return true;
    }
    if (password !== confirmPassword) {
      notify("Password Mismatch 😔", "Cool password, but these don't match.");
      return true;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col space-y-4 items-center text-center bg-transparent">
        <div className="text-xl font-semibold text-purple-primary min-h-[60px] z-20">
          {!showForm && <FloatingForwardButton skipIntro={skipIntro} />}
          {showTyping && (
            <Typewriter
              onInit={(typewriter) => {
                typewriter
                  .typeString("Your privacy matters.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Connect with others safely and securely.")
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

        {showForm && (
          <>
            <Image
              src={ThirdSpaceLogo}
              height={250}
              width={250}
              alt="thirdspace logo"
              className="animate-slide-up z-20 py-3"
            />
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                const isInvalid = validatePasswords(password);
                if (isInvalid) return;
                onNext();
              }}
              className="w-full max-w-sm space-y-4 animate-fade-in text-center"
            >
              <Input
                name="password"
                placeholder="Enter Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onValueChange={setPassword}
                endContent={
                  <div className="flex items-center justify-end w-full pr-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="flex items-center justify-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-purple-primary" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-purple-primary" />
                      )}
                    </button>
                  </div>
                }
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
                name="confirmPassword"
                placeholder="Confirm Password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="flex items-center justify-center p-1"
                  >
                    {showConfirm ? (
                      <EyeSlashIcon className="h-5 w-5 text-purple-primary" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-purple-primary" />
                    )}
                  </button>
                }
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
                  type="submit"
                  className="w-full sm:w-1/2 bg-transparent text-purple-primary font-bold rounded-md py-2 border-none hover:animate-pulse-slow"
                >
                  So secure 👍
                </Button>

                <Button
                  type="button"
                  onPress={() => router.push("/login")}
                  className="w-full sm:w-1/2 bg-transparent border-none text-pink-primary rounded-md py-2 font-bold hover:animate-pulse-slow"
                >
                  No thanks 🙅‍♀️
                </Button>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
