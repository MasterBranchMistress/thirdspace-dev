"use client";

import { useState, useMemo, useEffect } from "react";
import { Accordion, AccordionItem, Button, Input, Chip } from "@heroui/react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import CustomSwitch from "../UI/toggleSwitch";

type SessionItem = {
  id: string;
  device: string; // e.g., "Chrome on Windows"
  ip?: string; // e.g., "73.201.12.45"
  lastActive: string; // ISO or pretty string
  current?: boolean; // highlight current session
};

type SecurityProps = {
  // 2FA
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (value: boolean) => void;

  // Password change
  onChangePassword: (
    oldPassword: string,
    newPassword: string
  ) => Promise<void> | void;
};

export function Security({
  twoFactorEnabled,
  setTwoFactorEnabled,
  onChangePassword,
}: SecurityProps) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdOk, setPwdOk] = useState<string | null>(null);

  const pwdValid = useMemo(() => {
    const hasLen = newPwd.length >= 8;
    const hasUpper = /[A-Z]/.test(newPwd);
    const hasNum = /\d/.test(newPwd);
    const matches = newPwd === confirmPwd && newPwd.length > 0;
    return {
      hasLen,
      hasUpper,
      hasNum,
      matches,
      ok: hasLen && hasUpper && hasNum && matches,
    };
  }, [newPwd, confirmPwd]);

  const handlePasswordSave = async () => {
    setPwdError(null);
    setPwdOk(null);

    if (!pwdValid.ok) {
      setPwdError(
        "Password must be 8+ chars with at least one uppercase letter and one number, and both fields must match."
      );
      return;
    }
    if (!oldPwd) {
      setPwdError("Please enter your current password.");
      return;
    }

    try {
      setSavingPwd(true);
      await onChangePassword(oldPwd, newPwd);
      setPwdOk("Password updated ✅");
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (e: any) {
      setPwdError(e?.message || "Failed to update password.");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <Accordion
      variant="light"
      selectionMode="multiple"
      defaultExpandedKeys={[]}
      className="rounded-lg"
    >
      <AccordionItem
        key="security"
        aria-label="Security Settings"
        title="Security Settings"
        className="text-white"
        indicator={<ChevronLeftIcon width={20} className="text-white" />}
      >
        <div className="space-y-6 p-2">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">Two‑Factor Authentication</div>
              <div className="text-xs text-white/60">
                Receive a code on sign‑in.
              </div>
            </div>
            <CustomSwitch
              size="sm"
              checked={twoFactorEnabled}
              onChange={setTwoFactorEnabled}
            />
          </div>

          {/* Change Password */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-center">
              Change Password
            </div>
            <Input
              size="sm"
              type="password"
              label="Current Password"
              variant="underlined"
              color="secondary"
              className="text-white"
              value={oldPwd}
              onValueChange={setOldPwd}
            />
            <Input
              size="sm"
              type="password"
              label="New Password"
              variant="underlined"
              color="secondary"
              className="text-white"
              value={newPwd}
              onValueChange={setNewPwd}
            />
            <Input
              size="sm"
              type="password"
              label="Confirm New Password"
              variant="underlined"
              color="secondary"
              className="text-white"
              value={confirmPwd}
              onValueChange={setConfirmPwd}
            />

            <div className="flex flex-wrap gap-2">
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.hasLen ? "success" : "secondary"}
              >
                8+ chars
              </Chip>
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.hasUpper ? "success" : "secondary"}
              >
                Uppercase
              </Chip>
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.hasNum ? "success" : "secondary"}
              >
                Number
              </Chip>
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.matches ? "success" : "secondary"}
              >
                Matches
              </Chip>
            </div>

            {pwdError && <div className="text-danger text-xs">{pwdError}</div>}
            {pwdOk && <div className="text-success text-xs">{pwdOk}</div>}

            <div className="flex justify-end">
              <Button
                size="sm"
                color="primary"
                variant="shadow"
                isLoading={savingPwd}
                onPress={handlePasswordSave}
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
