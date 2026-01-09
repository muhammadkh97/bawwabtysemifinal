'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Loader2, Navigation } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '1rem'
};

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export default function LocationPicker({ 
  latitude, 
  longitude, 
  onLocationChange,
  className = '' 
}: LocationPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: latitude || 31.9539, // Jordan default (Amman)
    lng: longitude || 35.9106
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || ''
  });

  useEffect(() => {
    if (latitude && longitude) {
      const position = { lat: latitude, lng: longitude };
      setSelectedPosition(position);
      setCenter(position);
    }
  }, [latitude, longitude]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const position = { lat, lng };
      setSelectedPosition(position);
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPosition = { lat, lng };
          setSelectedPosition(newPosition);
          setCenter(newPosition);
          onLocationChange(lat, lng);
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('لم نتمكن من الحصول على موقعك الحالي. يرجى السماح بالوصول للموقع.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي');
      setGettingLocation(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center h-[400px] rounded-2xl ${className}`}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(98, 54, 255, 0.3)',
        }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
          <p className="text-purple-300">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-purple-300 text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            تحديد الموقع على الخريطة
          </label>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            {gettingLocation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحديد...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                موقعي الحالي
              </>
            )}
          </button>
        </div>
        <p className="text-purple-300 text-xs mb-2">
          اضغط على الخريطة لتحديد موقع المتجر/المطعم
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{
          border: '2px solid rgba(98, 54, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(98, 54, 255, 0.2)',
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onClick={onMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {selectedPosition && (
            <Marker 
              position={selectedPosition}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>

      {selectedPosition && (
        <div className="mt-4 p-4 rounded-xl"
          style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
          }}
        >
          <p className="text-purple-300 text-sm mb-2 font-medium">الإحداثيات المحددة:</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-purple-400 text-xs">خط العرض (Latitude)</label>
              <input
                type="number"
                step="any"
                value={selectedPosition.lat}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    const newPosition = { ...selectedPosition, lat };
                    setSelectedPosition(newPosition);
                    setCenter(newPosition);
                    onLocationChange(lat, selectedPosition.lng);
                  }
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg text-white text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              />
            </div>
            <div>
              <label className="text-purple-400 text-xs">خط الطول (Longitude)</label>
              <input
                type="number"
                step="any"
                value={selectedPosition.lng}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!isNaN(lng)) {
                    const newPosition = { ...selectedPosition, lng };
                    setSelectedPosition(newPosition);
                    setCenter(newPosition);
                    onLocationChange(selectedPosition.lat, lng);
                  }
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg text-white text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
