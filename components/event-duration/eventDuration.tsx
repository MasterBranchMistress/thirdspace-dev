import { selectStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { Select, SelectItem, Input } from "@heroui/react";
import { useState } from "react";
import { useEffect } from "react";

type Props = {
  duration: string;
  eventDate: string;
  onChange: (endTime: string) => void;
};

const durationOptions = [
  { key: "15", label: "15 minutes" },
  { key: "30", label: "30 minutes" },
  { key: "45", label: "45 minutes" },
  { key: "60", label: "1 hour" },
  { key: "120", label: "2 hours" },
  { key: "180", label: "3 hours" },
  { key: "300", label: "5 hours" },
  { key: "480", label: "All day" },
];

const getDurationKey = (minutes: string | null): string => {
  if (!minutes) return "30";

  if ([15, 30, 45, 60, 120, 180, 300, 480].includes(Number(minutes))) {
    return String(minutes);
  }

  return "60"; // fallback
};

export default function DurationPicker({
  eventDate,
  duration,
  onChange,
}: Props) {
  const currKey = String(duration);
  const [selected, setSelected] = useState(getDurationKey(currKey));
  const [customMinutes, setCustomMinutes] = useState(90);

  useEffect(() => {
    const key = getDurationKey(duration);
    setSelected(key);

    if (key === "custom" && duration && !isNaN(Number(duration))) {
      setCustomMinutes(Number(duration));
    }
  }, [duration]);

  const updateEndTime = (minutesToAdd: number) => {
    const baseDate = new Date(eventDate);

    if (isNaN(baseDate.getTime())) {
      console.error("Invalid eventDate:", eventDate);
      return;
    }

    baseDate.setMinutes(baseDate.getMinutes() + minutesToAdd);

    const formattedTime = baseDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    onChange(formattedTime);
  };

  const handleChange = (key: string) => {
    setSelected(key);

    if (key !== "custom") {
      updateEndTime(Number(key));
    }
  };

  const handleCustomChange = (val: string) => {
    const minutes = Number(val);
    setCustomMinutes(minutes);

    if (!isNaN(minutes)) {
      updateEndTime(minutes);
    }
  };

  return (
    <div className="flex flex-col gap-2 animate-slide-down">
      <Select
        label="Event Duration"
        selectedKeys={[selected]}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0] as string;
          handleChange(key);
        }}
        classNames={selectStyle}
      >
        {durationOptions.map((opt) => (
          <SelectItem key={opt.key}>{opt.label}</SelectItem>
        ))}
      </Select>

      {selected === "custom" && (
        <Input
          type="number"
          label="Custom duration (minutes)"
          value={String(customMinutes)}
          onChange={(e) => handleCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}
