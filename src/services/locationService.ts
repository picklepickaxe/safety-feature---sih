// Location and Police Station Services using OpenStreetMap APIs

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface PoliceStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  contact?: string;
  distance?: number;
  city: string;
  state: string;
}

// Get user's current location using browser geolocation
export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Reverse geocode to get address
        try {
          const addressInfo = await reverseGeocode(location.lat, location.lng);
          resolve({ ...location, ...addressInfo });
        } catch (error) {
          resolve(location); // Return location without address if reverse geocoding fails
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
};

// Geocode city name to coordinates using Nominatim
export const geocodeCity = async (cityName: string): Promise<Location> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&countrycodes=in&limit=1`
    );
    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error(`Location "${cityName}" not found`);
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
      country: result.address?.country
    };
  } catch (error) {
    throw new Error(`Failed to geocode "${cityName}": ${error}`);
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (lat: number, lng: number): Promise<Partial<Location>> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    
    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return {};
  }
};

// Find nearby police stations using Overpass API
export const findNearbyPoliceStations = async (lat: number, lng: number, radius = 10000): Promise<PoliceStation[]> => {
  try {
    // Overpass query to find police stations within radius (in meters)
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="police"](around:${radius},${lat},${lng});
        way["amenity"="police"](around:${radius},${lat},${lng});
        relation["amenity"="police"](around:${radius},${lat},${lng});
      );
      out center meta;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });
    
    const data = await response.json();
    
    const policeStations: PoliceStation[] = data.elements
      .map((element: any) => {
        // Get coordinates (handle different element types)
        let elementLat: number, elementLng: number;
        if (element.type === 'node') {
          elementLat = element.lat;
          elementLng = element.lon;
        } else if (element.center) {
          elementLat = element.center.lat;
          elementLng = element.center.lon;
        } else {
          return null; // Skip if no coordinates
        }
        
        // Calculate distance
        const distance = calculateDistance(lat, lng, elementLat, elementLng);
        
        // Extract name and address
        const tags = element.tags || {};
        const name = tags.name || tags['name:en'] || tags.official_name || 'Police Station';
        const address = buildAddress(tags);
        
        return {
          id: `${element.type}_${element.id}`,
          name,
          lat: elementLat,
          lng: elementLng,
          address,
          contact: tags.phone || tags['contact:phone'],
          distance,
          city: tags['addr:city'] || '',
          state: tags['addr:state'] || ''
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a: PoliceStation, b: PoliceStation) => a.distance! - b.distance!); // Sort by distance
    
    return policeStations.slice(0, 10); // Return top 10 closest stations
  } catch (error) {
    console.error('Failed to fetch nearby police stations:', error);
    // Return fallback dummy data for the area if API fails
    return getFallbackPoliceStations(lat, lng);
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Build address string from OpenStreetMap tags
const buildAddress = (tags: any): string => {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:state']) parts.push(tags['addr:state']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

// Fallback police stations for major Indian cities when API fails
const getFallbackPoliceStations = (lat: number, lng: number): PoliceStation[] => {
  const fallbackStations = [
    { name: 'Local Police Station', lat: lat + 0.01, lng: lng + 0.01, city: 'Unknown', state: 'Unknown' },
    { name: 'Central Police Station', lat: lat - 0.01, lng: lng - 0.01, city: 'Unknown', state: 'Unknown' },
    { name: 'Traffic Police Station', lat: lat + 0.005, lng: lng - 0.005, city: 'Unknown', state: 'Unknown' }
  ];
  
  return fallbackStations.map((station, index) => ({
    id: `fallback_${index}`,
    name: station.name,
    lat: station.lat,
    lng: station.lng,
    address: 'Address not available',
    distance: calculateDistance(lat, lng, station.lat, station.lng),
    city: station.city,
    state: station.state
  }));
};