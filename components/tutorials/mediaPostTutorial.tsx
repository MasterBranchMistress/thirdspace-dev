"use client";

import {
  ArrowLongDownIcon,
  CursorArrowRaysIcon,
} from "@heroicons/react/24/solid";

export default function MediaPostTutorial() {
  return (
    <>
      <div className="z-200 flex flex-col items-center pointer-events-none p-3">
        <span className="min-w-[5rem] font-semibold text-white bg-primary/400 px-3 py-1.5 animate-post-glow rounded-md backdrop-blur-md text-center">
          <h1 className="mb-[5px]">💡 Quick Tip:</h1>
          <p className="font-light pb-[5px]">
            Tap the media or text in your feed to interact with it.
          </p>
        </span>
      </div>
    </>
  );
}
