import { Spinner } from "@heroui/react";
import Image from "next/image";

export default function LoadingPage() {
  return (
    <div className="flex items-center flex-col justify-center min-h-screen animate-appearance-in">
      <Image
        src="/third-space-logos/thirdspace-logo-3.png"
        alt="thirdpace logo"
        width={300}
        height={300}
        className="animate-fade-in animate-pulse"
        priority
      ></Image>
      <p className="text-white-500 text-sm font-medium mt-2 tracking-wide animate-appearance-in">
        Not work. Not home. Just us.
      </p>
    </div>
  );
}
