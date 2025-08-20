"use client";

import {
  Modal,
  ModalContent,
  Button,
  Spinner,
  Accordion,
  AccordionItem,
  Badge,
} from "@heroui/react";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { useState } from "react";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import { TitleWithCount } from "./title-with-label";

type NotificationsModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function NotificationsModal({
  isOpen,
  onOpenChange,
}: NotificationsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //use useEffect to get these values and update
  const messagesCount = 2;
  const notificationsCount = 0;
  const groupsCount = 0;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="xs"
      scrollBehavior="inside"
      backdrop="blur"
      className="bg-transparent text-concrete h-auto"
    >
      <ModalContent>
        {(onClose) => (
          <div className="flex flex-col p-6 h-auto">
            {loading && (
              <div className="flex flex-1 items-center justify-center">
                <Spinner variant="dots" color="secondary" />
              </div>
            )}
            {!loading && (
              <Image
                src={logo}
                width={600}
                alt="thirdspace-logo-white"
                className="justify-center p-0"
                style={{ marginTop: "-7rem" }}
              ></Image>
            )}

            {/* Error State */}
            {error && (
              <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Content Area */}
            {!loading && !error && (
              <div
                className="flex-1 overflow-y-auto"
                style={{ marginTop: "-6rem" }}
              >
                <Accordion
                  variant="light"
                  selectionMode="multiple"
                  isCompact={true}
                  defaultExpandedKeys={[]}
                  className="rounded-lg bg-transparent text-xs"
                >
                  <AccordionItem
                    key="messages"
                    aria-label="Messages"
                    title={
                      <TitleWithCount label="Messages" count={messagesCount} />
                    }
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Example message
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another message
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another message
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another message
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another message
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another message
                      </div>
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    key="notifications"
                    aria-label="Notifications"
                    title={
                      <TitleWithCount
                        label="Notifications"
                        count={notificationsCount}
                      />
                    }
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Example notification
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another notification
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another notification
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another notification
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another notification
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another notification
                      </div>
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    key="groups"
                    aria-label="Groups"
                    title={
                      <TitleWithCount label="Groups" count={groupsCount} />
                    }
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Example group update
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another group update
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another group update
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another group update
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another group update
                      </div>
                      <div className="p-3 border border-zinc-700 rounded-lg">
                        Another group update
                      </div>
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex gap-3 justify-center mt-6">
              <Button
                size="sm"
                variant="shadow"
                color="primary"
                onPress={() => {
                  // bulk mark-as-read here
                }}
              >
                Mark All Read
              </Button>
              <Button
                size="sm"
                variant="bordered"
                color="secondary"
                onPress={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
