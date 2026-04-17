import { CostSplitMode } from "@/lib/models/Event";
import {
  inputStyling,
  selectStyle,
} from "@/utils/get-dropdown-style/getDropDownStyle";
import { Select, SelectItem, Slider, Input, Button } from "@heroui/react";
import Lottie from "lottie-react";
import { useState } from "react";
import astro from "@/public/lottie/astro.json";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

type BudgetInputProps = {
  initialValue?: number;
  initialSplitMode?: CostSplitMode;
  initialTicketLinks?: string[];
  onChange: (val: number) => void;
  onSplitChange?: (mode: CostSplitMode) => void;
  onTicketLinkChange?: (val: string[]) => void;
};

const splitOptions: { key: CostSplitMode; label: string }[] = [
  { key: "free", label: "Free" },
  { key: "host_covers", label: "Host Covers Cost" },
  { key: "split_evenly", label: "Cost Split Evenly" },
  { key: "tickets", label: "Average Cost per Ticket" },
];

export default function BudgetInput({
  initialValue = 0,
  initialSplitMode = "",
  initialTicketLinks = [],
  onChange,
  onSplitChange,
  onTicketLinkChange,
}: BudgetInputProps) {
  const [budget, setBudget] = useState<number>(initialValue);
  const [costSplit, setCostSplit] = useState<CostSplitMode>(initialSplitMode);
  const [ticketLinks, setTicketLinks] = useState<string[]>(initialTicketLinks);
  const shouldshowSlider =
    costSplit === "host_covers" ||
    costSplit === "split_evenly" ||
    costSplit === "tickets";

  return (
    <div className="flex flex-col gap-2 mt-3 mb-6">
      <label className="text-sm font-light text-concrete">
        Estimated Total Budget
      </label>

      <Select
        aria-label="Cost split mode"
        selectedKeys={[costSplit ?? ""]}
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
      {costSplit === "tickets" && (
        <div className="mt-2 animate-slide-down">
          <label className="text-sm font-light text-concrete">
            Insert Ticket Links
          </label>

          {ticketLinks.map((link, idx) => (
            <div className="flex flex-row gap-1" key={`${link}-${idx}`}>
              <Input
                isRequired
                key={idx}
                placeholder="https://..."
                classNames={inputStyling}
                type="text"
                value={link}
                onChange={(e) => {
                  const updated = [...ticketLinks];
                  updated[idx] = e.target.value;
                  setTicketLinks(updated);
                  onTicketLinkChange?.(updated);
                }}
                variant="underlined"
              />
              <Button
                isIconOnly
                className="bg-transparent"
                size="sm"
                radius="full"
                onPress={() => {
                  const updated = ticketLinks.filter((_, i) => i !== idx);
                  setTicketLinks(updated);
                }}
                isDisabled={ticketLinks.length === 1}
              >
                <MinusCircleIcon width={25} />
              </Button>
            </div>
          ))}

          <Button
            isIconOnly
            variant="solid"
            size="sm"
            radius="full"
            className="mt-3 mb-1 bg-transparent"
            onPress={() => setTicketLinks([...ticketLinks, ""])}
            isDisabled={ticketLinks.length === 3}
          >
            <PlusCircleIcon color="secondary" width={25} />
          </Button>
        </div>
      )}

      {shouldshowSlider && (
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
            className="mt-7 animate-slide-down"
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
