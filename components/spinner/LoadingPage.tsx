import Image from "next/image";

export default function LoadingPage() {
  return (
    <div className="flex items-center flex-col justify-center h-screen z-100 bg-concrete animate-appearance-in">
      <Image
        src="/third-space-logos/thirdspace-logo-4.png"
        alt="thirdpace logo"
        width={300}
        height={300}
        className="animate-fade-in animate-pulse"
        priority
      ></Image>
      <p className="text-primary text-sm text-right font-extralight tracking-tight mt-2 animate-appearance-in">
        Not work. Not home. Just us.
      </p>
    </div>
  );
}
