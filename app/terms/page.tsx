"use client";

import { title } from "@/components/primitives";
import Link from "next/link";
import { ParticalBackground } from "@/components/background-animations/ParticlesBackground";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticalBackground />
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 text-white animate-appearance-in">
        <h1 className={title()}>Terms and Conditions</h1>
        <p className="mt-4 text-sm text-white/70">
          Last updated: August 1, 2025
        </p>

        <section className="mt-8 space-y-6 text-sm leading-6">
          <p>
            By creating an account or using the ThirdSpace platform, you agree
            to the following terms and conditions. If you do not agree, please
            do not use our services.
          </p>

          <h2 className="font-semibold text-lg">1. Eligibility</h2>
          <p>
            You must be at least 18 years old to use ThirdSpace. By registering,
            you represent that you meet this requirement.
          </p>

          <h2 className="font-semibold text-lg">2. Community Conduct</h2>
          <p>
            We’re all about respect and connection. No harassment, hate speech,
            or abuse will be tolerated. Violators may be banned without notice.
          </p>

          <h2 className="font-semibold text-lg">3. Privacy</h2>
          <p>
            Your privacy matters. We only use your data to improve the platform.
            We will never sell your information to third parties. See our{" "}
            <Link href="/privacy" className="text-indigo-400 underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>

          <h2 className="font-semibold text-lg">4. Content Ownership</h2>
          <p>
            You own your content. By posting on ThirdSpace, you grant us a
            license to display and distribute your content within the app for
            others to see and engage with.
          </p>

          <h2 className="font-semibold text-lg">5. Disclaimer</h2>
          <p>
            ThirdSpace is provided "as is." We do our best to keep it stable and
            secure, but we can't guarantee uptime or freedom from bugs.
          </p>

          <h2 className="font-semibold text-lg">6. Modifications</h2>
          <p>
            We may update these terms from time to time. If we do, we’ll notify
            you in the app. Continued use of ThirdSpace after changes means you
            accept the new terms.
          </p>

          <p>
            Questions? Contact us at{" "}
            <a
              href="mailto:support@thirdspace.app"
              className="text-indigo-400 underline"
            >
              support@thirdspace.app
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
