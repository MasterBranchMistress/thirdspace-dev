import { CostSplitMode } from "@/lib/models/Event";
import {
  dropDownStyle,
  inputStyling,
  selectStyle,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import { Select, SelectItem, Slider, Input } from "@heroui/react";
import Lottie from "lottie-react";
import { useState } from "react";
import astro from "@/public/lottie/astro.json";

type BudgetInputProps = {
  initialValue?: number;
  initialSplitMode?: CostSplitMode;
  onChange: (val: number) => void;
  onSplitChange?: (mode: CostSplitMode) => void;
};

const splitOptions: { key: CostSplitMode; label: string }[] = [
  { key: "free", label: "Free" },
  { key: "host_covers", label: "Host Covers Cost" },
  { key: "split_evenly", label: "Cost Split Evenly" },
];

export default function BudgetInput({
  initialValue = 0,
  initialSplitMode = "free",
  onChange,
  onSplitChange,
}: BudgetInputProps) {
  const [budget, setBudget] = useState<number>(initialValue);
  const [costSplit, setCostSplit] = useState<CostSplitMode>(initialSplitMode);

  return (
    <div className="flex flex-col gap-2 mt-3 mb-6">
      <label className="text-sm font-light text-concrete">
        Estimated Total Budget
      </label>

      <Select
        aria-label="Cost split mode"
        selectedKeys={[costSplit]}
        onSelectionChange={(keys) => {
          const value = Array.from(keys)[0] as CostSplitMode;
          setCostSplit(value);
          onSplitChange?.(value);
        }}
        classNames={selectStyle}
        placeholder="Select cost split mode"
      >
        {splitOptions.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>

      {costSplit !== "free" && (
        <>
          <Slider
            minValue={0}
            maxValue={500}
            step={10}
            color="primary"
            value={budget}
            onChange={(val) => {
              const num = val as number;
              setBudget(num);
              onChange(num);
            }}
            className="mt-7"
            renderThumb={(props) => (
              <div
                {...props}
                className="bg-none p-0 shadow-none rounded-full cursor-grab data-[dragging=true]:cursor-grabbing"
              >
                <Lottie
                  animationData={astro}
                  style={{
                    width: "6rem",
                    marginRight: "1rem",
                  }}
                  className="bg-transparent"
                />
              </div>
            )}
          />

          <Input
            classNames={inputStyling}
            type="number"
            min={0}
            max={5000}
            value={budget.toString()}
            onChange={(e) => {
              const val = Number(e.target.value) || 0;
              setBudget(val);
              onChange(val);
            }}
            variant="underlined"
            label="Amount (USD)"
          />
        </>
      )}
    </div>
  );
}
