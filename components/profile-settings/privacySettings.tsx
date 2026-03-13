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
import { useBrowserLocation } from "@/utils/geolocation/get-user-location/getUserLocation";
import { SearchBox } from "@mapbox/search-js-react";
import LocationSearch from "../location-auto-complete/searchInput";
import UserLocationSearch from "../location-auto-complete/userLocationInput";
import UserLocation from "../user-location/userLocation";
import { useUserInfo } from "@/app/context/UserContext";

type PrivacyProps = {
  shareLocation: boolean;
  blockedUsers: { id: string; name: string; avatar: string }[];
  unblock: (id: string) => void;
  shareJoinedEvents: boolean;
  shareHostedEvents: boolean;
  visibility: string;
  privacyTabOpen: string[];
  onChange: (updates: Record<string, any>) => void;
  location?: {
    name: string;
    lat?: number | null;
    lng?: number | null;
    geo?: { type: "Point"; coordinates: [number, number] };
  };
};

export function Privacy({
  shareLocation,
  blockedUsers,
  privacyTabOpen,
  unblock,
  shareJoinedEvents,
  shareHostedEvents,
  visibility,
  onChange,
}: PrivacyProps) {
  const { notify } = useToast();
  const { data: session } = useSession();
  const browserLocation = useBrowserLocation();
  const userId = session?.user?.id;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { location, setLocation } = useUserInfo();
  const router = useRouter();

  const hasBrowserLocation =
    browserLocation.status === "success" &&
    typeof browserLocation.coords.lat === "number" &&
    typeof browserLocation.coords.lng === "number";

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

  const getSuggestedLocation = async () => {
    const geoRes = await fetch(`/api/reverse-geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: browserLocation.coords.lat,
        lng: browserLocation.coords.lng,
      }),
    });

    const loc = await geoRes.json();

    setLocation(loc);
  };

  return (
    <Accordion
      variant="light"
      selectionMode="multiple"
      defaultExpandedKeys={privacyTabOpen ?? []}
      className="rounded-lg"
    >
      <AccordionItem
        key="privacy"
        aria-label="Privacy Settings"
        title="Privacy Settings"
        className="text-white"
        indicator={<ChevronLeftIcon width={20} className="w-full text-white" />}
      >
        <div className="space-y-4 p-2">
          <VisibilitySettings
            value={visibility}
            onChange={(val) => onChange({ visibility: val })}
          />

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm">Use device location</span>
            <CustomSwitch
              size="sm"
              checked={shareLocation}
              onChange={(checked) => onChange({ shareLocation: checked })}
            />
          </div>

          <div className="mb-6 flex flex-col gap-2 justify-center">
            <Button
              size="sm"
              variant="shadow"
              color="primary"
              isDisabled={!hasBrowserLocation || !shareLocation}
              onPress={async () => {
                await getSuggestedLocation();
                if (!hasBrowserLocation) return;

                onChange({
                  location: {
                    name: browserLocation.placeName ?? "",
                    lat: browserLocation.coords.lat,
                    lng: browserLocation.coords.lng,
                    geo: {
                      type: "Point",
                      coordinates: [
                        browserLocation.coords.lng,
                        browserLocation.coords.lat,
                      ] as [number, number],
                    },
                  },
                });
              }}
            >
              Use Current Location
            </Button>

            {browserLocation.placeName && shareLocation && (
              <p className="mt-2 text-xs text-white/60 mb-[-1rem]">
                Detected: {browserLocation.placeName}
              </p>
            )}
          </div>
          <UserLocationSearch
            value={location?.name ?? ""}
            onChange={(val) =>
              onChange({
                location: {
                  ...location,
                  name: val,
                },
              })
            }
            onSelect={(loc) =>
              onChange({
                location: {
                  name: loc.name,
                  lat: loc.lat ?? null,
                  lng: loc.lng ?? null,
                  geo:
                    typeof loc.lat === "number" && typeof loc.lng === "number"
                      ? {
                          type: "Point",
                          coordinates: [loc.lng, loc.lat],
                        }
                      : undefined,
                },
              })
            }
          />

          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm">Show joined events</span>
            <CustomSwitch
              size="sm"
              checked={shareJoinedEvents}
              onChange={(checked) => onChange({ shareJoinedEvents: checked })}
            />
          </div>

          <div className="mb-6 flex items-center justify-between">
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
            isCompact
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
                <ChevronLeftIcon width={15} className="w-full text-white" />
              }
              isCompact
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
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          src={u.avatar}
                          size="sm"
                          className="flex-shrink-0 cursor-pointer border-1 border-white"
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
                        className="!h-6.5 !max-w-[10%] !rounded-md !px-2 !py-1 !text-[10px]"
                      >
                        Unblock
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </AccordionItem>
          </Accordion>

          <div className="flex items-center justify-start">
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
