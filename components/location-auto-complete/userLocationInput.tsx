"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { SearchBoxProps } from "@mapbox/search-js-react/dist/components/SearchBox";

const SearchBox = dynamic(
  () =>
    import("@mapbox/search-js-react").then((mod) => ({
      default: mod.SearchBox as unknown as ComponentType<SearchBoxProps>,
    })),
  { ssr: false },
);

type LocationSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (loc: { name: string; lat: number; lng: number }) => void;
};

export default function UserLocationSearch({
  value,
  onChange,
  onSelect,
}: LocationSearchProps) {
  return (
    <>
      <div className="w-full border-b-2 text-concrete border-concrete pb-2 thirdspace-searchbox">
        <label
          htmlFor="location"
          className="text-xs text-concrete transition-all"
        >
          City or Neighborhood
        </label>
        <p className="text-[11px] text-concrete/60 mt-1">
          Helps us show things happening nearby.
        </p>
        <SearchBox
          interceptSearch={(text) => {
            const q = text.trim();
            if (q.length < 3) return "";
            return q;
          }}
          theme={{
            variables: {
              fontFamily: "inherit",
              colorText: "#ffffff",
              colorSecondary: "#ffffff",
              colorPrimary: "#5c6cc4",
              colorBackground: "#transparent",
              colorBackdrop: "#5c6cc4",
              borderRadius: "10px",
              padding: "5px",
              unit: "12px",
              border: "none",
              boxShadow: "none",
            },
          }}
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN!}
          value={value}
          onChange={onChange}
          onRetrieve={(res: any) => {
            const feature = res?.features?.[0];
            if (!feature?.geometry?.coordinates) return;

            const [lng, lat] = feature.geometry.coordinates;

            onSelect({
              name:
                feature?.properties?.full_address ??
                feature?.properties?.name ??
                feature?.place_name ??
                value,
              lat,
              lng,
            });
          }}
          options={{
            language: "en",
            country: "US",
          }}
        />
      </div>
    </>
  );
}
