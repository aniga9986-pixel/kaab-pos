import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPOS from './pages/DashboardPOS';
import ProtectedRoute from './components/ProtectedRoute';
import { syncPendingSales } from './syncEngine';

function App() {
  useEffect(() => {
    // 1. Marka internet-ku soo laabto toos u kici sync-ga
    const handleOnline = () => {
      console.log("Internet-kii wuu soo laabtay! La xiriirayo Supabase...");
      syncPendingSales();
    };

    window.addEventListener('online', handleOnline);
    
    // 2. Sidoo kale, kici marka app-ka la furo isna haddii la online yahay
    if (navigator.onLine) {
      syncPendingSales();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Bogagga furan oo qof walba furi karo */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Bogga dukaanka oo la xiray (Protected) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPOS />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
