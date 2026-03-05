"use client";

import React from "react";

type Props = {
  score: number; // 0–100
};

const resonanceLinesHigh = [
  "Strong signal detected.",
  "Your frequencies overlap.",
  "Some paths cross for a reason.",
];

const resonanceLinesMedium = [
  "There’s a bit of signal here.",
  "Might be an interesting overlap.",
  "Worth a quick orbit.",
];

const resonanceLinesLow = [
  "A faint signal.",
  "Could be something there.",
  "Possibly your kind of human.",
];

export function ResonanceMeter({ score }: Props) {
  // Pick microcopy based on score
  let lines = resonanceLinesLow;
  if (score >= 80) lines = resonanceLinesHigh;
  else if (score >= 50) lines = resonanceLinesMedium;

  const line = lines[Math.floor(Math.random() * lines.length)];

  // Bars config
  const totalBars = 5;
  const filledBars = Math.round((score / 100) * totalBars);

  return (
    <div className="flex flex-col items-center mt-2">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: totalBars }).map((_, i) => (
          <div
            key={i}
            className={`w-2 rounded-full ${
              i < filledBars
                ? "linear-gradient(to top, #ffdd55, #ff7e5f)"
                : "bg-gray-300"
            }`}
            style={{
              height: `${Math.random() * 8 + 8}px`, // random base height
              animation: `pulse 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              background:
                i < filledBars
                  ? "linear-gradient(to top, #ffdd55, #ff7e5f)" // yellow → orange-pink
                  : "#e0e0e0", // gray for empty bars
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-secondary text-center mt-3 animate-fade-in">
        {line}
      </p>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.6);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
