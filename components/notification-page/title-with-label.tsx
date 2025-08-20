import { Badge } from "@heroui/react";

export function TitleWithCount({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-start gap-2 w-full ml-3.5">
      {typeof count === "number" && count > 0 && (
        <Badge
          size="sm"
          color="success"
          content=""
          isOneChar={count < 10}
          className="!w-2 !h-2 !min-w-0 !min-h-0 border-none shadow-2xs mr-1.5 animate-pulse"
        >
          {""}
        </Badge>
      )}
      <span>{label}</span>
    </div>
  );
}
