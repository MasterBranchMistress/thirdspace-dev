"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/confirm-delete/confirmDialog";
import { banUser } from "@/utils/host-event-actions/banUser";

export function ConfirmBanDialog({
  isOpen,
  onClose,
  eventId,
  hostId,
  userId,
  userName,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  hostId: string;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}) {
  const handleConfirm = async () => {
    const result = await banUser(eventId, hostId, userId);
    if (result.success) {
      onSuccess?.();
    }
    onClose();
  };

  return (
    <>
      {/* Standard confirmation modal */}
      <ConfirmDialog
        isOpen={isOpen}
        onOpenChange={onClose}
        title={`Ban ${userName}?`}
        description="They will be removed from this event and unable to rejoin."
        confirmLabel="Ban"
        cancelLabel="Back"
        danger
        onConfirm={handleConfirm}
      />
    </>
  );
}
