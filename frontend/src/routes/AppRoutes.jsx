import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import VerifyOTP from '../pages/VerifyOTP';
import Dashboard from '../pages/Dashboard';
import ForgotPassword from '../pages/ForgotPassword';
import Settings from '../pages/Settings';
import ReactivateAccount from '../pages/ReactivateAccount';
import Transfer from '../pages/Transfer';
import Transactions from '../pages/Transactions';
import Statements from '../pages/Statements';
import PinManagement from '../pages/PinManagement';
import VirtualCardPage from '../pages/VirtualCardPage';
import Security from '../pages/Security';
import AccountIdentity from '../pages/AccountIdentity';

/**
 * Route protection wrapper.
 * Redirects anonymous sessions trying to access dashboard back to secure login gate.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('secure_bank_access_token');
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reactivate-account" element={<ReactivateAccount />} />
      <Route path="/identity/:accountNumber" element={<AccountIdentity />} />
      
      {/* Protected client wealth dashboard portal */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Protected settings portal */}
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />

      {/* Sprint 1 Dashboard Core Routes */}
      <Route 
        path="/transfer" 
        element={
          <ProtectedRoute>
            <Transfer />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transactions" 
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/statements" 
        element={
          <ProtectedRoute>
            <Statements />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pin-management" 
        element={
          <ProtectedRoute>
            <PinManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/virtual-card" 
        element={
          <ProtectedRoute>
            <VirtualCardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/security" 
        element={
          <ProtectedRoute>
            <Security />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback routing redirects to secure gate */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
};

export default AppRoutes;
