import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import { geocodeCity, findNearbyPoliceStations, getCurrentLocation, PoliceStation } from '../services/locationService';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
    city: '',
    optIn: true,
    terms: false
  });
  const [mapDisplay, setMapDisplay] = useState('Enter a city or area and press the search button to find a booth nearby.');
  const [isTicketSystemEnabled, setIsTicketSystemEnabled] = useState(false);
  const [nearestBooth, setNearestBooth] = useState('-');
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [policeBoothOptions, setPoliceBoothOptions] = useState<PoliceStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<PoliceStation | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isBoothLinked, setIsBoothLinked] = useState(false);
  const [showRightWarning, setShowRightWarning] = useState(false);



  useEffect(() => {
    const existingRegistration = localStorage.getItem('userRegistration');
    if (existingRegistration) {
      setIsTicketSystemEnabled(true);
    }

    const storedLinked = localStorage.getItem('linkedPoliceBooth');
    if (storedLinked) {
      try {
        const booth: PoliceStation = JSON.parse(storedLinked);
        const validLatLng = typeof booth?.lat === 'number' && typeof booth?.lng === 'number' && !isNaN(booth.lat) && !isNaN(booth.lng);
        if (validLatLng) {
          setIsBoothLinked(true);
          setSelectedBooth(booth);
          setSelectedStation(booth);
          setNearestBooth(booth.name || '-');
        } else {
          console.warn('Invalid stored booth coordinates, clearing. Booth:', booth);
          localStorage.removeItem('linkedPoliceBooth');
        }
      } catch (e) {
        console.warn('Failed to parse stored linked booth', e);
        localStorage.removeItem('linkedPoliceBooth');
      }
    }
    
    // Optionally request user location for better search results
    if (navigator.geolocation) {
      console.log('Geolocation available, you can enable location access for better results');
    }
  }, []);

  const fetchCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setShowRightWarning(true);
    try {
      const location = await getCurrentLocation();
      console.log('Current location found:', location);
      
      // Update city input with detected address
      if (location.address) {
        setFormData({...formData, city: location.city || location.address.split(',')[0] || 'Current Location'});
      }
      
      const stations = await findNearbyPoliceStations(location.lat, location.lng);
      console.log('Nearby police stations:', stations);
      
      if (stations.length > 0) {
        setPoliceBoothOptions(stations);
        setUserLocation({ lat: location.lat, lng: location.lng });
        setMapDisplay(`Found ${stations.length} police stations near your location. Please select one from the dropdown.`);
        
        // Auto-select the nearest station
        const nearestStation = stations[0];
        setSelectedStation(nearestStation);
        setSelectedBooth(nearestStation);
        setNearestBooth(nearestStation.name);
      } else {
        setMapDisplay('No police stations found near your current location.');
        setPoliceBoothOptions([]);
      }
    } catch (error) {
      console.error('Location fetch error:', error);
      setMapDisplay('Unable to fetch your location. Please ensure location access is enabled and try again.');
      setPoliceBoothOptions([]);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const searchPoliceBooth = async (city: string) => {
    setIsLoading(true);
    try {
      console.log('Searching for city:', city);
      
      // First, geocode the city to get coordinates
      const location = await geocodeCity(city);
      console.log('Location found:', location);
      
      // Then find nearby police stations
      const stations = await findNearbyPoliceStations(location.lat, location.lng);
      console.log('Police stations found:', stations);
      
      if (stations.length > 0) {
        setPoliceBoothOptions(stations);
        setUserLocation({ lat: location.lat, lng: location.lng });
        setMapDisplay(`Found ${stations.length} police stations near ${location.city || city}. Please select one from the dropdown below.`);
        
        // Auto-select the nearest station
        const nearestStation = stations[0];
        setSelectedStation(nearestStation);
        setSelectedBooth(nearestStation);
        setNearestBooth(nearestStation.name);
      } else {
        setMapDisplay(`No police stations found near ${city}. This might be a remote area or the location service is unavailable.`);
        setNearestBooth('No booth found');
        setSelectedStation(null);
        setPoliceBoothOptions([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMapDisplay(`Could not find location "${city}". Please check spelling or try a different city/area name.`);
      setNearestBooth('Search failed');
      setSelectedStation(null);
      setPoliceBoothOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (formData.city.trim()) {
      setMapDisplay('Searching for police stations...');
      await searchPoliceBooth(formData.city.trim());
    } else {
      setMapDisplay('Please enter a city or area to search.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleLinkBooth = () => {
    if (isBoothLinked) {
      // Unlink the booth
      setIsBoothLinked(false);
      setMapDisplay('You have been unlinked from the police booth.');
      localStorage.removeItem('linkedPoliceBooth');
    } else {
      // Link to the booth
      if (!selectedBooth || nearestBooth === 'No booth found' || nearestBooth === '-') {
        setMapDisplay('Please search and select a valid police station first to link to a police booth.');
      } else {
        setIsBoothLinked(true);
        setMapDisplay(`You are now linked to ${selectedBooth.name}. Your daily check-ins will be logged automatically.`);
        // Save complete linked booth data to localStorage for ticket system
        localStorage.setItem('linkedPoliceBooth', JSON.stringify(selectedBooth));
      }
    }
  };

  const handlePoliceStationSelect = (stationId: string) => {
    const station = policeBoothOptions.find(s => s.id === stationId);
    if (station) {
      setSelectedBooth(station);
      setSelectedStation(station);
      setNearestBooth(station.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phoneNumber || !formData.email || !formData.emergencyContact || !formData.city) {
      alert('Please fill in all required fields.');
      return;
    }
    
    if (!formData.terms) {
      alert('Please accept the Terms & Privacy Policy to continue.');
      return;
    }
    
    const registrationData = {
      ...formData,
      registeredAt: new Date().toISOString(),
      isRegistered: true
    };
    
    localStorage.setItem('userRegistration', JSON.stringify(registrationData));
    alert('Registration completed successfully! You can now access the ticket system.');
    setIsTicketSystemEnabled(true);
  };

  const navigateToTicketSystem = () => {
    const registrationData = localStorage.getItem('userRegistration');
    if (!registrationData) {
      alert('Please complete your registration first before accessing the ticket system.');
      return;
    }
    navigate('/ticket-system');
  };

  return (
    <div className="main-container">
      {/* Title Section */}
      <div className="title-section">
        <div className="title">
          Travel with <span className="emerge-confidence">Confidence</span>. Stay <span className="emerge-connected">Connected</span>.
        </div>
        <div className="subtitle emerge-subtitle">
          Secure Travel Check-in with Police Booths
        </div>
      </div>
      
      {/* Main Content Wrapper */}
      <div className="content-wrapper">
        {/* Left: Registration Card */}
        <div className="card-container">
          <div className="flex justify-between items-center mb-2">
            <h2 className="registration-header font-semibold">Register Your Journey</h2>
            <svg className="h-4 w-4 text-red-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Two column layout for form fields */}
            <div className="form-row">
              <div className="form-col">
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Full Name" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="form-col">
                <input 
                  type="tel" 
                  className="input-field w-full" 
                  placeholder="Phone Number" 
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-col">
                <input 
                  type="email" 
                  className="input-field w-full" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-col">
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Emergency Contact" 
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                />
              </div>
            </div>

            {/* Upload button and search in one row */}
            <div className="flex items-center gap-2 mb-2">
              <button type="button" className="upload-btn text-white font-medium text-xs px-2 py-1 rounded-md flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0 1 10 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Upload ID Proof
              </button>
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  className="input-field w-full pr-14" 
                  placeholder="Enter your city or area" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  onKeyPress={handleKeyPress}
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <button 
                    type="button" 
                    onClick={fetchCurrentLocation}
                    disabled={isFetchingLocation}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors"
                    title="Fetch My Location"
                  >
                    {isFetchingLocation ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSearch}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-white bg-opacity-70 text-gray-700"
                    title="Search"
                  >
                    <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.11 0 2.15-.31 3-1.42l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Police Station Dropdown with Warning - directly under city input */}
            {policeBoothOptions.length > 0 && (
              <div className="flex items-stretch gap-2 mb-2">
                {/* Warning on the left - match dropdown height */}
                <div className="flex-shrink-0 bg-yellow-50 border-l-2 border-yellow-400 rounded text-xs flex items-center px-2" style={{minHeight: '2rem'}}>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800 leading-tight whitespace-nowrap">
                      Verify jurisdiction with authorities
                    </span>
                  </div>
                </div>
                
                {/* Dropdown taking remaining space */}
                <div className="flex-grow">
                  <select 
                    value={selectedBooth?.id || ''} 
                    onChange={(e) => handlePoliceStationSelect(e.target.value)}
                    className="input-field w-full text-sm"
                    style={{
                      backgroundColor: '#4a5568',
                      color: '#e2e8f0',
                      border: '1px solid #4a5568'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#4a5568', color: '#e2e8f0' }}>
                      Select Police Station ({policeBoothOptions.length} found)
                    </option>
                    {policeBoothOptions.map((station) => (
                      <option key={station.id} value={station.id} style={{ backgroundColor: '#4a5568', color: '#e2e8f0' }}>
                        {station.name} {station.distance && `(${station.distance.toFixed(1)} km away)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Map Display - in existing gray area */}
            <div className="border border-gray-400 rounded-lg overflow-hidden">
              {selectedBooth && userLocation ? (
                <div className="h-48">
                  <MapComponent 
                    policeStations={policeBoothOptions} 
                    userLocation={userLocation}
                    selectedStation={selectedBooth}
                    height="192px"
                    zoom={15}
                  />
                </div>
              ) : (
                <div className="map-placeholder">
                  <p className={mapDisplay.includes('Ranchi Sadar Thana') ? 'text-white text-base' : (mapDisplay.includes('No police booth') ? 'text-red-400' : 'text-gray-500')}>
                    {mapDisplay}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-1 mb-1">
              <p className="text-xs text-gray-600">{isBoothLinked ? 'Linked Booth' : 'Nearest Booth'}: {nearestBooth}</p>
              <button 
                type="button" 
                onClick={handleLinkBooth}
                className={`text-xs font-semibold text-white px-2 py-0.5 rounded ${
                  isBoothLinked ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'
                }`}
              >
                {isBoothLinked ? 'Unlink this Booth' : 'Link to this Police Booth'}
              </button>
            </div>

            <div className="flex items-center mb-1">
              <input 
                type="checkbox" 
                checked={formData.optIn}
                onChange={(e) => setFormData({...formData, optIn: e.target.checked})}
                className="form-checkbox h-3 w-3 text-red-900 rounded focus:ring-red-500" 
              />
              <label className="ml-1 text-xs text-gray-600">Opt-in for Anonymous Mode <span className="text-gray-500">(Minimal Data Sharing)</span></label>
            </div>
            <div className="flex items-center mb-2">
              <input 
                type="checkbox" 
                checked={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.checked})}
                className="form-checkbox h-3 w-3 text-red-900 rounded focus:ring-red-500" 
              />
              <label className="ml-1 text-xs text-gray-600"><a href="#" className="text-blue-600 underline">Agree to Terms & Privacy Policy</a></label>
            </div>
            <button type="submit" className="w-full py-1.5 text-white font-semibold rounded-lg text-sm mb-2 btn-primary">
              Complete Secure Registration
            </button>
            
            {/* Navigate to Ticket System Button */}
            <button 
              type="button" 
              onClick={navigateToTicketSystem}
              className={`w-full py-1.5 text-white font-semibold rounded-lg text-sm upload-btn ${!isTicketSystemEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{opacity: isTicketSystemEnabled ? '1' : '0.5', cursor: isTicketSystemEnabled ? 'pointer' : 'not-allowed'}}
            >
              Go to Ticket System →
            </button>
          </form>
        </div>

        {/* Right: How it Works + Map stacked */}
        <div className="side-content relative top-6">
          <div className="how-it-works-container">
            <h3 className="how-it-works-title font-semibold mb-3">How it Works:</h3>
            <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1 how-it-works-list">
              <li>Register your Details</li>
              <li>Link to Nearest Police Booth</li>
              <li>Daily Check-in/Out</li>
              <li>Automatic Alerts</li>
            </ol>
          </div>
          
          <div className="map-image-container">
            <MapComponent
              policeStation={selectedStation}
              userLocation={userLocation || undefined}
              height="200px"
              zoom={selectedStation ? 15 : 12}
              showDistance={!!(selectedStation && userLocation)}
            />
            <div className="absolute bottom-3 right-3 flex items-center justify-center p-1.5 rounded-full bg-white bg-opacity-70 text-gray-700">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
          {/* Jurisdiction Warning (Right Column) */}
          {showRightWarning && (
          <div className="mt-3 w-full bg-yellow-50 border-l-4 border-yellow-500 rounded-md px-3 py-2 shadow-sm">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-yellow-800 leading-snug">
                Please confirm with local authorities which police station holds jurisdiction for your accommodation/location before finalizing registration.
              </p>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* 4 Simple Steps Section */}
      <section className="steps-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Card wrapper */}
          <div className="relative rounded-[28px] p-3 sm:p-4 shadow-2xl border-[6px] border-red-600" style={{background:'#722F37'}}>

            {/* Centered badge */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="px-8 py-3.5 rounded-full" style={{background:'#6d1c22', boxShadow:'0 10px 24px rgba(0,0,0,0.35)', minWidth: '560px', textAlign:'center'}}>
                <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide" style={{color:'#FFD9D9'}}>travel safe with 4 simple steps</span>
              </div>
            </div>

            {/* Circles row */}
            <div className="flex justify-center items-center space-x-6 sm:space-x-8 mt-6">

              {/* Step 1 Circle */}
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-400 bg-red-900 flex items-center justify-center text-yellow-400 text-2xl sm:text-3xl font-bold shadow-lg">1</div>
                {/* Tooltip for Step 1 */}
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-64 bg-white text-gray-800 text-xs p-3 rounded-lg shadow-2xl border border-red-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition ease-out duration-200 pointer-events-none z-[9999]">
                  <span className="font-semibold text-red-900">Add your details:</span> Simply create your profile and add your name, phone number, and a few emergency contacts. This lets your loved ones know you're safe.
                  {/* Tooltip arrow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-red-200"></div>
                </div>
              </div>

              {/* Arrow after Step 1 */}
              <svg className="w-12 h-4" viewBox="0 0 48 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 6H42" stroke="#FACC15" strokeWidth="2"/>
                <path d="M42 1L47 6L42 11" stroke="#FACC15" strokeWidth="2" fill="none"/>
              </svg>

              {/* Step 2 Circle with tooltip */}
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-400 bg-red-900 flex items-center justify-center text-yellow-400 text-2xl sm:text-3xl font-bold shadow-lg">2</div>
                {/* Tooltip for Step 2 */}
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-64 bg-white text-gray-800 text-xs p-3 rounded-lg shadow-2xl border border-red-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition ease-out duration-200 pointer-events-none z-[9999]">
                  <span className="font-semibold text-red-900">Plan your trip:</span> Tell the app where you're going and for how long. The app will send a friendly reminder to your emergency contacts.
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-red-200"></div>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-12 h-4" viewBox="0 0 48 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 6H42" stroke="#FACC15" strokeWidth="2"/>
                <path d="M42 1L47 6L42 11" stroke="#FACC15" strokeWidth="2" fill="none"/>
              </svg>

              {/* Step 3 Circle with tooltip */}
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-400 bg-red-900 flex items-center justify-center text-yellow-400 text-2xl sm:text-3xl font-bold shadow-lg">3</div>
                {/* Tooltip for Step 3 */}
                <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-72 bg-white text-gray-800 text-xs p-3 rounded-lg shadow-2xl border border-red-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition ease-out duration-200 pointer-events-none z-[9999]">
                  <span className="font-semibold text-red-900">Help is ready:</span> If you don't close your ticket within 24 hours of your planned arrival, the app will automatically send an alert to your emergency contacts and the police with your last known location. We'll make sure someone is looking out for you.
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-red-200"></div>
                </div>
              </div>

              {/* Arrow */}
              <svg className="w-12 h-4" viewBox="0 0 48 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 6H42" stroke="#FACC15" strokeWidth="2"/>
                <path d="M42 1L47 6L42 11" stroke="#FACC15" strokeWidth="2" fill="none"/>
              </svg>

              {/* Step 4 Circle with tooltip */}
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-400 bg-red-900 flex items-center justify-center text-yellow-400 text-2xl sm:text-3xl font-bold shadow-lg">4</div>
                {/* Tooltip for Step 4 */}
                <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-64 bg-white text-gray-800 text-xs p-3 rounded-lg shadow-2xl border border-red-200 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition ease-out duration-200 pointer-events-none z-[9999]">
                  <span className="font-semibold text-red-900">You're safe and sound:</span> Once you've reached your destination or you're no longer in danger, just tap a button to let everyone know you're safe.
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-red-200"></div>
                </div>
              </div>
            </div>

            {/* Text row */}
            <div className="flex justify-center items-center space-x-4 sm:space-x-4 mt-1">
              <div className="flex flex-col items-center text-center transform -translate-x-2">
                <h3 className="text-white font-semibold text-base sm:text-lg">Register</h3>
                <p className="text-red-200 text-xs sm:text-sm">identity + travel details</p>
              </div>
              
              {/* Invisible spacer to match arrow width */}
              <div className="w-6"></div>
              
              <div className="flex flex-col items-center text-center transform -translate-x-4">
                <h3 className="text-white font-semibold text-base sm:text-lg">Open a Ticket</h3>
                <p className="text-red-200 text-xs sm:text-sm">destination, time, mode</p>
              </div>
              
              {/* Invisible spacer to match arrow width */}
              <div className="w-6"></div>
              
              <div className="flex flex-col items-center text-center transform -translate-x-3">
                <h3 className="text-white font-semibold text-base sm:text-lg">Alert Ready</h3>
                <p className="text-red-200 text-xs sm:text-sm">Help is ready</p>
              </div>
              
              {/* Invisible spacer to match arrow width */}
              <div className="w-6"></div>
              
              <div className="flex flex-col items-center text-center">
                <h3 className="text-white font-semibold text-base sm:text-lg">Close the Ticket</h3>
                <p className="text-red-200 text-xs sm:text-sm">mark yourself safe</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegistrationPage;