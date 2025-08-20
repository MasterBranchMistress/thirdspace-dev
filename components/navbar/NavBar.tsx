"use client";

import {
  Navbar,
  NavbarContent,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Badge,
  Image,
} from "@heroui/react";

import EnableDarkMode from "../theme-switch/EnableDarkModeSwitcher";

import { useSession, signOut } from "next-auth/react";
import {
  ArrowLeftStartOnRectangleIcon,
  PhoneArrowDownLeftIcon,
  BugAntIcon,
  FaceFrownIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export const SearchIcon = ({
  size = 24,
  strokeWidth = 1.5,
  width = 15,
  height = 15,
  ...props
}) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={height || size}
      role="presentation"
      viewBox="0 0 24 24"
      width={width || size}
      {...props}
    >
      <path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
      <path
        d="M22 22L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default function NavBar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(user?.avatar ?? "");
  }, [user]);

  return (
    <Navbar
      isBordered={false}
      position="static"
      className="bg-concrete justify-center align-middle animate-appearance-in"
    >
      {status !== "loading" && <EnableDarkMode />}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Image
          src="/third-space-logos/thirdspace-logo-4.png"
          alt="ThirdSpace Logo"
          width={400}
        />
      </div>

      <NavbarContent
        as="div"
        className="items-center animate-appearance-in"
        justify="center"
      >
        {user && (
          <Dropdown placement="bottom-end">
            <Badge
              size="sm"
              isOneChar
              color="success"
              content={<CheckCircleIcon />}
              placement="top-right"
              className="mt-0.5 border-none text-concrete"
            >
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform hover:cursor-pointer"
                  color="primary"
                  name={user.firstName}
                  size="md"
                  src={user.avatar ?? undefined}
                />
              </DropdownTrigger>
            </Badge>

            <DropdownMenu
              itemClasses={{ base: "bg-primary text-white" }}
              aria-label="Profile Actions"
              variant="shadow"
              className="tracking-wide"
            >
              <DropdownItem key="profile" className="h-10 gap-2">
                <p className="font-extralight tracking-tight text-center">
                  <span className="mr-2">
                    {" "}
                    How can we help, {user.firstName}?
                  </span>{" "}
                  👀
                </p>
              </DropdownItem>
              <DropdownItem
                key="feedback"
                endContent={<BugAntIcon width={20} />}
              >
                Report a Bug
              </DropdownItem>
              <DropdownItem
                key="support"
                endContent={<PhoneArrowDownLeftIcon width={20} />}
              >
                Contact Support
              </DropdownItem>
              <DropdownItem
                key="abuse"
                endContent={<FaceFrownIcon width={20} />}
              >
                Report Abuse
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                onClick={() => signOut({ callbackUrl: "/login" })}
                endContent={<ArrowLeftStartOnRectangleIcon width={20} />}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>
    </Navbar>
  );
}
