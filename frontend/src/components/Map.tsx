import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const waitForContainer = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const checkContainer = () => {
        if (mapContainer.current && mapContainer.current.offsetWidth > 0 && mapContainer.current.offsetHeight > 0) {
          resolve();
        } else {
          setTimeout(checkContainer, 100);
        }
      };
      
      // Start checking immediately
      checkContainer();
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Map container failed to become available'));
      }, 5000);
    });
  };

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Wait for container to be available
      await waitForContainer();

      if (!mapContainer.current) {
        throw new Error('Map container not available after waiting');
      }

      // Get token from environment variables
      const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
      
      if (!accessToken) {
        throw new Error('Mapbox token not configured. Please add VITE_MAPBOX_TOKEN to your environment variables.');
      }

      // Clean up existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      mapboxgl.accessToken = accessToken;
      
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

  // Initialize map on component mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    // Clean up on unmount
    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map when coordinates change
  useEffect(() => {
    if (map.current && !isLoading && !error) {
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
  }, [latitude, longitude, city, country, isLoading, error]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mb-4 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 mb-4 text-destructive mx-auto" />
          <p className="text-destructive font-medium mb-2">Map Error</p>
          <p className="text-muted-foreground text-sm max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg h-96 overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '384px' }} // Ensure minimum height
      />
    </div>
  );
};

export default Map;