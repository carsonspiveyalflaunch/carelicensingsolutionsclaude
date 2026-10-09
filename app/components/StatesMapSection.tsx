"use client";

import React, { useState } from "react";
import USAMap from "./USAMap";

import { useRouter } from "next/navigation";
import "./usa-map-hover.css";
import { HiLocationMarker } from "react-icons/hi";

export default function StatesMapSection() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(
    null,
  );
  const router = useRouter();

  // Map of state abbreviations to full names
  const stateNames: { [abbr: string]: string } = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    DC: "District of Columbia",
  };

  // No highlight by default
  const mapCustomizations = {};

  // Add hover effect via CSS
  // Import the CSS file for hover effect
  // (Create app/components/usa-map-hover.css with the required styles)

  const handleStateSelect = (abbr: string) => {
    if (abbr && stateNames[abbr]) {
      setSelectedState(abbr);
      setSelectedStateName(stateNames[abbr]);
      router.push(`/get-started?state=${abbr}`);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center py-12 bg-white">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-[#b6ff7a] mx-auto p-8 flex flex-col items-center">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-block bg-[#b6ff7a] text-[#417a5a] font-semibold text-sm px-4 py-1 rounded-full">
            <HiLocationMarker size={16} />
          </span>
          <span className="text-lg font-semibold text-[#417a5a]">
            Click any state to get started
          </span>
        </div>
        <div className="bg-[#eaffea] rounded-xl p-3 flex items-center justify-center w-full">
          <div className="w-full flex items-center justify-center relative">
            <USAMap
              selectedState={selectedState || undefined}
              onSelectState={handleStateSelect}
            />
          </div>
        </div>
        <div className="mt-6 text-center text-[#417a5a] text-sm">
          {selectedState ? (
            <span>
              Selected: <b>{selectedState}</b> - {selectedStateName}
            </span>
          ) : (
            <span>
              Select your state to view available care business licensing
              packages
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
