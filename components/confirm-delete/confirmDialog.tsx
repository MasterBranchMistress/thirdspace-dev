"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import Lottie from "lottie-react";
import { useState } from "react";
import sad from "@/public/lottie/sad.json";
import thinking from "@/public/lottie/thinking.json";

type ConfirmDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;

  confirmLabel?: string;
  cancelLabel?: string;

  // When true, styles the confirm button as destructive
  danger?: boolean;

  // async handler allowed; button shows loading while in-flight
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
      className="bg-transparent text-white text-center"
      hideCloseButton={submitting}
      size="xs"
    >
      <ModalContent>
        {() => (
          <div className="flex flex-col justify-center items-center gap-0">
            {danger === true && (
              <Lottie
                animationData={sad}
                style={{ width: "6rem", padding: "1rem 0 0" }}
              />
            )}
            {danger === false && (
              <Lottie
                animationData={thinking}
                style={{ width: "6rem", padding: "1rem 0 0" }}
              />
            )}
            <ModalHeader className="text-base text-center">{title}</ModalHeader>
            <ModalBody className="pt-0">
              <p className="text-sm text-white/80">{description}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="bordered"
                color="secondary"
                onPress={handleCancel}
                isDisabled={submitting}
              >
                {cancelLabel}
              </Button>
              <Button
                color={danger ? "danger" : "primary"}
                variant="shadow"
                onPress={handleConfirm}
                isLoading={submitting}
              >
                {confirmLabel}
              </Button>
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
