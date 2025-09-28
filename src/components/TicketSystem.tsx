import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import { PoliceStation } from '../services/locationService';

interface TicketData {
  destination: string;
  returnTime: string;
  transport: string;
  travelDate: string;
  createdAt: Date;
}

const TicketSystem: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [typingDone, setTypingDone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [linkedBooth, setLinkedBooth] = useState<PoliceStation | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [distanceToBooth, setDistanceToBooth] = useState<number | null>(null);
  
  // Legacy hardcoded station list removed; rely on stored linked station from registration flow
  
  const [formData, setFormData] = useState({
    travelDate: new Date().toISOString().split('T')[0],
    returnTime: '',
    transport: '',
    destination: ''
  });

  useEffect(() => {
    // Check if user is registered
    try {
      const registrationData = localStorage.getItem('userRegistration');
      if (!registrationData) {
        navigate('/');
        return;
      }
      const parsedUserData = JSON.parse(registrationData);
      setUserData(parsedUserData);

      const storedLinked = localStorage.getItem('linkedPoliceBooth');
      if (storedLinked) {
        try {
          const station: PoliceStation = JSON.parse(storedLinked);
          setLinkedBooth(station);
        } catch (e) {
          console.warn('Failed to parse linkedPoliceBooth', e);
        }
      }

      // Attempt to get user geolocation for distance measurement
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(coords);
          },
          (err) => {
            console.warn('Geolocation error:', err.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } catch (e) {
      console.error('Corrupt registration data, clearing.', e);
      localStorage.removeItem('userRegistration');
      navigate('/');
      return;
    } finally {
      setTimeout(() => setTypingDone(true), 1500);
    }
  }, [navigate]);

  // Compute distance whenever we have both userLocation and linkedBooth
  useEffect(() => {
    if (userLocation && linkedBooth && typeof linkedBooth.lat === 'number' && typeof linkedBooth.lng === 'number') {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(linkedBooth.lat - userLocation.lat);
      const dLng = toRad(linkedBooth.lng - userLocation.lng);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(linkedBooth.lat)) * Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      setDistanceToBooth(dist);
    } else {
      setDistanceToBooth(null);
    }
  }, [userLocation, linkedBooth]);

  const updateTimer = () => {
    if (timeRemaining <= 0) {
      return;
    }

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const showActiveTicket = (ticketData: TicketData) => {
    setShowWelcome(false);
    setActiveTicket(ticketData);

    // Calculate time remaining until return time
    const now = new Date();
    const returnDateTime = new Date(`${ticketData.travelDate} ${ticketData.returnTime}:00`);
    const calculatedTimeRemaining = Math.max(0, Math.floor((returnDateTime.getTime() - now.getTime()) / 1000));
    setTimeRemaining(calculatedTimeRemaining);

    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    setTimerInterval(interval);
  };

  const hideActiveTicket = () => {
    setShowWelcome(true);
    setActiveTicket(null);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.returnTime) {
      alert('Please fill in destination and return time.');
      return;
    }

    const ticketData: TicketData = {
      ...formData,
      createdAt: new Date()
    };

    showActiveTicket(ticketData);
    alert('Travel ticket opened successfully!');
  };

  const handleCloseTicket = () => {
    if (confirm('Are you sure you want to close this ticket and mark yourself as safe?')) {
      hideActiveTicket();
      alert('Ticket closed successfully. You have been marked as safe.');
    }
  };

  const handleSOS = () => {
    if (confirm('⚠️ EMERGENCY SOS ALERT ⚠️\n\nThis will immediately notify:\n• Emergency contacts\n• Local police\n• Linked police booth\n\nPress OK only if you are in danger!')) {
      // In a real app, this would trigger actual emergency protocols
      alert('🚨 SOS ALERT SENT!\n\n -- Emergency contacts notified\n -- Police alerted with your location\n -- Help is on the way\n\nStay calm and wait for assistance.');
      
      // You could add actual emergency functionality here like:
      // - Send location to emergency contacts
      // - Call emergency services API
      // - Log emergency event
    }
  };

  const timeDisplay = updateTimer();

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-gray-200" style={{background:'#551D25'}}>
        Loading ticket system...
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Title Section */}
      <div className="title-section">
        <div className="title">
          Your Secure Journey Dashboard
        </div>
        <div className="subtitle">
          <span className={`${typingDone ? 'typing-animation typing-done' : 'typing-animation'}`}>
            Where are you headed today?
          </span>
        </div>
      </div>
      
      {/* Welcome Message */}
      {showWelcome && (
        <div className="text-center mb-4 p-3 bg-green-100 border border-green-300 rounded-lg max-w-4xl mx-auto">
          <p className="text-green-800">Welcome back, <strong>{userData.fullName}</strong>! You are registered and verified.</p>
        </div>
      )}
      
      {/* Daily Travel Ticket System - Full Width Card */}
      {!activeTicket && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10">
          <div className="bg-white bg-opacity-90 rounded-2xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h2 className="registration-header font-semibold">Daily Travel Ticket System</h2>
              <svg className="h-4 w-4 text-red-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="flex gap-4 mb-4">
                {/* Date */}
                <div className="flex items-center gap-2 flex-1">
                  <input 
                    type="date" 
                    className="input-field flex-1" 
                    value={formData.travelDate}
                    onChange={(e) => setFormData({...formData, travelDate: e.target.value})}
                  />
                  <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full bg-white bg-opacity-70 text-gray-700">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </button>
                </div>
                
                {/* Return Time */}
                <div className="flex-1">
                  <input 
                    type="time" 
                    className="input-field w-full" 
                    placeholder="Expected Return Time" 
                    value={formData.returnTime}
                    onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                  />
                </div>
                
                {/* Mode of Transport */}
                <div className="flex-1">
                  <select 
                    className="input-field w-full"
                    value={formData.transport}
                    onChange={(e) => setFormData({...formData, transport: e.target.value})}
                  >
                    <option value="">Mode of Transport (Optional)</option>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="bus">Bus</option>
                    <option value="train">Train</option>
                    <option value="walking">Walking</option>
                  </select>
                </div>
              </div>

              {/* Destination */}
              <div className="mb-4">
                <input 
                  type="text" 
                  className="input-field w-full" 
                  placeholder="Destination(s) for the Day" 
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">Open Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Ticket Status (Only shows when ticket is created) */}
      {activeTicket && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-10">
          <div className="bg-white bg-opacity-90 rounded-2xl p-4 shadow-lg border-l-4 border-green-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="status-title font-semibold">Active Ticket Status</h3>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Status:</p>
                <p className="font-semibold text-gray-800">Active (Pending Return)</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Destination:</p>
                <p className="font-semibold text-gray-800">{activeTicket.destination}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Return Time:</p>
                <p className="font-semibold text-gray-800">{activeTicket.returnTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Transport Mode:</p>
                <p className="font-semibold text-gray-800">{activeTicket.transport || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <svg className="w-4 h-4 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="time-remaining text-lg font-bold text-red-600">
                  {timeRemaining <= 0 ? 'Time Expired!' : `Time Remaining: ${timeDisplay}`}
                </span>
              </div>
              <div className="flex gap-3 ml-4">
                <button 
                  type="button" 
                  onClick={handleSOS}
                  className="btn bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-lg animate-pulse min-w-[100px] flex items-center justify-center"
                >
                  SOS
                </button>
                <button 
                  type="button" 
                  onClick={handleCloseTicket}
                  className="btn btn-secondary px-6 min-w-[120px] flex items-center justify-center"
                >
                  Close Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Police Booth Linked Section - Single Elongated Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <div className="bg-white bg-opacity-90 rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="registration-header font-semibold">Linked Police Booth</h2>
            <svg className="h-4 w-4 text-red-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          
          <div className="flex gap-4">
            {/* Left: Police Booth Details */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Booth Name:</p>
                  <p className="font-semibold text-gray-800">{linkedBooth?.name || 'Not linked'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Station ID:</p>
                  <p className="font-semibold text-gray-800">{linkedBooth?.id || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Registration Date:</p>
                  <p className="font-semibold text-gray-800">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Registration Time:</p>
                  <p className="font-semibold text-gray-800">{new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})} IST</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Contact:</p>
                  <p className="font-semibold text-gray-800">{linkedBooth?.contact || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Distance:</p>
                  <p className="font-semibold text-green-600">
                    {distanceToBooth !== null ? `${distanceToBooth.toFixed(1)} km away` : (typeof linkedBooth?.distance === 'number' ? `${linkedBooth.distance.toFixed(1)} km away` : (linkedBooth?.distance || '-'))}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-600 mb-1">Address:</p>
                <p className="font-semibold text-gray-800">{linkedBooth?.address || 'Address not available'}</p>
              </div>
              
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span className="text-sm font-medium">
                  {linkedBooth ? 'Verified & Linked' : 'Not linked to any booth'}
                </span>
              </div>
            </div>
            
            {/* Right: Interactive Map */}
            <div className="w-64 h-48 rounded-lg overflow-hidden -ml-4">
              {linkedBooth && linkedBooth.lat && linkedBooth.lng ? (
                <MapComponent
                  policeStation={linkedBooth}
                  userLocation={userLocation || undefined}
                  selectedStation={linkedBooth}
                  height="192px"
                  zoom={15}
                  showDistance
                  showDistanceLine
                />
              ) : (
                <div className="map-placeholder h-48 flex items-center justify-center text-xs">No map data</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSystem;