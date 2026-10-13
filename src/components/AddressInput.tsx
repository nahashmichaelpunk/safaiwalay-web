/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loadGoogleMapsApi } from '@/lib/googleMapsLoader';

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onLocationChange?: (lat: number, lng: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const LEGACY_INPUT_REF_MAX_FRAMES = 45;

async function waitForRef<T>(
  getRef: () => T | null,
  cancelled: () => boolean
): Promise<T | null> {
  for (let i = 0; i < LEGACY_INPUT_REF_MAX_FRAMES; i++) {
    if (cancelled()) return null;
    const node = getRef();
    if (node) return node;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return null;
}

export default function AddressInput({
  value,
  onChange,
  onLocationChange,
  label,
  placeholder = 'Start typing your address',
  required = false,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const placeElementRef = useRef<(HTMLElement & { value?: string }) | null>(null);
  const onChangeRef = useRef(onChange);
  const onLocationChangeRef = useRef(onLocationChange);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usePlaceElement, setUsePlaceElement] = useState(false);
  const [initAttempt, setInitAttempt] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
    onLocationChangeRef.current = onLocationChange;
  }, [onChange, onLocationChange]);

  // Runs on mount and when user clicks Retry. label/placeholder/value sync is handled by separate effects below.
  useEffect(() => {
    let cancelled = false;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let removeListener: (() => void) | null = null;

    const initializeAutocomplete = async () => {
      try {
        setIsLoading(true);
        await loadGoogleMapsApi();
        if (cancelled) return;

        setError(null);

        const places = google.maps.places as unknown as {
          PlaceAutocompleteElement?: new (options?: Record<string, unknown>) => HTMLElement;
        };
        const PlaceAutocompleteElement = places?.PlaceAutocompleteElement;

        const canUsePlaceElement =
          Boolean(PlaceAutocompleteElement) && Boolean(autocompleteContainerRef.current);

        if (canUsePlaceElement) {
          const element = new PlaceAutocompleteElement!({
            componentRestrictions: { country: 'IN' },
          }) as HTMLElement & { value?: string };
          placeElementRef.current = element;
          element.setAttribute('style', 'width: 100%;');
          element.setAttribute('placeholder', placeholder);
          if (label) {
            element.setAttribute('aria-label', label);
          }
          if (value) {
            element.value = value;
          }

          const handleSelect = async (event: Event) => {
            const eventData = event as Event & {
              placePrediction?: {
                toPlace?: () => {
                  fetchFields?: (arg: { fields: string[] }) => Promise<void>;
                  formattedAddress?: string;
                  location?: { lat?: () => number; lng?: () => number };
                };
              };
              detail?: {
                placePrediction?: {
                  toPlace?: () => {
                    fetchFields?: (arg: { fields: string[] }) => Promise<void>;
                    formattedAddress?: string;
                    location?: { lat?: () => number; lng?: () => number };
                  };
                };
              };
            };
            const prediction = eventData.placePrediction ?? eventData.detail?.placePrediction;
            const place = prediction?.toPlace?.();
            if (!place?.fetchFields) return;
            await place.fetchFields({ fields: ['formattedAddress', 'location'] });
            if (place.formattedAddress) {
              onChangeRef.current(place.formattedAddress);
            }
            const locCb = onLocationChangeRef.current;
            if (locCb && place.location?.lat && place.location?.lng) {
              locCb(place.location.lat(), place.location.lng());
            }
          };

          element.addEventListener('gmp-placeselect', handleSelect as EventListener);
          element.addEventListener('gmp-select', handleSelect as EventListener);
          removeListener = () => {
            element.removeEventListener('gmp-placeselect', handleSelect as EventListener);
            element.removeEventListener('gmp-select', handleSelect as EventListener);
          };
          autocompleteContainerRef.current!.innerHTML = '';
          autocompleteContainerRef.current!.appendChild(element);
          setUsePlaceElement(true);
          setIsLoading(false);
          return;
        }

        const inputEl = await waitForRef(() => inputRef.current, () => cancelled);
        if (cancelled) return;

        if (!inputEl) {
          setUsePlaceElement(false);
          setError('Address input unavailable. Try Retry or reload the page.');
          setIsLoading(false);
          return;
        }

        autocomplete = new google.maps.places.Autocomplete(inputEl, {
          types: ['address'],
          componentRestrictions: { country: 'IN' },
          fields: ['formatted_address', 'geometry'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete?.getPlace();
          if (!place?.formatted_address) return;
          onChangeRef.current(place.formatted_address);
          const locCb = onLocationChangeRef.current;
          if (locCb && place.geometry?.location) {
            locCb(place.geometry.location.lat(), place.geometry.location.lng());
          }
        });
        setUsePlaceElement(false);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to load address autocomplete');
        setUsePlaceElement(false);
        setIsLoading(false);
      }
    };

    initializeAutocomplete();

    return () => {
      cancelled = true;
      if (removeListener) removeListener();
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
      if (placeElementRef.current?.parentNode) {
        placeElementRef.current.parentNode.removeChild(placeElementRef.current);
      }
      placeElementRef.current = null;
    };
  }, [initAttempt]);

  useEffect(() => {
    const el = placeElementRef.current;
    if (!el || !usePlaceElement) return;
    if (el.value !== value) el.value = value;
  }, [value, usePlaceElement]);

  useEffect(() => {
    const el = placeElementRef.current;
    if (!el || !usePlaceElement) return;
    el.setAttribute('placeholder', placeholder);
    if (label) el.setAttribute('aria-label', label);
    else el.removeAttribute('aria-label');
  }, [placeholder, label, usePlaceElement]);

  const handleRetryInit = () => {
    setError(null);
    setUsePlaceElement(false);
    setIsLoading(true);
    setInitAttempt((n) => n + 1);
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {(isLoading || !usePlaceElement) && (
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isLoading ? 'Loading...' : placeholder}
          disabled={isLoading && !error}
          required={required}
        />
      )}
      <div
        ref={autocompleteContainerRef}
        className={!usePlaceElement || isLoading ? 'hidden' : ''}
      />
      {error && (
        <Button type="button" variant="outline" size="sm" onClick={handleRetryInit}>
          Retry address lookup
        </Button>
      )}
    </div>
  );
}
