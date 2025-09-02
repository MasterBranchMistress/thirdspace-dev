"use client";

import { Slider, Input } from "@heroui/react";
import Lottie from "lottie-react";
import { useState, useEffect } from "react";
import coin from "@/public/lottie/coin.json";

type BudgetInputProps = {
  initialValue?: number;
  onChange: (val: number) => void;
};

export default function BudgetInput({
  initialValue = 0,
  onChange,
}: BudgetInputProps) {
  const [budget, setBudget] = useState<number>(initialValue);

  // Keep parent in sync
  useEffect(() => {
    onChange(budget);
  }, [budget, onChange]);

  return (
    <div className="flex flex-col gap-2 mt-3 mb-[-3]">
      <label className="text-sm font-light text-concrete">
        Estimated Budget
      </label>

      {/* Slider */}
      <Slider
        aria-label="Estimated Budget"
        value={budget}
        onChange={(val) => setBudget(val as number)}
        step={10}
        size="sm"
        minValue={0}
        maxValue={1000}
        color="secondary"
        renderThumb={(props) => (
          <div
            {...props}
            className="top-[10px] bg-none p-0 shadow-medium rounded-full cursor-grab data-[dragging=true]:cursor-grabbing"
          >
            <Lottie
              animationData={coin}
              style={{
                width: "3rem",
                marginTop: "-2rem",
                marginBottom: "-1rem",
              }}
              className="bg-transparent"
            />
          </div>
        )}
      />

      {/* Numeric input */}
      <Input
        value={budget.toString()}
        onChange={(e) => setBudget(Number(e.target.value) || 0)}
        type="number"
        min={0}
        max={5000}
        variant="underlined"
        label="Amount (USD)"
      />
    </div>
  );
}
