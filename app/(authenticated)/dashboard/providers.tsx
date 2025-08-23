"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@/app/providers/ToastProvider";
import { SessionProvider } from "next-auth/react";
import { FeedProvider } from "@/app/context/UserFeedContext";
import { NotificationsProvider } from "@/app/context/NotificationContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <SessionProvider>
      <ToastProvider>
        <FeedProvider>
          <HeroUIProvider navigate={router.push}>
            <NextThemesProvider {...themeProps}>
              <NotificationsProvider>{children}</NotificationsProvider>
            </NextThemesProvider>
          </HeroUIProvider>
        </FeedProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
