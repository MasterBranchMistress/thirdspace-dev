"use client";

import { AddressAutofillProps } from "@mapbox/search-js-react/dist/components/AddressAutofill";
import dynamic from "next/dynamic";

const AddressAutofill = dynamic<any>(
  () =>
    import("@mapbox/search-js-react").then((mod) => ({
      default: mod.AddressAutofill as React.ComponentType<AddressAutofillProps>,
    })),
  { ssr: false }
);

const theme = {
  variables: {
    fontFamily: "Avenir, sans-serif",
    unit: "12px",
    padding: ".5rem",
    margin: "1rem 0",
    colorBackground: "#5c6cc4", // dropdown background
    colorBackdrop: "#fff", // overlay backdrop
    color: "#fff", // input text
    colorText: "white", // dropdown text
    borderRadius: "1rem",
    lineHeight: "1.25rem", // <- fixed
  },
};

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelect: (loc: { name: string; lat: number; lng: number }) => void;
}) {
  return (
    <AddressAutofill
      theme={theme}
      accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN!}
      onRetrieve={(res: { features: any[] }) => {
        const feature = res.features[0];
        onSelect({
          name: feature.properties.full_address ?? feature.place_name,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        });
      }}
    >
      <div className="relative w-full mt-6">
        <input
          aria-label="Location"
          placeholder="Search Location..."
          type="text"
          name="address-1"
          autoComplete="address-line1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm border-b-2 border-concrete pb-2 focus:outline-none focus:ring-0 focus:border-concrete"
        />
        <label
          htmlFor="location"
          className="absolute left-0 -top-5 text-xs text-concrete transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary"
        >
          Event Location
        </label>
      </div>
    </AddressAutofill>
  );
}
