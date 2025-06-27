import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

interface MapProps {
  latitude: string;
  longitude: string;
  city: string;
  country: string;
}

const Map = ({ latitude, longitude, city, country }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const initializeMap = async () => {
    if (!mapContainer.current || !accessToken.trim()) {
      setError('Please enter a valid Mapbox token');
      return;
    }

    // Validate token format
    if (!accessToken.startsWith('pk.')) {
      setError('Invalid token format. Mapbox tokens start with "pk."');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Clean up existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      mapboxgl.accessToken = accessToken;
      
      // Test the token by creating a map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [Number(longitude), Number(latitude)],
        zoom: 10,
      });

      // Wait for the map to load
      await new Promise((resolve, reject) => {
        if (!map.current) {
          reject(new Error('Map initialization failed'));
          return;
        }

        map.current.on('load', resolve);
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          reject(new Error('Failed to load map. Please check your token.'));
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Map loading timed out. Please check your connection.'));
        }, 10000);
      });

      // Add marker for server location
      new mapboxgl.Marker({
        color: '#10b981', // green color to match the theme
      })
        .setLngLat([Number(longitude), Number(latitude)])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div class="p-2"><strong>${city}, ${country}</strong><br/>Server Location</div>`)
        )
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      setIsTokenSet(true);
      setError('');
    } catch (err) {
      console.error('Error initializing map:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map';
      setError(errorMessage);
      
      // Clean up on error
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up on unmount or when coordinates change
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Reset map when coordinates change
  useEffect(() => {
    if (isTokenSet && map.current) {
      map.current.setCenter([Number(longitude), Number(latitude)]);
      
      // Update marker
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
      
      new mapboxgl.Marker({
        color: '#10b981',
      })
        .setLngLat([Number(longitude), Number(latitude)])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div class="p-2"><strong>${city}, ${country}</strong><br/>Server Location</div>`)
        )
        .addTo(map.current);
    }
  }, [latitude, longitude, city, country, isTokenSet]);

  if (!isTokenSet) {
    return (
      <div className="bg-muted rounded-lg h-96 flex flex-col items-center justify-center p-6">
        <MapPin className="h-12 w-12 mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-4 text-center">
          Enter your Mapbox public token to display the server location
        </p>
        <div className="w-full max-w-md space-y-3">
          <Input
            type="text"
            placeholder="pk.eyJ1Ijoi..."
            value={accessToken}
            onChange={(e) => {
              setAccessToken(e.target.value);
              setError(''); // Clear error when typing
            }}
            className="font-mono text-sm"
            disabled={isLoading}
          />
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <Button 
            onClick={initializeMap}
            disabled={!accessToken.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading Map...
              </>
            ) : (
              'Load Map'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Get your token at{' '}
          <a 
            href="https://account.mapbox.com/access-tokens/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com/account
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg h-96 overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default Map;