import { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function IdleSessionTimeout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only track idle timeouts on protected dashboard routes
    const publicPaths = ['/signin', '/signup', '/verify-otp', '/forgot-password', '/reactivate-account', '/'];
    if (publicPaths.includes(location.pathname)) {
      return;
    }

    let timeoutId = null;

    const logoutUser = () => {
      console.log("Inactivity limit reached. Automatically signing out user session.");
      // Clear session values
      localStorage.removeItem('secure_bank_access_token');
      localStorage.removeItem('secure_bank_refresh_token');
      localStorage.removeItem('secure_bank_user');
      // Redirect to sign in page with session timeout parameter
      navigate('/signin?timeout=true');
    };

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(logoutUser, IDLE_TIMEOUT_MS);
    };

    // Listen to standard interactive user gestures
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [location.pathname, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <IdleSessionTimeout />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
