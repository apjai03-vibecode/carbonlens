import React, { createContext, useContext, useEffect, useState } from 'react';

const GoogleMapsContext = createContext(null);

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export function GoogleMapsProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [apiKeySet, setApiKeySet] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || apiKey.trim() === '') {
      setApiKeySet(false);
      setIsLoaded(true); // Treat as loaded in "simulation mode"
      return;
    }

    setApiKeySet(true);

    // If script is already in document, don't add it again
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      const handleLoad = () => setIsLoaded(true);
      const handleError = (e) => {
        console.error('Google Maps API script load error:', e);
        setLoadError('Failed to load Google Maps API script.');
      };

      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      document.head.appendChild(script);

      return () => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };
    }
  }, [apiKey]);

  // Helper function to calculate simulated route details
  const getSimulatedRoute = (origin, destination) => {
    // Generate deterministic numbers based on input length/characters
    const combineStr = (origin + destination).toLowerCase().replace(/[^a-z]/g, '');
    let hash = 0;
    for (let i = 0; i < combineStr.length; i++) {
      hash = combineStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash);
    const baseDistance = 3 + (val % 22); // 3 to 25 miles/km

    return {
      origin,
      destination,
      routes: {
        driving: {
          distanceKm: +(baseDistance * 1.2).toFixed(1),
          distanceMiles: +((baseDistance * 1.2) * 0.621371).toFixed(1),
          durationMinutes: Math.round(baseDistance * 1.8),
          co2Kg: +(baseDistance * 1.2 * 0.192).toFixed(2), // 0.192kg CO2 per km for petrol car
        },
        transit: {
          distanceKm: +(baseDistance * 1.3).toFixed(1),
          distanceMiles: +((baseDistance * 1.3) * 0.621371).toFixed(1),
          durationMinutes: Math.round(baseDistance * 3.2),
          co2Kg: +(baseDistance * 1.3 * 0.105).toFixed(2), // 0.105kg CO2 per km for bus
        },
        cycling: {
          distanceKm: +(baseDistance * 0.95).toFixed(1),
          distanceMiles: +((baseDistance * 0.95) * 0.621371).toFixed(1),
          durationMinutes: Math.round(baseDistance * 4.5),
          co2Kg: 0,
        },
        walking: {
          distanceKm: +(baseDistance * 0.9).toFixed(1),
          distanceMiles: +((baseDistance * 0.9) * 0.621371).toFixed(1),
          durationMinutes: Math.round(baseDistance * 12.0),
          co2Kg: 0,
        }
      }
    };
  };

  const value = {
    isLoaded,
    loadError,
    apiKeySet,
    getSimulatedRoute,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
