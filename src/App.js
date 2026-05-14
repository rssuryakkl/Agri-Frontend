/**
 * src/App.js
 *
 * Fixes:
 * - Import AuthProvider and useAuth as named exports (no default object export).
 * - Spinner keyframe injected inline to avoid a missing CSS import.
 */
import React from 'react';
import { AuthProvider, useAuth } from './Context/AuthContext';
import Auth from './Components/auth/Auth';
import SmartCropDashboard from './Components/Dashboard/SmartCropDashboard';

const spinnerStyle = `@keyframes _sc_spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;

const AppContent = () => {
  const { currentUser, login, signup, resetPassword, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#070b12', flexDirection: 'column', gap: '20px',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <style>{spinnerStyle}</style>
        <div style={{
          width: 48, height: 48,
          border: '3px solid rgba(34,197,94,0.2)',
          borderTopColor: '#22c55e',
          borderRadius: '50%',
          animation: '_sc_spin 0.9s linear infinite',
        }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
          Loading SmartCrop AI…
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Auth
        onLogin={login}
        onSignup={signup}
        onResetPassword={resetPassword}
      />
    );
  }

  return <SmartCropDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;