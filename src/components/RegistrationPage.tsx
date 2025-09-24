import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  const mockPoliceBooths: Record<string, { name: string, details: string }> = {
    'ranchi': { 
      name: 'Ranchi Sadar Thana', 
      details: 'Ranchi Sadar Thana - Located at Main Road, Ranchi. Contact: +91-651-2345678' 
    },
    'delhi': { 
      name: 'Connaught Place Police Station', 
      details: 'Connaught Place Police Station - Located at CP, New Delhi. Contact: +91-11-23456789' 
    },
    'mumbai': { 
      name: 'Marine Drive Police Station', 
      details: 'Marine Drive Police Station - Located at Nariman Point, Mumbai. Contact: +91-22-23456789' 
    },
    'bangalore': { 
      name: 'MG Road Police Station', 
      details: 'MG Road Police Station - Located at MG Road, Bangalore. Contact: +91-80-23456789' 
    },
    'hyderabad': { 
      name: 'Banjara Hills Police Station', 
      details: 'Banjara Hills Police Station - Located at Road No 12, Hyderabad. Contact: +91-40-23456789' 
    },
    'pune': { 
      name: 'Koregaon Park Police Station', 
      details: 'Koregaon Park Police Station - Located at North Main Road, Pune. Contact: +91-20-26126595' 
    },
    'chennai': { 
      name: 'T Nagar Police Station', 
      details: 'T Nagar Police Station - Located at T Nagar, Chennai. Contact: +91-44-24339222' 
    },
    'kolkata': { 
      name: 'New Market Police Station', 
      details: 'New Market Police Station - Located at Lindsay Street, Kolkata. Contact: +91-33-22265301' 
    },
    'jaipur': { 
      name: 'Civil Lines Police Station', 
      details: 'Civil Lines Police Station - Located at Civil Lines, Jaipur. Contact: +91-141-2200100' 
    },
    'ahmedabad': { 
      name: 'Ellis Bridge Police Station', 
      details: 'Ellis Bridge Police Station - Located at Ellis Bridge, Ahmedabad. Contact: +91-79-26577054' 
    },
    'lucknow': { 
      name: 'Hazratganj Police Station', 
      details: 'Hazratganj Police Station - Located at Hazratganj, Lucknow. Contact: +91-522-2237721' 
    },
    'kanpur': { 
      name: 'Civil Lines Police Station', 
      details: 'Civil Lines Police Station - Located at Civil Lines, Kanpur. Contact: +91-512-2367234' 
    },
    'patna': { 
      name: 'Kotwali Police Station', 
      details: 'Kotwali Police Station - Located at Fraser Road, Patna. Contact: +91-612-2222509' 
    },
    'bhopal': { 
      name: 'MP Nagar Police Station', 
      details: 'MP Nagar Police Station - Located at Zone 1, MP Nagar, Bhopal. Contact: +91-755-2576666' 
    },
    'guwahati': { 
      name: 'Pan Bazaar Police Station', 
      details: 'Pan Bazaar Police Station - Located at Pan Bazaar, Guwahati. Contact: +91-361-2516444' 
    }
  };

  useEffect(() => {
    const existingRegistration = localStorage.getItem('userRegistration');
    if (existingRegistration) {
      setIsTicketSystemEnabled(true);
    }
  }, []);

  const searchPoliceBooth = (city: string) => {
    const cityLower = city.toLowerCase().trim();
    console.log('Searching for city:', cityLower); // Debug log
    let result = mockPoliceBooths[cityLower];
    
    if (!result) {
      for (let key in mockPoliceBooths) {
        if (cityLower.includes(key) || key.includes(cityLower)) {
          result = mockPoliceBooths[key];
          break;
        }
      }
    }
    
    if (result) {
      setMapDisplay(result.details);
      setNearestBooth(result.name);
      console.log('Found booth:', result.name); // Debug log
    } else {
      setMapDisplay(`No police booth found for "${city}". Please try: Delhi, Mumbai, Bangalore, Chennai, Kolkata, etc.`);
      setNearestBooth('No booth found');
      console.log('No booth found for:', city); // Debug log
    }
  };

  const handleSearch = () => {
    if (formData.city) {
      setMapDisplay('Searching for booths...');
      setTimeout(() => {
        searchPoliceBooth(formData.city);
      }, 1000);
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
    if (nearestBooth === 'No booth found' || nearestBooth === '-') {
      setMapDisplay('Please search for a valid city first to link to a police booth.');
    } else {
      setMapDisplay(`You are now linked to ${nearestBooth}. Your daily check-ins will be logged automatically.`);
      // Save linked booth to localStorage for ticket system
      localStorage.setItem('linkedPoliceBooth', JSON.stringify(nearestBooth));
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
                  <path fillRule="evenodd" d="M5 9V7a5 5 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Upload ID Proof
              </button>
              <div className="flex-grow relative">
                <input 
                  type="text" 
                  className="input-field w-full pr-7" 
                  placeholder="Enter your city or area" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  type="button" 
                  onClick={handleSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white bg-opacity-70 text-gray-700"
                >
                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.11 0 2.15-.31 3-1.42l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="map-placeholder border border-gray-400 rounded-lg">
              <p className={mapDisplay.includes('Ranchi Sadar Thana') ? 'text-white text-base' : (mapDisplay.includes('No police booth') ? 'text-red-400' : 'text-gray-500')}>
                {mapDisplay}
              </p>
            </div>

            <div className="flex justify-between items-center mt-1 mb-1">
              <p className="text-xs text-gray-600">Nearest Booth: {nearestBooth}</p>
              <button 
                type="button" 
                onClick={handleLinkBooth}
                className="text-xs font-semibold text-white px-2 py-0.5 rounded btn-primary"
              >
                Link to this Police Booth
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
            <img src="https://placehold.co/300x200/F06292/fff?text=Map+image+placeholder" alt="Map image placeholder" className="w-full h-auto object-cover" />
            <div className="absolute bottom-3 right-3 flex items-center justify-center p-1.5 rounded-full bg-white bg-opacity-70 text-gray-700">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
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