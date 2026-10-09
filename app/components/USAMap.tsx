"use client";

import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { fipsToPostal } from "./fipsToPostal";

const topoUrl =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface USAMapProps {
  selectedState?: string;
  onSelectState: (abbr: string) => void;
  values?: Record<string, number>;
}

export default function USAMap({
  selectedState,
  onSelectState,
  values = {},
}: USAMapProps) {
  const getFillColor = (postal?: string) => {
    if (!postal) return "#e5e7eb";

    if (postal === selectedState) return "#34d399";

    const value = values[postal];
    if (value !== undefined) {
      const intensity = Math.min(value / 100, 1);
      return `rgba(34,197,94,${0.3 + intensity * 0.7})`;
    }

    return "#e5e7eb";
  };

  return (
    <div className="w-full max-w-7xl mx-auto aspect-[16/9]">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1300 }}   // Even bigger scale for larger visual
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={topoUrl}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo) => {
              const postal =
                fipsToPostal[String(geo.id).padStart(2, "0")];

              const centroid = geoCentroid(geo);

              return (
                <g key={geo.rsmKey}>
                  <Geography
                    geography={geo}
                    onClick={() => postal && onSelectState(postal)}
                    style={{
                      default: {
                        fill: getFillColor(postal),
                        stroke: "#fff",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: postal ? "pointer" : "default",
                      },
                      hover: {
                        fill: "#417a5a",
                        outline: "none",
                      },
                      pressed: {
                        fill: "#059669",
                        outline: "none",
                      },
                    }}
                  />

                  {/* State Abbreviation Label */}
                  {postal && (
                    <Marker coordinates={centroid}>
                      <text
                        textAnchor="middle"
                        style={{
                          fontFamily: "system-ui",
                          fill: "#212121",
                          fontSize: 15,
                          fontWeight: 600,
                          pointerEvents: "none",
                        }}
                      >
                        {postal}
                      </text>
                    </Marker>
                  )}
                </g>
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}