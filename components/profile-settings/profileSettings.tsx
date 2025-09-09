// components/ProfileSettingsModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Input,
  Textarea,
  Button,
  Chip,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  Avatar,
  Accordion,
  AccordionItem,
  Spinner,
} from "@heroui/react";
import Image from "next/image";
import logo from "@/public/third-space-logos/thirdspace-logo-5.png";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Privacy } from "./privacySettings";
import { Security } from "./securitySettings";
import { About } from "./about";
import { useToast } from "@/app/providers/ToastProvider";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import AvatarUploader from "../attachment-uploader/avatarUploader";
import { useAvatar } from "@/app/context/AvatarContext";

type UserLocation = {
  name: string;
  lat?: number | null;
  lng?: number | null;
  geo?: { type: "Point"; coordinates: [number, number] };
};

type UserPayload = {
  id: string;
  callerId?: string;
  username: string;
  usernameLastChangedAt?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  tags?: string[];
  avatar?: {
    key: string;
    fileName: string;
    fileType: string;
  };
  location?: UserLocation;
  lang?: string;
  shareLocation?: boolean;
  shareJoinedEvents?: boolean;
  visibility?: string;
  shareHostedEvents?: boolean;
  blockedUsers?: { id: string; name: string; avatar: string }[];
  twoFactorEnabled?: boolean;
};

const LANGS = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
];

function daysSince(dateISO?: string) {
  if (!dateISO) return Infinity;
  const then = new Date(dateISO).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}
const USERNAME_COOLDOWN_DAYS = 90;

export default function ProfileSettingsModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { notify } = useToast();
  const { data: session, update } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<
    { id: string; name: string; avatar: string }[]
  >([]);
  const [form, setForm] = useState<UserPayload | null>(null);
  const [initialForm, setInitialForm] = useState<UserPayload | null>(null);
  const [tagInput, setTagInput] = useState("");
  const remainingBio = Math.max(0, 150 - (form?.bio?.length ?? 0));
  const canChangeUsername = useMemo(
    () => daysSince(form?.usernameLastChangedAt) >= USERNAME_COOLDOWN_DAYS,
    [form?.usernameLastChangedAt]
  );
  const { avatar, setAvatar } = useAvatar();
  const user = session?.user;

  useEffect(() => {
    if (!isOpen || !userId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (!res.ok) {
          notify("Failed to load profile!", `Couldn't load profile details.`);
          return;
        }
        const geoRes = await fetch(`/api/reverse-geocode`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: data.user.location.lat,
            lng: data.user.location.lng,
          }),
        });

        const loc = await geoRes.json();

        const formPayload: UserPayload = {
          id: userId,
          username: data.user.username,
          usernameLastChangedAt: data.usernameLastChangedAt,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          bio: data.user.bio ?? "",
          tags: Array.isArray(data.user.tags) ? data.user.tags : [],
          avatar: {
            key: data.user.avatar.key,
            fileName: data.user.avatar.fileName,
            fileType: data.user.avatar.fileType,
          },
          location: {
            name: data.user.location?.name ?? loc.place_name ?? "",
            lat: data.user.location?.lat ?? null,
            lng: data.user.location?.lng ?? null,
            geo: data.user.location?.geo,
          },
          shareLocation: data.user.shareLocation,
          shareJoinedEvents: data.user.shareJoinedEvents,
          visibility: data.user.visibility,
          shareHostedEvents: data.user.shareHostedEvents,
          lang: data.user.lang ?? "en",
        };

        setForm(formPayload);
        setInitialForm(formPayload);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, userId]);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/users/${userId}/get-blocked-users`)
      .then((res) => res.json())
      .then((data) => setBlockedUsers(data));
  }, [userId]);

  const handleUnblock = async (blockedId: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
    await fetch(`/api/users/${userId}/unblock-user`, {
      method: "PATCH",
      body: JSON.stringify({
        unblockUserId: blockedId,
      }),
    });
  };

  const pushTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    setTagInput("");
    setForm((prev) =>
      prev
        ? {
            ...prev,
            tags:
              prev.tags && prev.tags.length < 5 && !prev.tags.includes(t)
                ? [...prev.tags, t]
                : prev.tags,
          }
        : prev
    );
  };

  const removeTag = (t: string) =>
    setForm((prev) =>
      prev ? { ...prev, tags: prev.tags?.filter((x) => x !== t) } : prev
    );

  const save = async () => {
    if (!form || !userId) return;
    setError(null);
    setOk(null);

    const next = {
      ...form,
      callerId: userId,
      bio: (form.bio ?? "").slice(0, 150),
      tags: (form.tags ?? []).slice(0, 5).map((t) => t.toLowerCase()),
      username: (form.username ?? "").trim(),
      lang: form.lang ?? "en",
      location: { name: form.location?.name.trim() ?? "" },
      shareLocation: form.shareLocation ?? false,
    };

    try {
      setSaving(true);

      //Check for avatar and save
      if (selectedFile) {
        const imageUrl = `https://thirdspace-attachments-dev.s3.us-east-2.amazonaws.com/${form.avatar?.key}`;
        setAvatar(imageUrl);
        update({ user: { ...session.user, avatar: imageUrl } });
        const avatarRes = await fetch(
          `/api/users/${userId}/avatar-handling/upload-avatar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              avatar: {
                fileName: selectedFile.name,
                fileType: selectedFile.type,
              },
            }),
          }
        );

        if (!avatarRes.ok) {
          notify("Failed to upload file 😭", "Something went wrong here.");
          return;
        }
        const { signedUrl } = await avatarRes.json();

        await fetch(signedUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });
      }

      const res = await fetch(`/api/users/${userId}/edit-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("Failed to load profile!", `Couldn't load profile details.`);
        throw new Error(data?.error || "Failed to save");
      }
      setInitialForm(next);
      onOpenChange(false);
      notify(`Success! 🥳`, `Profile changes saved successfully!`);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (e: any) {
      notify("Something went wrong.", `${e.message}`);
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!form || !initialForm) return false;
    if (selectedFile) return true;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm, selectedFile]);

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
          <div className="flex-1 overflow-y-auto justify-center items-center p-6">
            {!loading && (
              <Image
                src={logo}
                width={600}
                alt="thirdspace-logo-white"
                className="justify-center p-0"
                style={{ marginTop: "-7rem" }}
              ></Image>
            )}

            {loading && (
              <div className="flex items-center justify-center h-full w-full animate-appearance-in">
                <Spinner variant="dots" color="secondary"></Spinner>
              </div>
            )}
            {error && <div className="text-danger text-sm">{error}</div>}
            {form && !loading && (
              <div className="mt-6" style={{ marginTop: "-5rem" }}>
                <Accordion
                  variant="light"
                  selectionMode="multiple"
                  defaultExpandedKeys={[]}
                  className="rounded-lg"
                  isCompact={true}
                >
                  <AccordionItem
                    key="account"
                    aria-label="Account Settings"
                    title="Account Settings"
                    className="text-white"
                    indicator={
                      <ChevronLeftIcon
                        width={20}
                        color="primary"
                        className="text-white"
                      />
                    }
                  >
                    <Input
                      color="secondary"
                      variant="underlined"
                      className="text-white border-concrete description:text-white"
                      size="sm"
                      label="Username"
                      value={form.username}
                      onValueChange={(v) =>
                        setForm((f) => (f ? { ...f, username: v } : f))
                      }
                      description={
                        <span className="text-white text-xs">
                          {canChangeUsername
                            ? "You can change your username now."
                            : `Next change in ${Math.max(
                                0,
                                USERNAME_COOLDOWN_DAYS -
                                  daysSince(form.usernameLastChangedAt)
                              )} days.`}
                        </span>
                      }
                      isDisabled={!canChangeUsername}
                    />

                    <Textarea
                      size="sm"
                      label="Bio"
                      color="secondary"
                      variant="underlined"
                      className="text-white mt-6 border-concrete"
                      value={form.bio ?? ""}
                      onValueChange={(v) =>
                        setForm((f) => (f ? { ...f, bio: v.slice(0, 150) } : f))
                      }
                      description={
                        <span className="text-white text-xs">
                          {remainingBio} characters remaining
                        </span>
                      }
                    />

                    <div>
                      <label className="text-sm block my-6">Tags</label>
                      <div className="flex gap-2 mb-2 mt-4">
                        <Input
                          size="sm"
                          value={tagInput}
                          onValueChange={setTagInput}
                          color="secondary"
                          variant="underlined"
                          className="text-white border-concrete placeholder:text-white"
                          placeholder="Add tag"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              pushTag();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onPress={pushTag}
                          isDisabled={(form.tags?.length ?? 0) >= 5}
                          variant="shadow"
                          color="primary"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-4 text-xs w-full flex-wrap">
                        {(form.tags ?? []).map((t) => (
                          <Chip
                            key={t}
                            onClose={() => removeTag(t)}
                            variant="bordered"
                            color="secondary"
                            className="text-sm"
                          >
                            {t}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8">
                      <>
                        <AvatarUploader onFileSelected={setSelectedFile} />
                      </>
                    </div>
                    <div className="grid grid-cols-1 my-6 md:grid-cols-3 gap-3">
                      <Select
                        label="Language"
                        selectedKeys={new Set([form.lang ?? "en"])}
                        color="secondary"
                        variant="underlined"
                        className="text-white border-concrete"
                        onSelectionChange={(k) =>
                          setForm((f) =>
                            f
                              ? { ...f, lang: Array.from(k as Set<string>)[0] }
                              : f
                          )
                        }
                      >
                        {LANGS.map((l) => (
                          <SelectItem key={l.code}>{l.name}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  </AccordionItem>
                </Accordion>
                <Privacy
                  unblock={handleUnblock}
                  blockedUsers={blockedUsers}
                  shareLocation={form?.shareLocation ?? false}
                  shareJoinedEvents={form?.shareJoinedEvents ?? false}
                  shareHostedEvents={form?.shareHostedEvents ?? false}
                  visibility={form?.visibility ?? "public"}
                  onChange={(updates) =>
                    setForm((prev) => (prev ? { ...prev, ...updates } : prev))
                  }
                />

                <Security
                  twoFactorEnabled={form?.twoFactorEnabled ?? false}
                  setTwoFactorEnabled={(val) =>
                    setForm((f) => (f ? { ...f, twoFactorEnabled: val } : f))
                  }
                  onChangePassword={async (oldPwd, newPwd) => {
                    const res = await fetch(
                      `/api/users/${userId}/change-password`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          callerId: userId,
                          currentPassword: oldPwd,
                          newPassword: newPwd,
                        }),
                      }
                    );
                    const data = await res.json();
                    if (!res.ok)
                      throw new Error(
                        data?.error || "Failed to change password"
                      );
                  }}
                />
                <About />
              </div>
            )}
            {!loading && (
              <div className="flex gap-3 mt-6 justify-center">
                <Button
                  size="sm"
                  color="primary"
                  variant="shadow"
                  isLoading={saving}
                  onPress={save}
                  isDisabled={!isDirty}
                >
                  Save Changes
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
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
