"use client";

import { Form, Input, Button, Tooltip } from "@heroui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Typewriter from "typewriter-effect";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import ThirdSpaceLogo from "../../public/third-space-logos/thirdspace-logo-3.png";
import FloatingForwardButton from "../navigation/floatingForwardButton";
import {
  getPasswordStrength,
  PasswordStrength,
} from "@/utils/password-strength/passwordStrength";

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
  const [passwordStrength, setpasswordStrength] = useState("Weak");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const [showTyping, setShowTyping] = useState(true);
  const skipIntro = () => {
    setShowTyping(false);
    setShowForm(true);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setpasswordStrength(getPasswordStrength(val));
  };

  const strengthShadow = useMemo(() => {
    const shadows: Record<PasswordStrength, string> = {
      Weak: "text-shadow-lg",
      Okay: "text-warning text-shadow-lg",
      Strong: "text-success text-shadow-lg",
    };

    return shadows[passwordStrength as "Weak" | "Okay" | "Strong"];
  }, [passwordStrength]);

  const getEmoji = () => {
    if (passwordStrength === "Weak") return "🤕";
    if (passwordStrength === "Okay") return "🤏";
    if (passwordStrength === "Strong") return "💪";
  };

  const passwordInvalid =
    passwordStrength === "Weak" ||
    passwordStrength === "Okay" ||
    !password ||
    password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 tracking-wide">
      <div className="w-full max-w-md flex flex-col space-y-6 items-center text-center bg-transparent">
        <div className="text-xl font-semibold text-purple-primary z-20">
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
                onNext();
              }}
              className="w-full max-w-sm space-y-4 animate-appearance-in text-center"
            >
              <Input
                name="password"
                placeholder="Enter Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onValueChange={handlePasswordChange}
                endContent={
                  <div className="flex flex-col">
                    <div className="flex items-center justify-end w-full pr-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="flex items-center justify-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
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
              <div className="flex flex-row items-center justify-center w-full text-center space-x-2">
                <p className="text-sm tracking-tight">Password Strength:</p>
                <p
                  className={`text-sm tracking-wider font-extrabold ${strengthShadow}`}
                >
                  {passwordStrength} <span>{getEmoji()}</span>
                </p>
              </div>

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
                      <Tooltip content="Show Password">
                        <EyeSlashIcon className="h-5 w-5 text-purple-primary" />
                      </Tooltip>
                    ) : (
                      <Tooltip content="Hide Password">
                        <EyeIcon className="h-5 w-5 text-purple-primary" />
                      </Tooltip>
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
                  isDisabled={passwordInvalid}
                  type="submit"
                  className="w-full sm:w-1/2 bg-transparent text-purple-primary font-bold rounded-md py-2 border-none hover:animate-pulse"
                >
                  So secure 👍
                </Button>

                <Button
                  type="button"
                  onPress={() => router.push("/login")}
                  className="w-full sm:w-1/2 bg-transparent border-none text-pink-primary rounded-md py-2 font-bold hover:animate-pulse"
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
