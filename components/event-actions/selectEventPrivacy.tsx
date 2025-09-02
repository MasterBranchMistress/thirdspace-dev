import { selectStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { Alert, Checkbox, Switch } from "@heroui/react";

type PublicCheckboxProps = {
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
};

export function SelectEventPrivacy({
  isPublic,
  setIsPublic,
}: PublicCheckboxProps) {
  return (
    <div className="flex flex-col justify-center items-start">
      <div className="flex flex-row items-center gap-3">
        <h1 className="text-sm">Make Public?</h1>
        <Switch
          isSelected={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          onValueChange={setIsPublic}
          size="sm"
          classNames={selectStyle}
          color="primary"
        ></Switch>
      </div>
      <Alert
        title={`Event is Public!`}
        color="primary"
        isVisible={isPublic}
        hideIconWrapper
        className="animate-appearance-in text-tiny tracking-tighter mt-3"
        classNames={{
          base: "flex flex-row shrink-1 justify-between items-center",
          title: "font-bold text-[13px]",
          description: "text-[11px]",
        }}
        description={`When event is set to "public", anyone is allowed to join, even blocked users!`}
      ></Alert>
    </div>
  );
}
