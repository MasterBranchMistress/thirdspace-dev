// components/About.tsx
"use client";

import { Accordion, AccordionItem, Button, Chip } from "@heroui/react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type AboutProps = {
  appName?: string;
  version?: string; // e.g. "1.3.0"
  build?: string; // e.g. short git sha
  environment?: "dev" | "staging" | "prod";
  tosHref?: string;
  privacyHref?: string;
  licensesHref?: string; // OSS licenses page (optional)
};

export function About({
  appName = "ThirdSpace",
  version = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
  build = process.env.NEXT_PUBLIC_BUILD_SHA || "dev",
  environment = (process.env.NEXT_PUBLIC_ENV as any) || "dev",
  tosHref = "/app/terms",
  privacyHref = "#",
  licensesHref = "#",
}: AboutProps) {
  const [copied, setCopied] = useState(false);

  const copyVersion = async () => {
    try {
      await navigator.clipboard.writeText(`${appName} v${version} (${build})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <Accordion
      variant="light"
      selectionMode="multiple"
      defaultExpandedKeys={[]}
      className="rounded-lg"
    >
      <AccordionItem
        key="about"
        aria-label="About"
        title="About"
        className="text-white"
        indicator={<ChevronLeftIcon width={20} className="text-white" />}
      >
        <div className="space-y-4 p-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{appName}</div>
              <div className="text-xs text-white/60">
                v{version} • build {build}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* <Chip size="sm" variant="bordered">
                {environment}
              </Chip> */}
              <Button
                size="sm"
                color="primary"
                variant="shadow"
                onPress={copyVersion}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Legal links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              as="a"
              href={tosHref}
              target="_blank"
              rel="noreferrer"
              variant="flat"
              size="sm"
            >
              Terms of Service
            </Button>
            <Button
              as="a"
              href={privacyHref}
              target="_blank"
              rel="noreferrer"
              variant="flat"
              size="sm"
            >
              Privacy Policy
            </Button>
            {licensesHref && (
              <Button
                as="a"
                href={licensesHref}
                target="_blank"
                rel="noreferrer"
                variant="flat"
                size="sm"
              >
                Open‑Source Licenses
              </Button>
            )}
          </div>

          {/* Credits (optional) */}
          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
}
