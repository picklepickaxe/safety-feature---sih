import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationPage from './components/RegistrationPage';
import TicketSystem from './components/TicketSystem';
import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#fff', background:'#551D25', fontFamily:'sans-serif' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize:'0.75rem', lineHeight:1.3 }}>{String(this.state.error)}</pre>
          <button onClick={() => window.location.reload()} style={{marginTop:'1rem', background:'#8B4D5D', color:'#fff', padding:'0.5rem 0.75rem', borderRadius:4}}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen">
          <div className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed -z-10" 
               style={{backgroundImage: "url('/background image.png')"}}></div>
          <Routes>
            <Route path="/" element={<RegistrationPage />} />
            <Route path="/ticket-system" element={<TicketSystem />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;