'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface LocationData {
  street_address: string
  house_number: string
  city: string
  delivery_region: string
  latitude?: number
  longitude?: number
  ghana_post_gps?: string
}

interface LocationPickerProps {
  onLocationSelect: (data: LocationData) => void
  initialAddress?: string
}

export default function LocationPicker({ onLocationSelect, initialAddress }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [searchInput, setSearchInput] = useState(initialAddress || '')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const extractAddressComponents = (
    components: google.maps.GeocoderAddressComponent[],
    lat: number,
    lng: number,
    formattedAddressFallback?: string
  ) => {
    let streetNumber = ''
    let route = ''
    let city = ''
    let region = ''

    console.log('[LocationPicker] address_components:', components.map(c => ({ types: c.types, long_name: c.long_name })))

    components.forEach(component => {
      const types = component.types
      if (types.includes('street_number')) streetNumber = component.long_name
      if (types.includes('route')) route = component.long_name
      if (types.includes('neighborhood') ||
          types.includes('sublocality_level_2') ||
          types.includes('sublocality_level_1')) {
        if (!route) route = component.long_name
      }
      if (types.includes('locality')) city = component.long_name
      if (types.includes('sublocality_level_1') && !city) {
        city = component.long_name
      }
      if (types.includes('administrative_area_level_1')) {
        region = component.long_name
      }
      if (types.includes('premise') || types.includes('point_of_interest')) {
        if (!streetNumber) streetNumber = component.long_name
      }
    })

    const regionMap: Record<string, string> = {
      'Greater Accra': 'Greater Accra',
      'Ashanti': 'Ashanti',
      'Western': 'Western',
      'Eastern': 'Eastern',
      'Central': 'Central',
      'Northern': 'Northern',
      'Upper East': 'Upper East',
      'Upper West': 'Upper West',
      'Volta': 'Volta',
      'Brong-Ahafo': 'Brong-Ahafo',
      'Oti': 'Oti',
      'Bono': 'Bono',
      'Bono East': 'Bono East',
      'Ahafo': 'Ahafo',
      'Savannah': 'Savannah',
      'North East': 'North East',
    }

    let country = ''
    components.forEach(component => {
      if (component.types.includes('country')) {
        country = component.short_name
      }
    })

    let finalRegion = ''

    if (country !== 'GH') {
      finalRegion = 'International'
    } else {
      finalRegion = Object.entries(regionMap).find(([key]) =>
        region.includes(key)
      )?.[1] || ''
    }

    onLocationSelect({
      street_address: route || (formattedAddressFallback ? formattedAddressFallback.split(',')[0] : '') || '',
      house_number: streetNumber || '',
      city: city || '',
      delivery_region: finalRegion,
      latitude: lat,
      longitude: lng,
    })
  }

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const formatted = results[0].formatted_address
        extractAddressComponents(results[0].address_components, lat, lng, formatted)
        setSearchInput(formatted)
      }
    })
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }

    setLocating(true)
    setLocError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        if (map && marker) {
          map.setCenter(loc)
          map.setZoom(17)
          marker.setPosition(loc)
          reverseGeocode(loc.lat, loc.lng)
        }
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocError('Location access denied. Please enable location in your browser settings, or search for your address above.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocError('Location unavailable. Please search for your address.')
        } else {
          setLocError('Could not get your location. Please search manually.')
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'geocoding'],
    })

    loader.load().then(() => {
      if (!mapRef.current) return

      const defaultCenter = { lat: 5.6037, lng: -0.1870 }

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      })

      const markerInstance = new google.maps.Marker({
        map: mapInstance,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#0D3B2A',
          fillOpacity: 1,
          strokeColor: '#F4C430',
          strokeWeight: 3,
        },
      })

      if (searchRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
          componentRestrictions: { country: 'gh' },
          fields: ['address_components', 'geometry', 'name'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry?.location) return

          const location = place.geometry.location
          mapInstance.setCenter(location)
          mapInstance.setZoom(17)
          markerInstance.setPosition(location)

          extractAddressComponents(
            place.address_components || [],
            location.lat(),
            location.lng()
          )
        })
      }

      mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        markerInstance.setPosition(e.latLng)
        reverseGeocode(e.latLng.lat(), e.latLng.lng())
      })

      markerInstance.addListener('dragend', () => {
        const pos = markerInstance.getPosition()
        if (pos) reverseGeocode(pos.lat(), pos.lng())
      })

      setMap(mapInstance)
      setMarker(markerInstance)
      setIsLoading(false)

      getCurrentLocation()
    }).catch(() => {
      setError('Failed to load map. Please enter address manually.')
      setIsLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          ref={searchRef}
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for your location..."
          className="w-full px-4 py-3 pr-10 rounded-xl border border-[#E6D8BD]
                     bg-white text-[#0D3B2A] text-sm focus:outline-none
                     focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32]"
        />
        <svg
          className="absolute right-3 top-3.5 w-4 h-4 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Map */}
      {error ? (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-[#E6D8BD]">
          {isLoading && (
            <div className="absolute inset-0 bg-[#FAF7F0] flex items-center justify-center z-10">
              <div className="w-6 h-6 border-2 border-[#0D3B2A] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={mapRef} style={{ height: '250px', width: '100%' }} />
        </div>
      )}

      {/* Use current location button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 py-2.5
                   rounded-xl border-2 border-[#0D3B2A] text-[#0D3B2A]
                   font-semibold text-sm hover:bg-[#0D3B2A]/5
                   transition-colors disabled:opacity-60
                   disabled:cursor-not-allowed"
      >
        {locating ? (
          <>
            <div className="w-4 h-4 border-2 border-[#0D3B2A]
                            border-t-transparent rounded-full animate-spin"/>
            Getting your location...
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
            </svg>
            Use My Current Location
          </>
        )}
      </button>
      {locError && (
        <p className="text-xs text-red-500 text-center mt-1">{locError}</p>
      )}
    </div>
  )
}
