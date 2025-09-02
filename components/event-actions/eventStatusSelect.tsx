import { selectStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { Select, SelectItem } from "@heroui/react";
import { Description } from "@radix-ui/react-toast";

const EVENT_STATUSES = [
  { key: "active", label: "Active", description: "Orbiters can still join" },
  {
    key: "locked",
    label: "Locked",
    description: "Max orbiter count has been reached",
  },
  {
    key: "in_progress",
    label: "In Progress",
    description: "Event is currently in progress",
  },
];

type EventStatusSelectProps = {
  status: string;
  setStatus: (status: string) => void;
};

export default function EventStatusSelect({
  status,
  setStatus,
}: EventStatusSelectProps) {
  return (
    <Select
      label="Event Status"
      labelPlacement="outside"
      variant="underlined"
      selectedKeys={[status]}
      onSelectionChange={(keys) => {
        const value = Array.from(keys)[0] as string;
        setStatus(value);
      }}
      size="sm"
      classNames={selectStyle}
    >
      {EVENT_STATUSES.map((s) => (
        <SelectItem
          classNames={{ description: "text-concrete/70" }}
          key={s.key}
          description={s.description}
        >
          {s.label}
        </SelectItem>
      ))}
    </Select>
  );
}
