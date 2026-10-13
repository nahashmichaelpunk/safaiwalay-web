/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsApi } from '@/lib/googleMapsLoader';
import { Button } from '@/components/ui/button';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

type MarkerLike = google.maps.Marker | google.maps.marker.AdvancedMarkerElement;

function resolveMarkerLatLng(marker: MarkerLike): google.maps.LatLng | null {
  if (marker instanceof google.maps.Marker) {
    return marker.getPosition() ?? null;
  }
  const position = marker.position;
  if (!position) return null;
  if (position instanceof google.maps.LatLng) {
    return position;
  }
  if (typeof position.lat === 'number' && typeof position.lng === 'number') {
    return new google.maps.LatLng(position.lat, position.lng);
  }
  return null;
}

export default function MapPicker({
  onLocationSelect,
  initialLat = 21.1458,
  initialLng = 79.0882,
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<MarkerLike | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    setIsLoading(true);

    const notifyLocation = (lat: number, lng: number) => {
      onLocationSelectRef.current(lat, lng);
    };

    const initializeMap = async () => {
      try {
        await loadGoogleMapsApi();
        setError(null);

        if (!mapRef.current) {
          setIsLoading(false);
          return;
        }

        setIsLoading(false);

        const configuredMapId = import.meta.env.VITE_GOOGLE_MAP_ID?.trim();
        // Create the map
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          ...(configuredMapId ? { mapId: configuredMapId } : {}),
        });

        const canUseAdvancedMarker =
          Boolean(configuredMapId) &&
          Boolean(google.maps.marker?.AdvancedMarkerElement);

        // Create marker with graceful fallback.
        const markerInstance: MarkerLike = canUseAdvancedMarker
          ? new google.maps.marker.AdvancedMarkerElement({
              position: { lat: initialLat, lng: initialLng },
              map: mapInstance,
              gmpDraggable: true,
            })
          : new google.maps.Marker({
              position: { lat: initialLat, lng: initialLng },
              map: mapInstance,
              draggable: true,
            });

        notifyLocation(initialLat, initialLng);

        // Add click listener to map
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          const latLng = e.latLng;
          if (latLng) {
            if (markerInstance instanceof google.maps.Marker) {
              markerInstance.setPosition(latLng);
            } else {
              markerInstance.position = latLng;
            }
            notifyLocation(latLng.lat(), latLng.lng());
          }
        });

        // Add dragend listener to marker
        markerInstance.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            notifyLocation(event.latLng.lat(), event.latLng.lng());
            return;
          }
          const resolved = resolveMarkerLatLng(markerInstance);
          if (resolved) {
            notifyLocation(resolved.lat(), resolved.lng());
          }
        });

        mapInstanceRef.current = mapInstance;
        markerInstanceRef.current = markerInstance;
      } catch (error) {
        console.error('Error initializing map:', error);
        setError(error instanceof Error ? error.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      const marker = markerInstanceRef.current;
      const map = mapInstanceRef.current;
      if (marker) {
        google.maps.event.clearInstanceListeners(marker);
        if (marker instanceof google.maps.Marker) {
          marker.setMap(null);
        } else {
          marker.map = null;
        }
        markerInstanceRef.current = null;
      }
      if (map) {
        google.maps.event.clearInstanceListeners(map);
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
        <p className="text-red-500 mb-2">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-lg"
      style={{ opacity: isLoading ? 0.5 : 1 }}
    />
  );
} 