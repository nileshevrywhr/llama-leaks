import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, AlertCircle, ExternalLink } from "lucide-react";

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
    if (!mapContainer.current) {
      setError('Map container not available');
      return;
    }

    const trimmedToken = accessToken.trim();
    if (!trimmedToken) {
      setError('Please enter your Mapbox access token');
      return;
    }

    // Basic token format validation - Mapbox tokens should start with 'pk.' for public tokens
    if (!trimmedToken.startsWith('pk.')) {
      setError('Invalid token format. Public Mapbox tokens start with "pk."');
      return;
    }

    // Check minimum token length (Mapbox tokens are typically quite long)
    if (trimmedToken.length < 50) {
      setError('Token appears to be incomplete. Please check your token.');
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

      mapboxgl.accessToken = trimmedToken;
      
      // Create the map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [Number(longitude), Number(latitude)],
        zoom: 10,
      });

      // Wait for the map to load or error
      await new Promise<void>((resolve, reject) => {
        if (!map.current) {
          reject(new Error('Map initialization failed'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Map loading timed out. Please check your internet connection.'));
        }, 15000);

        map.current.on('load', () => {
          clearTimeout(timeoutId);
          resolve();
        });

        map.current.on('error', (e) => {
          clearTimeout(timeoutId);
          console.error('Mapbox error:', e);
          
          // Provide more specific error messages based on the error
          if (e.error?.message?.includes('Unauthorized') || e.error?.status === 401) {
            reject(new Error('Invalid or unauthorized token. Please check your Mapbox access token.'));
          } else if (e.error?.message?.includes('rate limit') || e.error?.status === 429) {
            reject(new Error('Rate limit exceeded. Please try again later.'));
          } else if (e.error?.status === 403) {
            reject(new Error('Access forbidden. Please check your token permissions.'));
          } else {
            reject(new Error(`Map error: ${e.error?.message || 'Unknown error occurred'}`));
          }
        });
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
          Enter your Mapbox public access token to display the server location
        </p>
        <div className="w-full max-w-md space-y-3">
          <div className="space-y-2">
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
            <p className="text-xs text-muted-foreground">
              Your token should start with "pk." and be about 100+ characters long
            </p>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Need a token? Get one for free at:
          </p>
          <a 
            href="https://account.mapbox.com/access-tokens/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            mapbox.com/account/access-tokens
          </a>
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border">
            <strong>Tip:</strong> Create a new token with "Public scopes" selected
          </div>
        </div>
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