import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Animated, AnimatedStagger, Shake, PopInteractive } from '../components/Animated';
import { ApiService } from '../services/Api';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const signupData = location.state?.signupData || null;
  const userEmail = location.state?.email || signupData?.email || 'your email address';
  
  // 6-digit OTP state array
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Resend Timer states
  const [timer, setTimer] = useState(30);
  const [showResendToast, setShowResendToast] = useState(false);
  const canResend = timer === 0;

  // References for all 6 inputs to auto-tab focuses
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Countdown timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle value change for digit
  const handleChange = (index, value) => {
    // Only accept numeric entries
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input box if typed
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspace back-tabbing
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
      setError(null);
    }
  };

  // Handle paste event (split a 6-digit number across inputs)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const newOtp = pasteData.split('');
    setOtp(newOtp);
    setError(null);
    inputRefs[5].current.focus();
  };

  // Handle resending OTP code
  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await ApiService.resendOTP(userEmail, signupData?.name);
      setIsLoading(false);
      setTimer(30);
      setShowResendToast(true);
      
      // Auto-dismiss toast after 4 seconds
      setTimeout(() => {
        setShowResendToast(false);
      }, 4000);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to resend verification code. Please try again.');
    }
  };

  // Validate and submit OTP code
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length < 6) {
      setError('Please input the full 6-digit verification code.');
      return;
    }

    if (!signupData) {
      setError('❌ Verification session expired. Please start the registration process again.');
      setTimeout(() => {
        navigate('/signup');
      }, 3000);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting OTP verification request...');
      const res = await ApiService.signUp({ ...signupData, otp: fullOtp });
      console.log('OTP Verification Response:', res);
      
      setSuccess(true);
      
      // Delay navigation to allow the checkmark success animation to play out
      setTimeout(() => {
        console.log('Redirecting to /signin with verificationSuccess state...');
        navigate('/signin', {
          state: { 
            verificationSuccess: res?.message || 'Account successfully verified and created! Please sign in.' 
          }
        });
      }, 2000);
    } catch (err) {
      console.error('OTP Verification Failed:', err);
      setIsLoading(false);
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <Animated type="bounce" duration={1200} style={{ display: 'inline-block' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              border: '2px solid var(--success)',
              color: 'var(--success)',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={40} />
            </div>
          </Animated>
          
          <AnimatedStagger type="slide-up" interval={150} delay={300}>
            <h2 className="auth-title" style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>
              Account Verification Successful
            </h2>
            <p className="auth-subtitle" style={{ maxWidth: '340px', margin: '0 auto 2rem auto', fontSize: '0.95rem', lineHeight: '1.5', fontWeight: 600 }}>
              Creating Your Secure Banking Account...
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', alignItems: 'center' }}>
              <span className="spinner" style={{ borderTopColor: 'var(--success)' }}></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Provisioning bank credentials & vaults...
              </span>
            </div>
          </AnimatedStagger>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AnimatedStagger type="slide-up" interval={60} duration={850}>
        <div className="auth-header">
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle" style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
            We've sent a verification code to<br />
            <strong style={{ color: 'var(--border-focus)', fontWeight: 700, wordBreak: 'break-all' }}>{userEmail}</strong>
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <Shake trigger={error} active={true}>
            <div className="custom-alert error" style={{ marginBottom: '1rem' }}>
              <div className="custom-alert-icon">
                <AlertCircle size={18} />
              </div>
              <div className="custom-alert-text">{error}</div>
            </div>
          </Shake>
        )}

        {/* Resend success Toast alert */}
        {showResendToast && (
          <Animated type="bounce" duration={800}>
            <div className="custom-alert success" style={{ marginBottom: '1rem' }}>
              <div className="custom-alert-icon">
                <CheckCircle2 size={18} />
              </div>
              <div className="custom-alert-text">
                A fresh 6-digit OTP code has been dispatched. Check your inbox.
              </div>
            </div>
          </Animated>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ alignItems: 'center' }}>
            <label className="form-label" style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>
              Enter 6-Digit OTP
            </label>
            
            {/* 6 Digit Input Fields */}
            <Shake trigger={error} active={!!error} style={{ width: 'auto' }}>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    style={{
                      width: '3.2rem',
                      height: '3.8rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      color: 'var(--primary)',
                      outline: 'none',
                      boxShadow: 'var(--input-shadow)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    disabled={isLoading}
                    autoFocus={idx === 0}
                    className="otp-input-field"
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--border-focus)';
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                      e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.backgroundColor = 'var(--bg-primary)';
                      e.target.style.boxShadow = 'var(--input-shadow)';
                    }}
                  />
                ))}
              </div>
            </Shake>
          </div>

          {/* Resend Action or Countdown */}
          <div style={{ textAlign: 'center', fontSize: '0.9rem', margin: '0.5rem 0' }}>
            {canResend ? (
              <span 
                onClick={handleResend}
                style={{ 
                  color: 'var(--border-focus)', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Resend OTP
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                Resend OTP in <strong style={{ color: 'var(--primary)', fontWeight: 600 }}>{timer}s</strong>
              </span>
            )}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Wrong email?{' '}
            <Link 
              to="/signup" 
              style={{ 
                color: 'var(--border-focus)', 
                fontWeight: 700, 
                textDecoration: 'underline' 
              }}
            >
              Change Email
            </Link>
          </div>

          {/* Action Button */}
          <PopInteractive scale={0.97} hoverScale={!isLoading ? 1.01 : 1.0}>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Verify OTP <ArrowRight size={18} />
                </>
              )}
            </button>
          </PopInteractive>
        </form>

        {/* Footer Info Box */}
        <div className="divider">SECURE GATEWAY</div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          textAlign: 'left'
        }}>
          <span style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center' }} aria-hidden="true">🔒</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
              MFA Security Gateway
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              Entering <code style={{ fontFamily: 'monospace', fontWeight: 700 }}>000000</code> will trigger standard mainframe security check rejections.
            </span>
          </div>
        </div>
      </AnimatedStagger>
    </AuthLayout>
  );
};

export default VerifyOTP;
