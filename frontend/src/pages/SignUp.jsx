import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { ApiService } from '../services/Api';
import { AnimatedStagger, Shake, PopInteractive } from '../components/Animated';

const SignUp = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState(null);

  // Derive live password requirements directly from password state (no useEffect / no cascading render)
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,14}$/;

    if (!name.trim()) {
      newErrors.name = 'Full Name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Please enter a valid legal full name.';
    }

    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please provide a valid email format (e.g. user@securebank.com).';
    }

    if (!phone) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Please provide a valid phone number (10-14 digits, optionally starting with +).';
    }

    if (!dob) {
      newErrors.dob = 'Date of Birth is required.';
    } else {
      const dobDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = 'Please enter a valid date of birth.';
      } else if (age < 18) {
        newErrors.dob = 'You must be at least 18 years old to open an account.';
      }
    }

    if (!address.trim()) {
      newErrors.address = 'Residential Address is required.';
    } else if (address.trim().length < 8) {
      newErrors.address = 'Please enter a valid residential address.';
    }

    // Validate that password meets all requirements
    const allRequirementsMet = Object.values(requirements).every(Boolean);
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!allRequirementsMet) {
      newErrors.password = 'Your password must satisfy all 5 requirements listed below.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match. Please verify.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await ApiService.sendOTP(email, name);
      setIsLoading(false);
      // Pass the entire registration details in state so VerifyOTP can execute registration
      navigate('/verify-otp', { 
        state: { 
          email, 
          signupData: { name, email, phone, dob, address, password } 
        } 
      });
    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch verification OTP. Please try again.'
      });
    }
  };

  return (
    <AuthLayout>
      <AnimatedStagger type="slide-up" interval={50} duration={850}>
        <div className="auth-header">
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Open a premium wealth account with Secure Bank</p>
        </div>

        {globalMessage && (
          <Shake trigger={globalMessage} active={globalMessage.type === 'error'}>
            <div className={`custom-alert ${globalMessage.type}`}>
              <div className="custom-alert-icon">
                <AlertCircle size={18} />
              </div>
              <div className="custom-alert-text">{globalMessage.text}</div>
            </div>
          </Shake>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <Shake trigger={errors.name} active={!!errors.name}>
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">
                Full Name
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <User size={18} />
                </span>
                <input
                  id="name-input"
                  type="text"
                  className={`input-field ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Johnathan Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </div>
              {errors.name && (
                <span id="name-error" className="form-error-msg" role="alert">
                  <AlertCircle size={14} /> {errors.name}
                </span>
              )}
            </div>
          </Shake>

          {/* Email Address */}
          <Shake trigger={errors.email} active={!!errors.email}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">
                Email Address
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Mail size={18} />
                </span>
                <input
                  id="email-input"
                  type="email"
                  className={`input-field ${errors.email ? 'input-error' : ''}`}
                  placeholder="e.g. name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <span id="email-error" className="form-error-msg" role="alert">
                  <AlertCircle size={14} /> {errors.email}
                </span>
              )}
            </div>
          </Shake>

          {/* Phone Number */}
          <Shake trigger={errors.phone} active={!!errors.phone}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone-input">
                Phone Number
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Phone size={18} />
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  className={`input-field ${errors.phone ? 'input-error' : ''}`}
                  placeholder="e.g. +1 555 123 4567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
              </div>
              {errors.phone && (
                <span id="phone-error" className="form-error-msg" role="alert">
                  <AlertCircle size={14} /> {errors.phone}
                </span>
              )}
            </div>
          </Shake>

          {/* Date of Birth */}
          <Shake trigger={errors.dob} active={!!errors.dob}>
            <div className="form-group">
              <label className="form-label" htmlFor="dob-input">
                Date of Birth
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Calendar size={18} />
                </span>
                <input
                  id="dob-input"
                  type="date"
                  className={`input-field ${errors.dob ? 'input-error' : ''}`}
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (errors.dob) setErrors(prev => ({ ...prev, dob: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.dob}
                  aria-describedby={errors.dob ? "dob-error" : undefined}
                />
              </div>
              {errors.dob && (
                <span id="dob-error" className="form-error-msg" role="alert">
                  <AlertCircle size={14} /> {errors.dob}
                </span>
              )}
            </div>
          </Shake>

          {/* Residential Address */}
          <Shake trigger={errors.address} active={!!errors.address}>
            <div className="form-group">
              <label className="form-label" htmlFor="address-input">
                Residential Address
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <MapPin size={18} />
                </span>
                <input
                  id="address-input"
                  type="text"
                  className={`input-field ${errors.address ? 'input-error' : ''}`}
                  placeholder="e.g. 123 Financial Way, Suite 100, New York, NY 10001"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors(prev => ({ ...prev, address: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.address}
                  aria-describedby={errors.address ? "address-error" : undefined}
                />
              </div>
              {errors.address && (
                <span id="address-error" className="form-error-msg" role="alert">
                  <AlertCircle size={14} /> {errors.address}
                </span>
              )}
            </div>
          </Shake>

          {/* Password */}
          <Shake trigger={errors.password} active={!!errors.password}>
            <div className="form-group">
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field input-field-password ${errors.password ? 'input-error' : ''}`}
                  placeholder="Create strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className="form-error-msg" role="alert">
                  <AlertCircle size={14} /> {errors.password}
                </span>
              )}
              
              {/* Real-time checklist of password requirements */}
              <div className="pw-requirements">
                <div className="pw-requirements-title">Security Standards:</div>
                
                <div className={`pw-requirement-item ${requirements.minLength ? 'valid' : ''}`}>
                  {requirements.minLength ? <CheckCircle2 size={14} /> : <div className="dot"></div>}
                  At least 8 characters
                </div>

                <div className={`pw-requirement-item ${requirements.hasUpper ? 'valid' : ''}`}>
                  {requirements.hasUpper ? <CheckCircle2 size={14} /> : <div className="dot"></div>}
                  At least one uppercase letter (A-Z)
                </div>

                <div className={`pw-requirement-item ${requirements.hasLower ? 'valid' : ''}`}>
                  {requirements.hasLower ? <CheckCircle2 size={14} /> : <div className="dot"></div>}
                  At least one lowercase letter (a-z)
                </div>

                <div className={`pw-requirement-item ${requirements.hasNumber ? 'valid' : ''}`}>
                  {requirements.hasNumber ? <CheckCircle2 size={14} /> : <div className="dot"></div>}
                  At least one number (0-9)
                </div>

                <div className={`pw-requirement-item ${requirements.hasSpecial ? 'valid' : ''}`}>
                  {requirements.hasSpecial ? <CheckCircle2 size={14} /> : <div className="dot"></div>}
                  At least one special character (!@#$%, etc.)
                </div>
              </div>
            </div>
          </Shake>

          {/* Confirm Password */}
          <Shake trigger={errors.confirmPassword} active={!!errors.confirmPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password-input">
                Confirm Password
              </label>
              <div className="input-container">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input-field input-field-password ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
            <span id="confirm-password-error" className="form-error-msg" role="alert">
              <AlertCircle size={14} /> {errors.confirmPassword}
            </span>
          )}
        </div>
      </Shake>

      {/* Terms & Conditions Checkbox */}
      <div className="form-group" style={{ marginTop: '0.4rem', marginBottom: '0.4rem' }}>
        <label className="remember-me" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={isLoading}
            style={{ marginTop: '0.2rem' }}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', fontWeight: 500 }}>
            I agree to the <a href="#terms" style={{ color: 'var(--border-focus)', fontWeight: 700 }}>Terms & Conditions</a> and <a href="#privacy" style={{ color: 'var(--border-focus)', fontWeight: 700 }}>Privacy Policy</a>
          </span>
        </label>
      </div>

      {/* Action Button */}
      <PopInteractive scale={0.97} hoverScale={agreed && !isLoading ? 1.01 : 1.0}>
        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading || !agreed}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Opening Bank Account...
            </>
          ) : (
            <>
              Open Bank Account <ArrowRight size={18} />
            </>
          )}
        </button>
      </PopInteractive>
        </form>

        {/* Footer Info Box */}
        <div className="divider">REGISTRATION PORTAL</div>

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
              Institutional-grade compliance
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              Your account creation is fully encrypted and complies with FDIC & SEC standard regulations.
            </span>
          </div>
        </div>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/signin">Sign In</Link>
        </div>
      </AnimatedStagger>
    </AuthLayout>
  );
};

export default SignUp;
