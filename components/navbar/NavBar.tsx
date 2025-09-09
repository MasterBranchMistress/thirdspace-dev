"use client";

import {
  Navbar,
  NavbarContent,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Image,
  DropdownSection,
  User,
  Button,
  Badge,
} from "@heroui/react";

import EnableDarkMode from "../theme-switch/EnableDarkModeSwitcher";
import { useSession, signOut } from "next-auth/react";
import {
  BugAntIcon,
  CogIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  ArrowRightStartOnRectangleIcon,
  BuildingStorefrontIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useNotifications } from "@/app/context/NotificationContext";
import { useRouter } from "next/navigation";
import ProfileSettingsModal from "../profile-settings/profileSettings";
import NotificationsModal from "../notification-page/notificationPage";
import { dropDownStyle } from "@/utils/get-dropdown-style/getDropDownStyle";
import { useAvatar } from "@/app/context/AvatarContext";

export default function NavBar() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const user = session?.user;
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const { notificationCount } = useNotifications();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { avatar, setAvatar } = useAvatar();

  return (
    <>
      <Navbar
        isBordered={false}
        position="sticky"
        className="bg-white/10 animate-appearance-in"
      >
        <NavbarContent justify="start" className="gap-3 sm:gap-4">
          <Image
            src="/icons/kickstarter.png"
            alt="kickstarter_logo"
            width={14}
            radius="none"
            className="!min-w-4"
          />
          <Image
            src="/icons/patreon.png"
            alt="patreon_logo"
            width={14}
            radius="none"
            className="!min-w-4"
          />
          <Image
            src="/icons/gofundme.png"
            alt="gofundme_logo"
            width={18}
            radius="none"
            className="!min-w-5"
          />
        </NavbarContent>
        <NavbarContent justify="center">
          <div onClick={() => router.push(`/dashboard`)}>
            {" "}
            <Image
              src="/third-space-logos/thirdspace-logo-4.png"
              alt="ThirdSpace Logo"
              className="max-w-auto sm:max-w-[190px] lg:max-w-[210px] px-[5%] mx-auto shrink-1"
            />
          </div>
        </NavbarContent>

        <NavbarContent
          as="div"
          className="items-center animate-appearance-in"
          justify="end"
        >
          {user && (
            <Dropdown
              showArrow
              backdrop="blur"
              classNames={dropDownStyle}
              radius="sm"
            >
              <DropdownTrigger>
                <div>
                  <Badge
                    content={""}
                    size="sm"
                    className="border-none animate-pulse mt-1.5"
                    color="success"
                    hidden={!notificationCount}
                    placement="top-right"
                  >
                    <Avatar
                      src={
                        avatar ||
                        session?.user.avatar ||
                        "/misc/default-avatar.png"
                      }
                      color="primary"
                      isBordered
                      size="md"
                      className="mt-1"
                    />
                  </Badge>
                </div>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Custom item styles"
                className="p-3"
                disabledKeys={["profile"]}
                itemClasses={{
                  base: ["rounded-md", "text-default-500", "transition-colors"],
                }}
              >
                <DropdownSection showDivider aria-label="Profile & Actions">
                  <DropdownItem
                    key="profile"
                    isReadOnly
                    className="h-14 gap-2 opacity-100"
                  >
                    <User
                      avatarProps={{
                        size: "sm",
                        src: user.avatar,
                      }}
                      classNames={{
                        name: "text-concrete",
                        description: "text-white/50",
                      }}
                      description={user.email}
                      name={`${user.firstName} ${user.lastName}`}
                    />
                  </DropdownItem>
                  <DropdownItem
                    key="dashboard"
                    className="text-concrete"
                    endContent={<GlobeAltIcon className="text-xs w-5" />}
                    onPress={() => router.push(`/dashboard`)}
                  >
                    Explore
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    className="text-concrete"
                    endContent={<CogIcon className="text-xs w-5" />}
                    onPress={() => setIsSettingsOpen(true)}
                  >
                    Edit Profile
                  </DropdownItem>
                  <DropdownItem
                    key="view profile"
                    className="text-concrete"
                    endContent={<UserIcon className="text-xs w-5" />}
                    onPress={() => router.push(`/dashboard/profile/${user.id}`)}
                  >
                    View Profile
                  </DropdownItem>
                  <DropdownItem
                    key="notifications"
                    className="text-concrete"
                    endContent={
                      notificationCount ? (
                        <div className="bg-danger text-xs rounded-full py-0.5 w-5 text-center">
                          {notificationCount < 100 ? notificationCount : "99+"}
                        </div>
                      ) : null
                    }
                    onPress={() => setIsNotificationsOpen(true)}
                  >
                    Notifications
                  </DropdownItem>
                </DropdownSection>

                <DropdownSection showDivider aria-label="Preferences">
                  <DropdownItem
                    key="quick_search"
                    shortcut="⌘ + K"
                    className="text-concrete"
                    classNames={{
                      shortcut:
                        "outline-none border-1 border-concrete text-concrete",
                    }}
                  >
                    Quick search
                  </DropdownItem>
                  <DropdownItem
                    key="theme"
                    isReadOnly
                    className="cursor-default text-concrete"
                    endContent={<EnableDarkMode />}
                  >
                    Theme
                  </DropdownItem>
                </DropdownSection>

                <DropdownSection aria-label="Help & Feedback">
                  <DropdownItem
                    key="apply_for_host"
                    isReadOnly
                    className="cursor-default text-concrete"
                    endContent={
                      <BuildingStorefrontIcon className="text-xs w-5" />
                    }
                  >
                    Become a Partner
                  </DropdownItem>
                  <DropdownItem
                    key="help_and_feedback"
                    className="text-concrete"
                    endContent={<BugAntIcon className="text-xs w-5" />}
                  >
                    Help & Feedback
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    className="text-concrete"
                    endContent={
                      <ArrowRightStartOnRectangleIcon className="text-xs w-5" />
                    }
                    onClick={() => signOut({ callbackUrl: "/login" })} // optional redirect
                  >
                    Log Out
                  </DropdownItem>
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          )}
        </NavbarContent>
      </Navbar>
      {/* ✅ Modals mounted at root */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onOpenChange={setIsNotificationsOpen}
      />
    </>
  );
}
