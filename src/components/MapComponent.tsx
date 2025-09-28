import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PoliceStation } from '../services/locationService';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom police station icon
const policeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User location icon
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  policeStation?: PoliceStation | null;
  policeStations?: PoliceStation[];
  userLocation?: { lat: number; lng: number };
  selectedStation?: PoliceStation | null;
  height?: string;
  zoom?: number;
  showDistance?: boolean;
  showDistanceLine?: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  policeStation,
  policeStations = [],
  userLocation,
  selectedStation,
  height = "200px",
  zoom = 13,
  showDistance = false,
  showDistanceLine = false
}) => {
  // Default center (if no station provided, center on Delhi)
  const defaultCenter: [number, number] = [28.6139, 77.2090];
  
  // Determine which stations to display
  const isValidCoord = (v: any) => typeof v === 'number' && !isNaN(v);
  const stationsToShow = (policeStations.length > 0 ? policeStations : (policeStation ? [policeStation] : []))
    .filter(st => isValidCoord(st?.lat) && isValidCoord(st?.lng));
  
  // Determine map center
  const mapCenter: [number, number] = (() => {
    if (selectedStation && isValidCoord(selectedStation.lat) && isValidCoord(selectedStation.lng)) {
      return [selectedStation.lat, selectedStation.lng];
    }
    if (policeStation && isValidCoord(policeStation.lat) && isValidCoord(policeStation.lng)) {
      return [policeStation.lat, policeStation.lng];
    }
    if (userLocation && isValidCoord(userLocation.lat) && isValidCoord(userLocation.lng)) {
      return [userLocation.lat, userLocation.lng];
    }
    // Fallback to first valid station if exists
    if (stationsToShow.length > 0) {
      return [stationsToShow[0].lat, stationsToShow[0].lng];
    }
    return defaultCenter;
  })();

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Police Station Markers */}
        {stationsToShow.map((station) => {
          const isSelected = selectedStation?.id === station.id;
          if (!isValidCoord(station.lat) || !isValidCoord(station.lng)) return null;
          const markerIcon = isSelected ? new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }) : policeIcon;

          return (
            <Marker key={station.id} position={[station.lat, station.lng]} icon={markerIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>{station.name}</strong> {isSelected && <span className="text-green-600">(Selected)</span>}<br/>
                  <span className="text-gray-600">{station.id}</span><br/>
                  {station.contact && <>📞 {station.contact}<br/></>}
                  📍 {station.address}
                  {station.distance && <><br/>📏 {station.distance.toFixed(1)} km away</>}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* User Location Marker */}
  {userLocation && isValidCoord(userLocation.lat) && isValidCoord(userLocation.lng) && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Your Location</strong><br/>
                  📍 Current Position
                </div>
              </Popup>
            </Marker>
            
            {/* Distance Circle (if showing distance) */}
            {showDistance && selectedStation && selectedStation.distance && isValidCoord(selectedStation.lat) && isValidCoord(selectedStation.lng) && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={selectedStation.distance * 1000} // Convert km to meters
                pathOptions={{ 
                  color: 'green', 
                  fillColor: 'green', 
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}

            {/* Straight line distance and midpoint label */}
            {showDistanceLine && selectedStation && isValidCoord(selectedStation.lat) && isValidCoord(selectedStation.lng) && (
              <>
                <Polyline
                  positions={[
                    [userLocation.lat, userLocation.lng],
                    [selectedStation.lat, selectedStation.lng]
                  ]}
                  pathOptions={{ color: 'red', weight: 2, dashArray: '4 6' }}
                />
                <Marker
                  position={[
                    (userLocation.lat + selectedStation.lat) / 2,
                    (userLocation.lng + selectedStation.lng) / 2
                  ]}
                  icon={new L.DivIcon({
                    className: 'distance-label',
                    html: `<div style="background: rgba(0,0,0,0.6); color: #fff; padding:2px 6px; border-radius:4px; font-size:11px;">${selectedStation.distance ? selectedStation.distance.toFixed(2) : ''} km</div>`
                  })}
                />
              </>
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;