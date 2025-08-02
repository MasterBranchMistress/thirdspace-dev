"use client";

import { useEffect, useState } from "react";
import { Form, Button, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import Typewriter from "typewriter-effect";
import FloatingForwardButton from "../navigation/floatingForwardButton";
import Image from "next/image";
import ThirdSpaceLogo from "../../public/third-space-logos/thirdspace-logo-3.png";
import { useToast } from "@/app/providers/ToastProvider";
import { Checkbox } from "@heroui/react";

interface BioStepProps {
  bio: string;
  setBio: (val: string) => void;
  onBack: () => void;
  handleSubmit: () => void;
}

export default function BioStep({ bio, setBio, handleSubmit }: BioStepProps) {
  //TODO: GET MESSAGES FROM BACKEND ON SUBMIT!!!!

  const [showForm, setShowForm] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const [agreed, setAgreed] = useState(false);

  const skipIntro = () => {
    setShowTyping(false);
    setShowForm(true);
  };
  const router = useRouter();

  const bioInvalid = !bio || bio.length < 50;

  const handleTanC = () => {
    setAgreed((prev) => !prev); // this guarantees proper toggling
  };

  useEffect(() => {
    //trigger analytics, show a toast, or conditionally unlock stuff here
  }, [agreed]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl flex flex-col space-y-4 items-center text-center bg-transparent">
        <div className="text-xl font-semibold text-purple-primary min-h-[60px] z-20">
          {!showForm && <FloatingForwardButton skipIntro={skipIntro} />}
          {showTyping && (
            <Typewriter
              onInit={(typewriter) => {
                typewriter
                  .typeString("Be natural.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Be yourself.")
                  .pauseFor(1000)
                  .deleteAll(50)
                  .typeString("Stay connected 💜✨")
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
                handleSubmit();
              }}
              className="w-full max-w-sm space-y-4 animate-fade-in text-center"
            >
              <Textarea
                name="bio"
                placeholder="What's your story?"
                value={bio}
                onValueChange={setBio}
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
              <div className="flex flex-row space-x-2 align-middle justify-center">
                <Checkbox
                  onChange={handleTanC}
                  isSelected={agreed}
                  radius="md"
                  className="bg-transparent text-white"
                ></Checkbox>

                <span className="text-white text-sm z-20">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-indigo-300"
                  >
                    terms and conditions
                  </a>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row w-full">
                <Button
                  isDisabled={bioInvalid || !agreed}
                  type="submit"
                  className="w-full sm:w-1/2 bg-transparent text-purple-primary font-bold rounded-md py-2 border-none transition-all duration-300 hover:animate-pulse"
                >
                  Connect me 👉
                </Button>

                <Button
                  type="button"
                  onPress={() => router.push("/login")}
                  className="w-full sm:w-1/2 bg-transparent border-none text-pink-primary rounded-md py-2 font-bold hover:animate-pulse-slow"
                >
                  It&apos;s a secret 🤐
                </Button>
              </div>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
