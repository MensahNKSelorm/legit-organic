"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface LocationData {
  street_address: string;
  house_number: string;
  city: string;
  delivery_region: string;
  latitude?: number;
  longitude?: number;
  ghana_post_gps?: string;
}

interface LocationPickerProps {
  onLocationSelect: (data: LocationData) => void;
  initialAddress?: string;
  appearance?: "default" | "embedded";
}

export default function LocationPicker({
  onLocationSelect,
  initialAddress,
  appearance = "default",
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const searchInputId = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [searchInput, setSearchInput] = useState(initialAddress || "");
  const [isLoading, setIsLoading] = useState(Boolean(apiKey));
  const [error, setError] = useState(
    apiKey ? "" : "Map is temporarily unavailable. Please enter the delivery address manually."
  );
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const extractAddressComponents = (
    components: google.maps.GeocoderAddressComponent[],
    lat: number,
    lng: number,
    formattedAddressFallback?: string
  ) => {
    let streetNumber = "";
    let route = "";
    let city = "";
    let region = "";

    components.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) streetNumber = component.long_name;
      if (types.includes("route")) route = component.long_name;
      if (
        types.includes("neighborhood") ||
        types.includes("sublocality_level_2") ||
        types.includes("sublocality_level_1")
      ) {
        if (!route) route = component.long_name;
      }
      if (types.includes("locality")) city = component.long_name;
      if (types.includes("sublocality_level_1") && !city) {
        city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        region = component.long_name;
      }
      if (types.includes("premise") || types.includes("point_of_interest")) {
        if (!streetNumber) streetNumber = component.long_name;
      }
    });

    const regionMap: Record<string, string> = {
      "Greater Accra": "Greater Accra",
      Ashanti: "Ashanti",
      Western: "Western",
      Eastern: "Eastern",
      Central: "Central",
      Northern: "Northern",
      "Upper East": "Upper East",
      "Upper West": "Upper West",
      Volta: "Volta",
      "Brong-Ahafo": "Brong-Ahafo",
      Oti: "Oti",
      Bono: "Bono",
      "Bono East": "Bono East",
      Ahafo: "Ahafo",
      Savannah: "Savannah",
      "North East": "North East",
    };

    let country = "";
    components.forEach((component) => {
      if (component.types.includes("country")) {
        country = component.short_name;
      }
    });

    let finalRegion = "";

    if (country !== "GH") {
      finalRegion = "International";
    } else {
      finalRegion = Object.entries(regionMap).find(([key]) => region.includes(key))?.[1] || "";
    }

    onLocationSelect({
      street_address:
        route || (formattedAddressFallback ? formattedAddressFallback.split(",")[0] : "") || "",
      house_number: streetNumber || "",
      city: city || "",
      delivery_region: finalRegion,
      latitude: lat,
      longitude: lng,
    });
  };

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const formatted = results[0].formatted_address;
        extractAddressComponents(results[0].address_components, lat, lng, formatted);
        setSearchInput(formatted);
      }
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (map && marker) {
          map.setCenter(loc);
          map.setZoom(17);
          marker.setPosition(loc);
          reverseGeocode(loc.lat, loc.lng);
        }
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocError(
            "Location access denied. Please enable location in your browser settings, or search for your address above."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocError("Location unavailable. Please search for your address.");
        } else {
          setLocError("Could not get your location. Please search manually.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (!apiKey) return;

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "geocoding"],
    });

    loader
      .load()
      .then(() => {
        if (!mapRef.current) return;

        const defaultCenter = { lat: 5.6037, lng: -0.187 };

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        const markerInstance = new google.maps.Marker({
          map: mapInstance,
          draggable: true,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#0D3B2A",
            fillOpacity: 1,
            strokeColor: "#F4C430",
            strokeWeight: 3,
          },
        });

        if (searchRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
            componentRestrictions: { country: "gh" },
            fields: ["address_components", "geometry", "name"],
          });

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;

            const location = place.geometry.location;
            mapInstance.setCenter(location);
            mapInstance.setZoom(17);
            markerInstance.setPosition(location);

            extractAddressComponents(
              place.address_components || [],
              location.lat(),
              location.lng()
            );
          });
        }

        mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          markerInstance.setPosition(e.latLng);
          reverseGeocode(e.latLng.lat(), e.latLng.lng());
        });

        markerInstance.addListener("dragend", () => {
          const pos = markerInstance.getPosition();
          if (pos) reverseGeocode(pos.lat(), pos.lng());
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsLoading(false);
      })
      .catch((loadError) => {
        console.error("Google Maps failed to load", loadError);
        setError("Map is temporarily unavailable. Please enter the delivery address manually.");
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmbedded = appearance === "embedded";
  const searchClass = isEmbedded
    ? "min-h-11 w-full border border-[#0D3B2A]/20 bg-[#FAF7F0] px-3.5 py-2.5 pr-10 text-sm text-[#0D3B2A] outline-2 outline-transparent placeholder:text-[#5B3E31]/55 transition-[border-color,background-color] hover:border-[#0D3B2A]/40 focus:border-[#2E7D32] focus:outline-none focus-visible:outline-[#F4C430] focus-visible:outline-offset-2 dark:border-white/15 dark:bg-[#222A24] dark:text-[#FAF7F0] dark:placeholder:text-[#B8D4BD]/55 dark:hover:border-white/30 dark:focus:border-[#F4C430]"
    : "w-full rounded-xl border border-[#E6D8BD] bg-white px-4 py-3 pr-10 text-sm text-[#0D3B2A] focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] focus:outline-none";
  const locationButtonClass = isEmbedded
    ? "flex min-h-11 w-full items-center justify-center gap-2 border border-[#0D3B2A]/30 px-4 py-2.5 text-sm font-semibold text-[#0D3B2A] transition-colors hover:border-[#0D3B2A] hover:bg-[#F5F0E6] focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-2 focus-visible:outline-none active:bg-[#E6D8BD]/55 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/25 dark:text-[#FAF7F0] dark:hover:border-white/45 dark:hover:bg-white/5 dark:active:bg-white/10"
    : "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0D3B2A] py-2.5 text-sm font-semibold text-[#0D3B2A] transition-colors hover:bg-[#0D3B2A]/5 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={isEmbedded ? "space-y-3 bg-[#FEFCF7] p-4 dark:bg-[#1D231F]" : "space-y-3"}>
      <div className="relative">
        <label htmlFor={searchInputId} className="sr-only">
          Search for your delivery location
        </label>
        <input
          id={searchInputId}
          ref={searchRef}
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for your location..."
          className={searchClass}
        />
        <svg
          className="absolute top-3.5 right-3 h-4 w-4 text-[#5B3E31]/55 dark:text-[#B8D4BD]/55"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {error ? (
        <div
          role="status"
          className={
            isEmbedded
              ? "border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
              : "rounded-xl bg-red-50 p-3 text-sm text-red-600"
          }
        >
          {error}
        </div>
      ) : (
        <div
          className={`relative overflow-hidden border border-[#E6D8BD] dark:border-white/15 ${isEmbedded ? "" : "rounded-xl"}`}
        >
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FAF7F0] dark:bg-[#222A24]">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-[#0D3B2A] border-t-transparent dark:border-[#F4C430] dark:border-t-transparent"
                role="status"
                aria-label="Loading map"
              />
            </div>
          )}
          <div ref={mapRef} style={{ height: "250px", width: "100%" }} />
        </div>
      )}

      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={locating}
        className={locationButtonClass}
      >
        {locating ? (
          <>
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-[#0D3B2A] border-t-transparent dark:border-[#F4C430] dark:border-t-transparent"
              aria-hidden
            />
            Getting your location...
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            </svg>
            Use My Current Location
          </>
        )}
      </button>
      {locError && (
        <p className="mt-1 text-center text-xs text-red-700 dark:text-red-300">{locError}</p>
      )}
    </div>
  );
}
