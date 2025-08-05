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
  Tooltip,
} from "@heroui/react";

import { useSession, signOut } from "next-auth/react";
import {
  Cog6ToothIcon,
  MapPinIcon,
  PlusIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Lottie from "lottie-react";
import animationData from "@/public/lottie/add-event.json";

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
    <Navbar
      isBordered={false}
      position="static"
      className="bg-concrete justify-center animate-appearance-in"
    >
      {status !== "loading" && (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ height: "40px", width: "40px", zIndex: 20 }}
        />
      )}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <Image
          src="/third-space-logos/thirdspace-logo-4.png"
          alt="ThirdSpace Logo"
          width={200}
        />
      </div>

      <NavbarContent
        as="div"
        className="items-center animate-appearance-in"
        justify="end"
      >
        {user && (
          <Dropdown placement="bottom-end">
            <Badge
              color="primary"
              content={""}
              placement="top-right"
              className=""
            >
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
                key={"event"}
                color="warning" /*its dark blue. Dont kill me :)*/
                endContent={<MapPinIcon width={20} />}
              >
                My Events
              </DropdownItem>
              <DropdownItem
                key={"friend_requests"}
                color="warning"
                endContent={
                  <div className="w-5 h-4 rounded-md bg-concrete text-primary text-sm flex items-center justify-center align-middle">
                    {1}
                  </div>
                }
              >
                Friend Requests
              </DropdownItem>
              <DropdownItem
                key={"messages"}
                color="warning"
                endContent={
                  <div className="w-5 h-4 rounded-md bg-concrete text-primary text-sm flex items-center justify-center align-middle">
                    {1}
                  </div>
                }
              >
                Messages
              </DropdownItem>
              <DropdownItem
                key={"settings"}
                color="warning"
                endContent={<Cog6ToothIcon width={20} />}
              >
                Settings
              </DropdownItem>
              <DropdownItem
                key={"search"}
                color="warning"
                endContent={<SearchIcon width={20} />}
              >
                Search
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
