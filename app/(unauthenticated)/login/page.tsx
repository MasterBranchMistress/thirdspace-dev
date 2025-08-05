"use client";

import { Form, Input, Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Image } from "@heroui/react";

import { useToast } from "@/app/providers/ToastProvider";
import { signIn } from "next-auth/react";
import LoadingSpinner from "@/components/spinner/spinner";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { getVideoSrcForTimeOfDay } from "@/utils/get-time-of-day/route";

export default function LoginPage() {
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    setVideoSrc(getVideoSrcForTimeOfDay());
  }, []);
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { notify } = useToast();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const fallbackStyle = "bg-gradient-to-br from-purple-primary to-pink-primary";
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      notify("Login Failed 😭", "Invalid email or password.");
      setLoading(false);
      return;
    } else {
      router.push("/dashboard");
      setLoading(false);
    }
  };

  const emailIsValid =
    email.endsWith("@gmail.com") ||
    email.endsWith("@icloud.com") ||
    email.endsWith("@yahoo.com");

  return (
    <main
      className={`relative z-10 min-h-screen flex items-center justify-center px-4 animate-fade-in ${
        videoError ? fallbackStyle : ""
      }`}
    >
      {/* 🎥 Background video */}
      {!videoError && videoSrc && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
          onError={() => setVideoError(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      <div className="fixed top-0 left-0 w-full h-full bg-black/30 z-0" />
      {/* 🔒 Login Form */}
      <div className="w-full max-w-md space-y-3 z-10 flex flex-col items-center">
        <div className="relative mt-8">
          <Image
            src="/third-space-logos/thirdspace-logo-3.png"
            alt="Thirdspace Logo"
            className="h-40 w-auto object-contain"
          />
        </div>
        <Form onSubmit={handleSubmit} className="space-y-6">
          <Input
            name="email"
            placeholder="Email"
            type="email"
            onValueChange={setEmail}
            classNames={{
              inputWrapper:
                "bg-white/10 border border-white/20 backdrop-blur-md",
              input: "text-white placeholder-white",
            }}
          />
          <Input
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="Password"
            value={password}
            onValueChange={setPassword}
            endContent={
              <button
                type="button"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                className="focus:outline-none"
              >
                {isPasswordVisible ? (
                  <EyeSlashIcon className="text-white w-5 h-5" />
                ) : (
                  <EyeIcon className="text-white w-5 h-5" />
                )}
              </button>
            }
            classNames={{
              inputWrapper:
                "bg-white/10 border border-white/20 backdrop-blur-md",
              input: "text-white placeholder-white",
            }}
          />
          <div className="w-full text-right">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-xs text-white hover:cursor-pointer hover:text-indigo underline transition duration-200"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            spinner={<LoadingSpinner />}
            className="w-full flex items-center justify-center gap-2 bg-purple-primary bg-transparent text-concrete border-2 border-concrete font-bold hover:backdrop-blur-md hover:cursor-pointer"
            isDisabled={!password || !email || !emailIsValid}
          >
            {!loading && "Login"}
          </Button>

          <div className="flex flex-row w-full justify-center items-center gap-6 mt-2">
            <Image
              src="/third-space-logos/icons8-google-64.png"
              alt="Google"
              width={32}
              height={32}
            />

            <Image
              src="/third-space-logos/icons8-facebook-64.png"
              alt="Facebook"
              width={32}
              height={32}
            />

            <Image
              src="/third-space-logos/icons8-twitch-50.png"
              alt="Twitch"
              width={32}
              height={32}
            />

            <Image
              src="/third-space-logos/icons8-discord-50.png"
              alt="Discord"
              width={32}
              height={32}
            />
          </div>
          <button
            type="button"
            className="w-full bg-none text-white underline text-sm hover:text-indigo cursor-pointer"
            onClick={() => router.push("/register")}
          >
            New here? Create an account
          </button>
        </Form>
      </div>
    </main>
  );
}
