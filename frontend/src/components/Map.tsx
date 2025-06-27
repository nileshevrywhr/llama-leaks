
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

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

  const initializeMap = () => {
    if (!mapContainer.current || !accessToken) return;

    try {
      mapboxgl.accessToken = accessToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [Number(longitude), Number(latitude)],
        zoom: 10,
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
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  useEffect(() => {
    if (accessToken && !isTokenSet) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, [accessToken, latitude, longitude]);

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
            onChange={(e) => setAccessToken(e.target.value)}
            className="font-mono text-sm"
          />
          <Button 
            onClick={initializeMap}
            disabled={!accessToken}
            className="w-full"
          >
            Load Map
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Get your token at{' '}
          <a 
            href="https://mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com
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
