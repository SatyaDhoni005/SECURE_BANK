import { useLocation } from 'react-router-dom';
import { Landmark, ShieldCheck, Lock, Award, Clock, Percent, PhoneCall } from 'lucide-react';
import { Floating, Animated, AnimatedStagger } from './Animated';

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const isSignUp = location.pathname.includes('/signup');

  return (
    <div className="auth-container">
      {/* Left Panel: Desktop Visual Branding and Trust Indicators */}
      <div className="auth-sidebar">
        {/* Background Grid Pattern */}
        <div className="auth-sidebar-pattern"></div>
        
        {/* Abstract Floating Vector Graphics using Anime.js orbits */}
        <div className="auth-sidebar-graphic-container">
          <Floating
            duration={10000}
            translateY={[-18, 18]}
            translateX={[-10, 10]}
            rotate={[-6, 6]}
            className="auth-sidebar-circle circle-1"
          />
          <Floating
            duration={14000}
            translateY={[-12, 12]}
            translateX={[-15, 15]}
            rotate={[15, -15]}
            className="auth-sidebar-circle circle-2"
          />
          <Floating
            duration={8000}
            translateY={[-6, 6]}
            translateX={[-6, 6]}
            rotate={[-3, 3]}
            className="auth-sidebar-circle circle-3"
          />
        </div>

        {/* Branding Header */}
        <Animated type="slide-down" delay={150} duration={900}>
          <div className="auth-sidebar-header">
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.6rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <Landmark size={24} />
            </div>
            <span className="auth-logo-text">SECURE BANK</span>
          </div>
        </Animated>

        {/* Feature & Security Showcase (Conditional based on Signin vs Signup) */}
        <div className="auth-sidebar-body">
          {isSignUp ? (
            <AnimatedStagger type="slide-up" interval={100} delay={300} duration={800} key="signup-sidebar">
              <h2 className="auth-sidebar-title">
                Elite Wealth Management, Simplified.
              </h2>
              <p className="auth-sidebar-desc">
                Experience institutional-grade wealth features designed for high-net-worth individuals and corporate managers. Your journey to smart finance starts here.
              </p>

              <AnimatedStagger type="slide-up" interval={120} delay={600} duration={850} className="auth-trust-list">
                <div className="auth-trust-item">
                  <div className="auth-trust-icon-box">
                    <Clock size={20} />
                  </div>
                  <div className="auth-trust-text">
                    <h4>3-Minute Account Setup</h4>
                    <p>Complete your application entirely online with zero paperwork or delays.</p>
                  </div>
                </div>

                <div className="auth-trust-item">
                  <div className="auth-trust-icon-box">
                    <Percent size={20} />
                  </div>
                  <div className="auth-trust-text">
                    <h4>Premium High-Yield APY</h4>
                    <p>Enjoy standard 4.85% APY on active cash balances with no account minimums.</p>
                  </div>
                </div>

                <div className="auth-trust-item">
                  <div className="auth-trust-icon-box">
                    <PhoneCall size={20} />
                  </div>
                  <div className="auth-trust-text">
                    <h4>24/7 Private Concierge</h4>
                    <p>Direct, zero-wait access to dedicated wealth advisors and security experts.</p>
                  </div>
                </div>
              </AnimatedStagger>
            </AnimatedStagger>
          ) : (
            <AnimatedStagger type="slide-up" interval={100} delay={300} duration={800} key="signin-sidebar">
              <h2 className="auth-sidebar-title">
                Elite Digital Banking, Uncompromising Security.
              </h2>
              <p className="auth-sidebar-desc">
                Welcome to the future of smart financial management. Experience institutional-grade security features built for personal and commercial banking.
              </p>

              <AnimatedStagger type="slide-up" interval={120} delay={600} duration={850} className="auth-trust-list">
                <div className="auth-trust-item">
                  <div className="auth-trust-icon-box">
                    <Lock size={20} />
                  </div>
                  <div className="auth-trust-text">
                    <h4>256-Bit SSL Encryption</h4>
                    <p>All sessions are secured with bank-grade multi-layer encryption.</p>
                  </div>
                </div>

                <div className="auth-trust-item">
                  <div className="auth-trust-icon-box">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="auth-trust-text">
                    <h4>Multi-Factor Authentication</h4>
                    <p>Biometrics, OTP, and device token binding keep your assets safe.</p>
                  </div>
                </div>

                <div className="auth-trust-item">
                  <div className="auth-trust-icon-box">
                    <Award size={20} />
                  </div>
                  <div className="auth-trust-text">
                    <h4>FDIC Insured & Regulated</h4>
                    <p>Member FDIC. Accounts are insured up to $250,000.</p>
                  </div>
                </div>
              </AnimatedStagger>
            </AnimatedStagger>
          )}
        </div>

        {/* Sidebar Footer */}
        <Animated type="slide-up" delay={1000} duration={800}>
          <div className="auth-sidebar-footer">
            <span>© 2026 Secure Bank Corp. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            </div>
          </div>
        </Animated>
      </div>

      {/* Right Panel: Centers the actual Login/Registration card form */}
      <div className="auth-content">
        <div className="auth-card">
          {/* Consolidated mobile logo (displays only on small screens) */}
          <div className="mobile-logo">
            <div style={{
              background: '#0A2540',
              padding: '0.5rem',
              borderRadius: '8px',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Landmark size={20} />
            </div>
            <span className="mobile-logo-text">SECURE BANK</span>
          </div>

          {/* Render child form elements (SignIn / SignUp) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
