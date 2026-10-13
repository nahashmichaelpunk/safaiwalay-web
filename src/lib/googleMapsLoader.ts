// A utility to load Google Maps API once and provide a way to check if it's loaded

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

let isLoading = false;
let isLoaded = false;

export async function loadGoogleMapsApi(): Promise<void> {
  if (isLoaded) return;
  if (isLoading) {
    // Wait for the existing load to complete
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (isLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
    });
  }

  isLoading = true;

  return new Promise((resolve, reject) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key is not configured');
      }

      // Create callback function
      window.initGoogleMaps = () => {
        isLoaded = true;
        isLoading = false;
        resolve();
      };

      // Create script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places,marker&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Handle errors
      script.onerror = () => {
        isLoading = false;
        reject(new Error('Failed to load Google Maps script'));
      };

      // Add script to document
      document.head.appendChild(script);
    } catch (error) {
      isLoading = false;
      reject(error);
    }
  });
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded;
} 