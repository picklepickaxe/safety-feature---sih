import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationPage from './components/RegistrationPage';
import TicketSystem from './components/TicketSystem';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed -z-10" 
             style={{backgroundImage: "url('/background image.png')"}}></div>
        
        <Routes>
          <Route path="/" element={<RegistrationPage />} />
          <Route path="/ticket-system" element={<TicketSystem />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;