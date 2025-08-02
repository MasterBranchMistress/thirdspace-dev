"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Input,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  Badge,
  Image,
} from "@heroui/react";

import { useSession, signOut } from "next-auth/react";
import {
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

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

  return (
    <Navbar isBordered className="bg-concrete justify-center">
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Image
          src="/third-space-logos/thirdspace-logo-4.png"
          alt="ThirdSpace Logo"
          width={200}
        />
      </div>

      <NavbarContent as="div" className="items-center" justify="end">
        {user ? (
          <Dropdown placement="bottom-end">
            <Badge color="primary" content={6} placement="bottom-right">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform hover:cursor-pointer"
                  color="primary"
                  name={user.firstName}
                  size="sm"
                  src={user.avatar || "https://i.pravatar.cc/150?u=placeholder"}
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
                <p className="font-extralight text-center">
                  Welcome back, {user.firstName}! 👋
                </p>
              </DropdownItem>
              <DropdownItem
                key="messages"
                color="warning" //It's dark blue. Dont kill me :)
                endContent={
                  <span className="bg-concrete text-indigo text-xs font-semibold px-2 py-0.5 rounded-md">
                    1
                  </span>
                }
              >
                Messages
              </DropdownItem>

              <DropdownItem
                key="events"
                color="warning" //It's dark blue. Dont kill me :)
                endContent={
                  <span className="bg-concrete text-indigo text-xs font-semibold px-2 py-0.5 rounded-md">
                    2
                  </span>
                }
              >
                Events
              </DropdownItem>
              <DropdownItem
                key="invites"
                color="warning" //It's dark blue. Dont kill me :)
                endContent={
                  <span className="bg-concrete text-indigo text-xs font-semibold px-2 py-0.5 rounded-md">
                    3
                  </span>
                }
              >
                Invites
              </DropdownItem>
              <DropdownItem
                key="settings"
                color="warning" //It's dark blue. Dont kill me :)
                endContent={<Cog6ToothIcon width={22} />}
              >
                Edit Profile
              </DropdownItem>
              <DropdownItem
                key="search"
                color="warning" //It's dark blue. Dont kill me :)
                endContent={<MagnifyingGlassIcon width={22} />}
              >
                Search
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                onClick={() => signOut({ callbackUrl: "/login" })}
                endContent={<ArrowLeftStartOnRectangleIcon width={22} />}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <>
            <NavbarItem>
              <Link href="/login">Log In</Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/register">Sign Up</Link>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </Navbar>
  );
}
