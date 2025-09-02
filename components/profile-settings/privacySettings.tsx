"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Accordion, AccordionItem, Button, Avatar } from "@heroui/react";
import CustomSwitch from "../UI/toggleSwitch";
import { useToast } from "@/app/providers/ToastProvider";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import ConfirmDialog from "../confirm-delete/confirmDialog";
import VisibilitySettings from "./setVisibility";
import { useRouter } from "next/navigation";

type PrivacyProps = {
  shareLocation: boolean;
  blockedUsers: { id: string; name: string; avatar: string }[];
  unblock: (id: string) => void; // takes a user ID
  shareJoinedEvents: boolean;
  shareHostedEvents: boolean;
  visibility: string;
  onChange: (updates: Record<string, any>) => void;
};

export function Privacy({
  shareLocation,
  blockedUsers,
  unblock,
  shareJoinedEvents,
  shareHostedEvents,
  visibility,
  onChange,
}: PrivacyProps) {
  const { notify } = useToast();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const router = useRouter();

  const requestDelete = async () => {
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const msg = (await res.json())?.error || "Failed to delete account.";
      notify("Delete failed", msg);
      throw new Error(msg);
    }
    notify("Account deleted 😭", "We’re sorry to see you go.");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Accordion
      variant="light"
      selectionMode="multiple"
      defaultExpandedKeys={[]}
      className="rounded-lg"
    >
      <AccordionItem
        key="privacy"
        aria-label="Privacy Settings"
        title="Privacy Settings"
        className="text-white"
        indicator={<ChevronLeftIcon width={20} className="text-white w-full" />}
      >
        <div className="space-y-4 p-2">
          <VisibilitySettings
            value={visibility}
            onChange={(val) => onChange({ visibility: val })}
          />
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm">Show my location</span>
            <CustomSwitch
              size="sm"
              checked={shareLocation}
              onChange={(checked) => onChange({ shareLocation: checked })}
            />
          </div>

          {/* Event settings */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm">Show joined events</span>
            <CustomSwitch
              size="sm"
              checked={shareJoinedEvents}
              onChange={(checked) => onChange({ shareJoinedEvents: checked })}
            />
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm">Show hosted events</span>
            <CustomSwitch
              size="sm"
              checked={shareHostedEvents}
              onChange={(checked) => onChange({ shareHostedEvents: checked })}
            />
          </div>
          <Accordion
            variant="light"
            selectionMode="multiple"
            isCompact={true}
            defaultExpandedKeys={[]}
            className="rounded-lg bg-transparent text-xs"
          >
            <AccordionItem
              key="blocked"
              aria-label="Blocked Users"
              title="Blocked Users"
              className="text-white"
              classNames={{
                title: "text-sm text-secondary",
              }}
              indicator={
                <ChevronLeftIcon width={15} className="text-white w-full" />
              }
              isCompact={true}
            >
              {blockedUsers.length === 0 ? (
                <p className="text-xs text-white/60">No one is blocked</p>
              ) : (
                <ul className="space-y-3">
                  {blockedUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={u.avatar}
                          size="sm"
                          className="flex-shrink-0 border-1 border-white hover:cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/profile/${u.id}`)
                          }
                        />
                        <span className="truncate text-xs">{u.name}</span>
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        variant="shadow"
                        onPress={() => unblock(u.id)}
                        className="!px-2 !py-1 !h-6.5 !text-[10px] !max-w-[10%] rounded-md"
                      >
                        Unblock
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </AccordionItem>
          </Accordion>

          {/* Delete account */}
          <div className="flex justify-start items-center">
            <Button
              size="sm"
              color="danger"
              className="mt-2"
              onPress={() => setConfirmDeleteOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
        <ConfirmDialog
          isOpen={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          title="Delete your account?"
          description="This will permanently remove your profile, feed items, and connections. This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={requestDelete}
        />
      </AccordionItem>
    </Accordion>
  );
}
