import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [linkedBooth, setLinkedBooth] = useState<any>(null);
  
  // Enhanced police booth data with all details needed for ticket system
  const policeBoothDetails: Record<string, any> = {
    'Connaught Place Police Station': {
      name: 'Connaught Place Police Station',
      code: 'CPP-001',
      contact: '+91-11-23456789',
      address: 'Connaught Place, New Delhi 110001',
      distance: '1.8 km away',
      city: 'Delhi'
    },
    'Marine Drive Police Station': {
      name: 'Marine Drive Police Station',
      code: 'MDP-002',
      contact: '+91-22-23456789',
      address: 'Nariman Point, Mumbai 400021',
      distance: '3.1 km away',
      city: 'Mumbai'
    },
    'MG Road Police Station': {
      name: 'MG Road Police Station',
      code: 'MGR-003',
      contact: '+91-80-23456789',
      address: 'MG Road, Bangalore 560001',
      distance: '2.7 km away',
      city: 'Bangalore'
    },
    'T Nagar Police Station': {
      name: 'T Nagar Police Station',
      code: 'TNP-004',
      contact: '+91-44-24339222',
      address: 'T Nagar, Chennai 600017',
      distance: '4.2 km away',
      city: 'Chennai'
    },
    'Koregaon Park Police Station': {
      name: 'Koregaon Park Police Station',
      code: 'KPP-005',
      contact: '+91-20-26126595',
      address: 'North Main Road, Pune 411001',
      distance: '1.5 km away',
      city: 'Pune'
    },
    'New Market Police Station': {
      name: 'New Market Police Station',
      code: 'NMP-006',
      contact: '+91-33-22265301',
      address: 'Lindsay Street, Kolkata 700087',
      distance: '2.9 km away',
      city: 'Kolkata'
    },
    'Civil Lines Police Station': {
      name: 'Civil Lines Police Station',
      code: 'CLP-007',
      contact: '+91-141-2200100',
      address: 'Civil Lines, Jaipur 302006',
      distance: '3.8 km away',
      city: 'Jaipur'
    },
    'Ellis Bridge Police Station': {
      name: 'Ellis Bridge Police Station',
      code: 'EBP-008',
      contact: '+91-79-26577054',
      address: 'Ellis Bridge, Ahmedabad 380006',
      distance: '2.1 km away',
      city: 'Ahmedabad'
    },
    'Hazratganj Police Station': {
      name: 'Hazratganj Police Station',
      code: 'HPP-009',
      contact: '+91-522-2237721',
      address: 'Hazratganj, Lucknow 226001',
      distance: '1.9 km away',
      city: 'Lucknow'
    },
    'Ranchi Sadar Thana': {
      name: 'Ranchi Sadar Thana',
      code: 'RST-001',
      contact: '+91-651-2345678',
      address: 'Main Road, Ranchi, Jharkhand 834001',
      distance: '2.3 km away',
      city: 'Ranchi'
    }
  };
  
  const [formData, setFormData] = useState({
    travelDate: new Date().toISOString().split('T')[0],
    returnTime: '',
    transport: '',
    destination: ''
  });

  useEffect(() => {
    // Check if user is registered
    const registrationData = localStorage.getItem('userRegistration');
    if (!registrationData) {
      alert('You must complete registration first. Redirecting to registration page...');
      navigate('/');
      return;
    }
    
    const parsedUserData = JSON.parse(registrationData);
    setUserData(parsedUserData);
    
    // Get linked booth from localStorage or set default
    const lastSearchedBooth = localStorage.getItem('linkedPoliceBooth');
    if (lastSearchedBooth) {
      const boothName = JSON.parse(lastSearchedBooth);
      setLinkedBooth(policeBoothDetails[boothName] || policeBoothDetails['Ranchi Sadar Thana']);
    } else {
      // Default to a booth based on user's city if available
      const userCity = parsedUserData.city?.toLowerCase();
      let defaultBooth = policeBoothDetails['Ranchi Sadar Thana']; // fallback
      
      // Try to match user's city with available booths
      for (const [, booth] of Object.entries(policeBoothDetails)) {
        if (booth.city.toLowerCase().includes(userCity) || userCity.includes(booth.city.toLowerCase())) {
          defaultBooth = booth;
          break;
        }
      }
      setLinkedBooth(defaultBooth);
    }
    
    // Typing animation setup
    setTimeout(() => {
      setTypingDone(true);
    }, 3000);
  }, [navigate]);

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

  const timeDisplay = updateTimer();

  if (!userData) {
    return <div>Loading...</div>;
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
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="time-remaining text-lg font-bold text-red-600">
                  {timeRemaining <= 0 ? 'Time Expired!' : `Time Remaining: ${timeDisplay}`}
                </span>
              </div>
              <button 
                type="button" 
                onClick={handleCloseTicket}
                className="btn btn-secondary px-6"
              >
                Close Ticket
              </button>
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
                  <p className="text-xs text-gray-600 mb-1">Station Code:</p>
                  <p className="font-semibold text-gray-800">{linkedBooth?.code || '-'}</p>
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
                  <p className="font-semibold text-green-600">{linkedBooth?.distance || '-'}</p>
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
            
            {/* Right: Map View */}
            <div className="w-64 h-48 bg-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-600 relative">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p className="text-sm font-medium">Distance Map</p>
                <p className="text-xs text-gray-500">Your location to booth</p>
              </div>
              
              {/* Distance indicator */}
              {linkedBooth && (
                <div className="absolute bottom-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-bold text-green-600 shadow">
                  {linkedBooth.distance.split(' ')[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSystem;