"use client";

import { useState, useMemo, useEffect } from "react";
import { Accordion, AccordionItem, Button, Input, Chip } from "@heroui/react";
import {
  ChevronLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import CustomSwitch from "../UI/toggleSwitch";
import Lottie from "lottie-react";
import success from "@/public/lottie/success.json";
import error from "@/public/lottie/error.json";

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
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [pwConfirmVisible, setPwConfirmVisible] = useState(false);
  const [currentPwVisible, setCurrentPwVisible] = useState(false);

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
      setPwdError("Oops, something went wrong here.");
      return;
    }
    if (!oldPwd) {
      setPwdError("Please enter your current password.");
      return;
    }

    try {
      setSavingPwd(true);
      await onChangePassword(oldPwd, newPwd);
      setPwdOk("Password changed successfully!");
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
              type={currentPwVisible ? "text" : "password"}
              label="Current Password"
              variant="underlined"
              color="secondary"
              className="text-white"
              value={oldPwd}
              onValueChange={setOldPwd}
              endContent={
                <button
                  type="button"
                  onClick={() => setCurrentPwVisible((v) => !v)}
                  aria-pressed={currentPwVisible}
                  aria-label={
                    currentPwVisible ? "Hide password" : "Show password"
                  }
                >
                  {currentPwVisible ? (
                    <EyeSlashIcon color="secondary" width={20} />
                  ) : (
                    <EyeIcon color="secondary" width={20} />
                  )}
                </button>
              }
            />
            <Input
              size="sm"
              type={newPwVisible ? "text" : "password"}
              label="New Password"
              variant="underlined"
              color="secondary"
              className="text-white"
              value={newPwd}
              onValueChange={setNewPwd}
              endContent={
                <button
                  type="button"
                  onClick={() => setNewPwVisible((v) => !v)}
                  aria-pressed={newPwVisible}
                  aria-label={newPwVisible ? "Hide password" : "Show password"}
                >
                  {newPwVisible ? (
                    <EyeSlashIcon color="secondary" width={20} />
                  ) : (
                    <EyeIcon color="secondary" width={20} />
                  )}
                </button>
              }
            />
            <Input
              size="sm"
              type={pwConfirmVisible ? "text" : "password"}
              label="Confirm New Password"
              variant="underlined"
              color="secondary"
              className="text-white mb-4"
              value={confirmPwd}
              onValueChange={setConfirmPwd}
              endContent={
                <button
                  type="button"
                  onClick={() => setPwConfirmVisible((v) => !v)}
                  aria-pressed={pwConfirmVisible}
                  aria-label={
                    pwConfirmVisible ? "Hide password" : "Show password"
                  }
                >
                  {pwConfirmVisible ? (
                    <EyeSlashIcon color="secondary" width={20} />
                  ) : (
                    <EyeIcon color="secondary" width={20} />
                  )}
                </button>
              }
            />

            <div className="flex flex-wrap gap-2">
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.hasLen ? "secondary" : "danger"}
              >
                8+ chars
              </Chip>
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.hasUpper ? "secondary" : "danger"}
              >
                Uppercase
              </Chip>
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.hasNum ? "secondary" : "danger"}
              >
                Number
              </Chip>
              <Chip
                size="sm"
                variant="bordered"
                color={pwdValid.matches ? "secondary" : "danger"}
              >
                Matches
              </Chip>
            </div>

            {pwdError && (
              <div className="flex flex-row gap-1 items-center justify-start mb-4">
                <Lottie
                  animationData={error}
                  loop={false}
                  style={{ width: "2rem" }}
                />
                <div className="text-secondary text-xs mt-1">{pwdError}</div>
              </div>
            )}
            {pwdOk && (
              <div className="flex flex-row gap-1 items-center justify-start">
                <Lottie
                  animationData={success}
                  loop={false}
                  style={{ width: "2rem" }}
                />
                <div className="text-secondary text-xs">{pwdOk}</div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                size="sm"
                color="primary"
                variant="shadow"
                isLoading={savingPwd}
                onPress={handlePasswordSave}
                disabled={!pwdValid}
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
