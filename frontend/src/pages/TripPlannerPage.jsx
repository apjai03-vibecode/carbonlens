import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import { useAuth } from '../context/AuthContext';
import { saveActivityLog } from '../firebase';
import { MapPin, Search, Navigation, Car, Bus, Bike, Footprints, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

// Sub-component to render route polyline on Map canvas
function DirectionsRendererComponent({ directions }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [renderer, setRenderer] = useState(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    const dirRenderer = new routesLibrary.DirectionsRenderer({ map });
    setRenderer(dirRenderer);
    return () => {
      dirRenderer.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!renderer || !directions) return;
    renderer.setDirections(directions);

    // Zoom and pan the map to fit the route bounds
    if (directions.routes && directions.routes.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      const route = directions.routes[0];
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          step.path.forEach(latLng => {
            bounds.extend(latLng);
          });
        });
      });
      map.fitBounds(bounds);
    }
  }, [renderer, directions, map]);

  return null;
}

export default function TripPlannerPage() {
  const { user } = useAuth();
  const { isLoaded, apiKeySet, getSimulatedRoute } = useGoogleMaps();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeResults, setRouteResults] = useState(null);
  const [logSuccess, setLogSuccess] = useState(null);
  const [drivingDirections, setDrivingDirections] = useState(null);

  const originInputRef = useRef(null);
  const destInputRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Setup Autocomplete if Google Maps is loaded
  useEffect(() => {
    if (isLoaded && window.google && apiKeySet) {
      const originAutocomplete = new window.google.maps.places.Autocomplete(originInputRef.current, {
        types: ['geocode', 'establishment']
      });
      originAutocomplete.addListener('place_changed', () => {
        const place = originAutocomplete.getPlace();
        if (place && place.formatted_address) {
          setOrigin(place.formatted_address);
        } else if (place && place.name) {
          setOrigin(place.name);
        }
      });

      const destAutocomplete = new window.google.maps.places.Autocomplete(destInputRef.current, {
        types: ['geocode', 'establishment']
      });
      destAutocomplete.addListener('place_changed', () => {
        const place = destAutocomplete.getPlace();
        if (place && place.formatted_address) {
          setDestination(place.formatted_address);
        } else if (place && place.name) {
          setDestination(place.name);
        }
      });
    }
  }, [isLoaded, apiKeySet]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    setLoading(true);
    setLogSuccess(null);
    setDrivingDirections(null);

    if (isLoaded && window.google && apiKeySet) {
      const directionsService = new window.google.maps.DirectionsService();
      const distanceMatrixService = new window.google.maps.DistanceMatrixService();

      try {
        const fetchRoute = (mode) => {
          return new Promise((resolve, reject) => {
            directionsService.route(
              {
                origin: origin,
                destination: destination,
                travelMode: window.google.maps.TravelMode[mode],
              },
              (result, status) => {
                if (status === 'OK') {
                  resolve(result);
                } else {
                  reject(new Error(`Failed to fetch ${mode} route: ${status}`));
                }
              }
            );
          });
        };

        // Try to fetch driving route first to get geometry
        const drivingResult = await fetchRoute('DRIVING');
        setDrivingDirections(drivingResult);

        // Fetch transit route
        let transitResult = null;
        try {
          transitResult = await fetchRoute('TRANSIT');
        } catch (e) {
          console.warn('Transit route not available:', e);
        }

        // Fetch bicycling route
        let bicyclingResult = null;
        try {
          bicyclingResult = await fetchRoute('BICYCLING');
        } catch (e) {
          console.warn('Bicycling route not available:', e);
        }

        // Fetch walking route
        let walkingResult = null;
        try {
          walkingResult = await fetchRoute('WALKING');
        } catch (e) {
          console.warn('Walking route not available:', e);
        }

        // Parse distances & durations
        const getRouteDetails = (result, co2Factor) => {
          if (!result) return null;
          const leg = result.routes[0].legs[0];
          const distKm = +(leg.distance.value / 1000).toFixed(1);
          const distMiles = +(distKm * 0.621371).toFixed(1);
          const durationMins = Math.round(leg.duration.value / 60);
          return {
            distanceKm: distKm,
            distanceMiles: distMiles,
            durationMinutes: durationMins,
            co2Kg: +(distKm * co2Factor).toFixed(2),
          };
        };

        const parsedDriving = getRouteDetails(drivingResult, 0.192); // 0.192 kg CO2/km

        // Use DistanceMatrixService to fetch live traffic times for driving if available
        try {
          const matrixResponse = await new Promise((resolve, reject) => {
            distanceMatrixService.getDistanceMatrix(
              {
                origins: [origin],
                destinations: [destination],
                travelMode: window.google.maps.TravelMode.DRIVING,
                drivingOptions: {
                  departureTime: new Date(),
                  trafficModel: 'bestguess',
                },
              },
              (response, status) => {
                if (status === 'OK') resolve(response);
                else reject(new Error(`Distance Matrix failed: ${status}`));
              }
            );
          });
          const element = matrixResponse.rows[0].elements[0];
          if (element && element.status === 'OK') {
            const trafficDurationMins = Math.round(
              element.duration_in_traffic ? element.duration_in_traffic.value / 60 : element.duration.value / 60
            );
            parsedDriving.durationMinutes = trafficDurationMins;
          }
        } catch (matrixErr) {
          console.warn('Distance Matrix Service skipped:', matrixErr);
        }

        const parsedTransit = getRouteDetails(transitResult, 0.105) || {
          distanceKm: +(parsedDriving.distanceKm * 1.1).toFixed(1),
          distanceMiles: +(parsedDriving.distanceMiles * 1.1).toFixed(1),
          durationMinutes: Math.round(parsedDriving.durationMinutes * 1.8),
          co2Kg: +(parsedDriving.distanceKm * 1.1 * 0.105).toFixed(2),
        };
        const parsedCycling = getRouteDetails(bicyclingResult, 0) || {
          distanceKm: parsedDriving.distanceKm,
          distanceMiles: parsedDriving.distanceMiles,
          durationMinutes: Math.round(parsedDriving.distanceKm * 3.5),
          co2Kg: 0,
        };
        const parsedWalking = getRouteDetails(walkingResult, 0) || {
          distanceKm: parsedDriving.distanceKm,
          distanceMiles: parsedDriving.distanceMiles,
          durationMinutes: Math.round(parsedDriving.distanceKm * 12),
          co2Kg: 0,
        };

        setRouteResults({
          origin: drivingResult.routes[0].legs[0].start_address || origin,
          destination: drivingResult.routes[0].legs[0].end_address || destination,
          routes: {
            driving: parsedDriving,
            transit: parsedTransit,
            cycling: parsedCycling,
            walking: parsedWalking,
          }
        });
      } catch (err) {
        console.error("Maps Service Error:", err);
        fallbackToSimulation();
      } finally {
        setLoading(false);
      }
    } else {
      // Direct simulation if API Key is not set or loaded
      setTimeout(() => {
        fallbackToSimulation();
        setLoading(false);
      }, 1000);
    }
  };

  const fallbackToSimulation = () => {
    const sim = getSimulatedRoute(origin, destination);
    setRouteResults(sim);
  };

  const handleLogTrip = async (modeKey, details) => {
    if (!user) return;
    setLogSuccess(null);

    const modeLabels = {
      driving: 'Car (petrol) trip',
      transit: 'Public transit trip',
      cycling: 'Bicycle trip',
      walking: 'Walking trip'
    };

    const activityKeys = {
      driving: 'car_petrol',
      transit: 'bus',
      cycling: 'bike_walk',
      walking: 'bike_walk'
    };

    try {
      const payload = {
        category: 'transport',
        activity: activityKeys[modeKey],
        activityLabel: `Commute: ${modeLabels[modeKey]} from ${routeResults.origin.split(',')[0]} to ${routeResults.destination.split(',')[0]}`,
        quantity: details.distanceKm,
        unit: 'km',
        co2Kg: details.co2Kg,
        date: new Date().toISOString(),
      };

      await saveActivityLog(user.uid, payload);
      setLogSuccess(modeKey);

      // Reset success banner after 3 seconds
      setTimeout(() => {
        setLogSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to log trip:", error);
    }
  };

  const getSmartphoneSaving = (drivingCo2, modeCo2) => {
    const saved = drivingCo2 - modeCo2;
    if (saved <= 0) return 0;
    return Math.round(saved * 121); // 121 phones per kg CO2 saved
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Eco-Trip Planner</h2>
        <p className="text-slate-500 text-sm mt-1">Calculate route distances and compare carbon impact across transit modes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Route Information</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="origin-input" className="text-xs font-semibold text-slate-500 block mb-1">Starting Point</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="origin-input"
                    aria-label="Starting Point"
                    ref={originInputRef}
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Enter starting address..."
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="destination-input" className="text-xs font-semibold text-slate-500 block mb-1">Destination</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="destination-input"
                    aria-label="Destination"
                    ref={destInputRef}
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination address..."
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl py-3 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="border-2 border-white/20 border-t-white h-4 w-4 rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Calculate Routes</span>
                  </>
                )}
              </button>
            </form>

            {!apiKeySet && (
              <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-emerald-800 text-xs">
                <AlertTriangle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Demo Mode Active:</strong> Google Maps key is not set. Real-world distances will be beautifully simulated deterministically based on locations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comparison Matrix & Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Display */}
          <div className="w-full h-64 md:h-80 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative shadow-sm">
            {isLoaded && apiKeySet && apiKey ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={{ lat: 40.7128, lng: -74.0060 }}
                  defaultZoom={12}
                  gestureHandling={'cooperative'}
                  disableDefaultUI={true}
                >
                  <DirectionsRendererComponent directions={drivingDirections} />
                </Map>
              </APIProvider>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 h-full">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600">
                  <Navigation className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Interactive Map Mode</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                  {apiKeySet
                    ? 'Map is loading...'
                    : 'Provide a VITE_GOOGLE_MAPS_API_KEY in your env file to view interactive routing tiles.'}
                </p>
              </div>
            )}
          </div>

          {/* Comparison Matrix */}
          {routeResults && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 font-bold">Route Options comparison</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <span>From: {routeResults.origin}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span>To: {routeResults.destination}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driving Option */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-all bg-slate-50/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Personal Drive</h4>
                        <p className="text-xs text-slate-400">Petrol Car (Baseline)</p>
                      </div>
                    </div>
                    <span className="text-rose-600 bg-rose-50 text-xs font-bold px-2 py-0.5 rounded">Highest emissions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.driving.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.driving.durationMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Emitted</p>
                      <p className="text-sm font-bold text-rose-600">{routeResults.routes.driving.co2Kg} kg</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLogTrip('driving', routeResults.routes.driving)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                  >
                    {logSuccess === 'driving' ? <Check className="h-4 w-4 text-emerald-600" /> : 'Log This Trip'}
                  </button>
                </div>

                {/* Public Transit Option */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-all bg-slate-50/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Public Transit</h4>
                        <p className="text-xs text-slate-400">Bus / Metro Network</p>
                      </div>
                    </div>
                    {getSmartphoneSaving(routeResults.routes.driving.co2Kg, routeResults.routes.transit.co2Kg) > 0 && (
                      <span className="text-emerald-600 bg-emerald-50 text-xs font-bold px-2 py-0.5 rounded">Eco Friendly</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.transit.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.transit.durationMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Emitted</p>
                      <p className="text-sm font-bold text-sky-600">{routeResults.routes.transit.co2Kg} kg</p>
                    </div>
                  </div>
                  <div className="text-center text-[10px] text-emerald-600 font-semibold mb-3 leading-snug">
                    🌿 Saves equivalent of charging {getSmartphoneSaving(routeResults.routes.driving.co2Kg, routeResults.routes.transit.co2Kg)} smartphones!
                  </div>
                  <button
                    onClick={() => handleLogTrip('transit', routeResults.routes.transit)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                  >
                    {logSuccess === 'transit' ? <Check className="h-4 w-4 text-emerald-600" /> : 'Log This Trip'}
                  </button>
                </div>

                {/* Cycling Option */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-all bg-slate-50/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <Bike className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Cycling</h4>
                        <p className="text-xs text-slate-400">Active Travel</p>
                      </div>
                    </div>
                    <span className="text-emerald-700 bg-emerald-100 text-xs font-bold px-2 py-0.5 rounded">Zero Carbon</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.cycling.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.cycling.durationMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Emitted</p>
                      <p className="text-sm font-bold text-emerald-600">0.0 kg</p>
                    </div>
                  </div>
                  <div className="text-center text-[10px] text-emerald-600 font-semibold mb-3 leading-snug">
                    🌿 Saves equivalent of charging {getSmartphoneSaving(routeResults.routes.driving.co2Kg, routeResults.routes.cycling.co2Kg)} smartphones!
                  </div>
                  <button
                    onClick={() => handleLogTrip('cycling', routeResults.routes.cycling)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                  >
                    {logSuccess === 'cycling' ? <Check className="h-4 w-4 text-emerald-600" /> : 'Log This Trip'}
                  </button>
                </div>

                {/* Walking Option */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-all bg-slate-50/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <Footprints className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Walking</h4>
                        <p className="text-xs text-slate-400">Active Travel</p>
                      </div>
                    </div>
                    <span className="text-emerald-700 bg-emerald-100 text-xs font-bold px-2 py-0.5 rounded">Zero Carbon</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.walking.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                      <p className="text-sm font-bold text-slate-700">{routeResults.routes.walking.durationMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Emitted</p>
                      <p className="text-sm font-bold text-emerald-600">0.0 kg</p>
                    </div>
                  </div>
                  <div className="text-center text-[10px] text-emerald-600 font-semibold mb-3 leading-snug">
                    🌿 Saves equivalent of charging {getSmartphoneSaving(routeResults.routes.driving.co2Kg, routeResults.routes.walking.co2Kg)} smartphones!
                  </div>
                  <button
                    onClick={() => handleLogTrip('walking', routeResults.routes.walking)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                  >
                    {logSuccess === 'walking' ? <Check className="h-4 w-4 text-emerald-600" /> : 'Log This Trip'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
