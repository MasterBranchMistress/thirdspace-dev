import { CostSplitMode } from "@/lib/models/Event";
import {
  dropDownStyle,
  inputStyling,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import {
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
  Slider,
  Input,
} from "@heroui/react";
import Lottie from "lottie-react";
import { useState } from "react";
import astro from "@/public/lottie/astro.json";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

type BudgetInputProps = {
  initialValue?: number;
  initialSplitMode?: CostSplitMode;
  onChange: (val: number) => void;
  onSplitChange?: (mode: CostSplitMode) => void;
};

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
      {/* example split mode control */}
      <label className="text-sm font-light text-concrete">
        Estimated Total Budget
      </label>
      <Dropdown classNames={dropDownStyle}>
        <DropdownTrigger>
          <Button
            variant="ghost"
            color="secondary"
            className="justify-between border-none"
            endContent={<ChevronLeftIcon width={20} />}
          >
            {costSplit === "free" && "Free"}
            {costSplit === "host_covers" && "Host Covers Cost"}
            {costSplit === "split_evenly" && "Cost Split Evenly"}
          </Button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Cost split mode"
          selectionMode="single"
          selectedKeys={new Set([costSplit])}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as CostSplitMode;

            setCostSplit(value);
            onSplitChange?.(value); // notify parent immediately
          }}
        >
          <DropdownItem key="free">Free</DropdownItem>
          <DropdownItem key="host_covers">Host Covers Cost</DropdownItem>
          <DropdownItem key="split_evenly">Cost Split Evenly</DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {costSplit !== "free" && costSplit !== "host_covers" && (
        <>
          {/* Slider */}
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

          {/* Number input */}
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
