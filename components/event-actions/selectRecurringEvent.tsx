import { selectStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { Select, SelectItem, Switch } from "@heroui/react";

const RECURRING_OPTIONS = [
  { key: "daily", label: "Daily", description: "Event posted every day" },
  { key: "weekly", label: "Weekly", description: "Event posted every week" },
  { key: "monthly", label: "Monthly", description: "Event posted every month" },
];

export type RecurrenceRule = "" | "daily" | "weekly" | "monthly";

type RecurringSelectProps = {
  recurring: boolean; // 👈 whether recurrence is enabled
  recurrenceRule: RecurrenceRule; // 👈 specific frequency
  setRecurring: (value: boolean) => void;
  setRecurrenceRule: (rule: RecurrenceRule) => void;
};

export function SelectRecurringEvent({
  recurring,
  recurrenceRule,
  setRecurring,
  setRecurrenceRule,
}: RecurringSelectProps) {
  return (
    <div className="flex flex-col justify-center items-start">
      <div className="flex flex-row gap-3 justify-center items-center">
        <h1 className="text-sm">Make Recurring?</h1>
        <Switch
          isSelected={recurring}
          onValueChange={(checked) => {
            setRecurring(checked);
            if (!checked) {
              setRecurrenceRule(""); // reset if turned off
            } else if (recurrenceRule === null) {
              setRecurrenceRule("daily"); // default when toggled on
            }
          }}
          color="primary"
          size="sm"
          classNames={selectStyle}
        />
      </div>

      <Select
        label="Select Frequency"
        isRequired={recurring}
        hidden={!recurring}
        labelPlacement="inside"
        selectedKeys={[recurrenceRule]}
        onSelectionChange={(keys) => {
          const value = Array.from(keys)[0] as RecurrenceRule;
          setRecurrenceRule(value);
        }}
        size="sm"
        classNames={selectStyle}
      >
        {RECURRING_OPTIONS.map((option) => (
          <SelectItem key={option.key} description={option.description}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
