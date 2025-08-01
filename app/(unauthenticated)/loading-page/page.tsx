import Image from "next/image";

export default function LoadingPage() {
  return (
    <div className="flex items-center flex-col justify-center h-screen z-100 animate-appearance-in">
      <Image
        src="/third-space-logos/thirdspace-logo-4.png"
        alt="thirdpace logo"
        width={300}
        height={300}
        className="animate-fade-in animate-pulse z-20"
        priority
      ></Image>
      <p className="text-indigo-500 z-20 text-sm font-medium mt-2 tracking-wide animate-appearance-in">
        Not work. Not home. Just us.
      </p>
    </div>
  );
}
