"use client";

import {
  GlobeAmericasIcon,
  UserGroupIcon,
  UsersIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Select, SelectItem } from "@heroui/react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function VisibilitySettings({ value, onChange }: Props) {
  const iconClasses =
    "text-xs w-[15px] mb-[1px] text-concrete pointer-events-none shrink-0";

  const options = [
    {
      key: "public",
      label: "Public",
      description: "Everyone can see your activity.",
      icon: <GlobeAmericasIcon className={iconClasses} />,
    },
    {
      key: "followers",
      label: "Friends & Followers",
      description: "Followers can see your activity.",
      icon: <UserGroupIcon className={iconClasses} />,
    },
    {
      key: "friends",
      label: "Friends Only",
      description: "Only friends can see your activity.",
      icon: <UsersIcon className={iconClasses} />,
    },
    {
      key: "off",
      label: "Just Myself",
      description: "Only you can see your activity.",
      icon: <UserIcon className={iconClasses} />,
    },
  ];

  return (
    <Select
      label="Account Visibility"
      placeholder="Choose visibility"
      selectedKeys={new Set([value])}
      onSelectionChange={(keys) => onChange(Array.from(keys as Set<string>)[0])}
      variant="underlined"
      color="default"
      size="sm"
      classNames={{
        base: "w-full mb-6 mt-[-10%]",
        trigger: "bg-transparent dark:bg-black/20",
        listbox: "bg-transparent dark:bg-black/20",
        popoverContent:
          "bg-black/10 backdrop-blur-xl shadow-lg border border-white/10",
      }}
      renderValue={(items) => {
        if (!items || items.length === 0) return "Choose visibility";
        const item = options.find((opt) => opt.key === items[0].key);
        return (
          <span className="flex flex-row items-center gap-1.5">
            {item?.icon}
            <span>{item?.label}</span>
          </span>
        );
      }}
    >
      {options.map((opt) => (
        <SelectItem
          key={opt.key}
          textValue={opt.label}
          classNames={{
            title: "text-[12px]",
            base: [
              "rounded-md transition-colors",
              "data-[hover=true]:bg-white/20 data-[hover=true]:text-white",
              "data-[selected=true]:bg-white/30 data-[selected=true]:text-white",
            ],
            description:
              "text-white/70 text-[12px] font-extralight tracking-tight",
          }}
          description={opt.description}
        >
          <span className="flex flex-row gap-1.5 items-center">
            {opt.icon}
            {opt.label}
          </span>
        </SelectItem>
      ))}
    </Select>
  );
}
