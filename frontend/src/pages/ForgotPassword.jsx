import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { ApiService } from "../services/Api";
import {
  Animated,
  AnimatedStagger,
  Shake,
  PopInteractive,
} from "../components/Animated";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Wizard state: 1 = Email, 2 = OTP, 3 = Reset Password
  const [step, setStep] = useState(1);

  // Form states
  const [email, setEmail] = useState(() => {
    return location.state?.email || "";
  });
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState(null);

  // Live password strength checklist (derived, pure render scope)
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  // Step 1: Send OTP Submit Handler
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setGlobalMessage(null);
    setErrors({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors({ email: "Email address is required." });
      return;
    } else if (!emailRegex.test(email)) {
      setErrors({ email: "Please provide a valid email format." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.forgotPasswordSendOTP(email);
      setGlobalMessage({
        type: "success",
        text: response.message || "A secure reset OTP has been dispatched to your inbox.",
      });
      // Advance to next step
      setTimeout(() => {
        setStep(2);
        setIsLoading(false);
        setGlobalMessage(null);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: "error",
        text: err.message || "Email validation failed. No matching wealth account registered.",
      });
    }
  };

  // Step 2: Verify OTP Submit Handler
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setGlobalMessage(null);
    setErrors({});

    if (!otp) {
      setErrors({ otp: "OTP verification code is required." });
      return;
    } else if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setErrors({ otp: "Verification code must be exactly 6 numeric digits." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.forgotPasswordVerify(email, otp);
      setGlobalMessage({
        type: "success",
        text: response.message || "OTP code verified. Set your new access credentials.",
      });
      setTimeout(() => {
        setStep(3);
        setIsLoading(false);
        setGlobalMessage(null);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: "error",
        text: err.message || "Invalid or expired verification OTP. Please request a new one.",
      });
    }
  };

  // Step 3: Reset Password Submit Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setGlobalMessage(null);
    setErrors({});

    const allRequirementsMet = Object.values(requirements).every(Boolean);
    const newErrors = {};

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (!allRequirementsMet) {
      newErrors.password = "Your password must satisfy all 5 requirements listed below.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmation password is required.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match. Please verify.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.forgotPasswordReset(email, otp, password);
      setGlobalMessage({
        type: "success",
        text: response.message || "Your password has been successfully updated. Redirecting...",
      });
      setTimeout(() => {
        setIsLoading(false);
        // Redirect to sign in page, passing the success message in the router state
        navigate("/signin", {
          state: { verificationSuccess: "Your credentials have been securely reset. Please sign in." },
        });
      }, 1800);
    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: "error",
        text: err.message || "Password update transaction failed. Please try again.",
      });
    }
  };

  return (
    <AuthLayout>
      <AnimatedStagger type="slide-up" interval={60} duration={800}>
        {/* Header Block */}
        <div className="auth-header">
          <h1 className="auth-title">Password Mainframe</h1>
          <p className="auth-subtitle">
            {step === 1 && "Request secure recovery credentials"}
            {step === 2 && "Enter the 6-digit authorization OTP"}
            {step === 3 && "Configure new secure access password"}
          </p>
        </div>

        {/* Global Toast Alert */}
        {globalMessage && (
          <Shake trigger={globalMessage} active={globalMessage.type === "error"}>
            <div className={`custom-alert ${globalMessage.type}`}>
              <div className="custom-alert-icon">
                {globalMessage.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>
              <div className="custom-alert-text">{globalMessage.text}</div>
            </div>
          </Shake>
        )}

        {/* Dynamic Card wizard steps */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOTP} noValidate>
            <Shake trigger={errors.email} active={!!errors.email}>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">
                  Recovery Email Address
                </label>
                <div className="input-container">
                  <span className="input-icon-left">
                    <Mail size={18} />
                  </span>
                  <input
                    id="email-input"
                    type="email"
                    className={`input-field ${errors.email ? "input-error" : ""}`}
                    placeholder="e.g. name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email)
                        setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.email && (
                  <span className="form-error-msg" role="alert">
                    <AlertCircle size={14} /> {errors.email}
                  </span>
                )}
              </div>
            </Shake>

            <PopInteractive scale={0.97} hoverScale={1.01}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", marginTop: "1rem" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Authenticating Mailbox...
                  </>
                ) : (
                  <>
                    Request Secure OTP <ArrowRight size={18} />
                  </>
                )}
              </button>
            </PopInteractive>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOTP} noValidate>
            <Shake trigger={errors.otp} active={!!errors.otp}>
              <div className="form-group">
                <label className="form-label" htmlFor="otp-input">
                  6-Digit Verification OTP
                </label>
                <div className="input-container">
                  <span className="input-icon-left">
                    <ShieldCheck size={18} />
                  </span>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    pattern="\d*"
                    className={`input-field ${errors.otp ? "input-error" : ""}`}
                    placeholder="••••••"
                    style={{ letterSpacing: "8px", textAlign: "center", fontSize: "1.2rem", fontWeight: 700 }}
                    value={otp}
                    onChange={(e) => {
                      // Allow only digits
                      const val = e.target.value.replace(/\D/g, "");
                      setOtp(val);
                      if (errors.otp)
                        setErrors((prev) => ({ ...prev, otp: null }));
                    }}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.otp && (
                  <span className="form-error-msg" role="alert">
                    <AlertCircle size={14} /> {errors.otp}
                  </span>
                )}
              </div>
            </Shake>

            <PopInteractive scale={0.97} hoverScale={1.01}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", marginTop: "1rem" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Authorizing OTP...
                  </>
                ) : (
                  <>
                    Verify OTP Credentials <ArrowRight size={18} />
                  </>
                )}
              </button>
            </PopInteractive>

            {/* Back to Step 1 trigger */}
            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setStep(1);
                  setErrors({});
                  setGlobalMessage(null);
                }}
                disabled={isLoading}
              >
                Use a different email address
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            {/* New Password */}
            <Shake trigger={errors.password} active={!!errors.password}>
              <div className="form-group">
                <label className="form-label" htmlFor="password-input">
                  New Secure Password
                </label>
                <div className="input-container">
                  <span className="input-icon-left">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    className={`input-field ${errors.password ? "input-error" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error-msg" role="alert">
                    <AlertCircle size={14} /> {errors.password}
                  </span>
                )}
              </div>
            </Shake>

            {/* Confirm New Password */}
            <Shake trigger={errors.confirmPassword} active={!!errors.confirmPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password-input">
                  Confirm Password
                </label>
                <div className="input-container">
                  <span className="input-icon-left">
                    <KeyRound size={18} />
                  </span>
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`input-field ${errors.confirmPassword ? "input-error" : ""}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="form-error-msg" role="alert">
                    <AlertCircle size={14} /> {errors.confirmPassword}
                  </span>
                )}
              </div>
            </Shake>

            {/* Premium Requirement Checklist Block */}
            <div
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.25rem",
                marginBottom: "1.5rem",
                marginTop: "0.5rem",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-secondary)",
                  marginBottom: "0.75rem",
                }}
              >
                Security Standards Requirement Checklist
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <li
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: requirements.minLength
                      ? "var(--success)"
                      : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>
                    {requirements.minLength ? "🟢" : "⚪"}
                  </span>
                  At least 8 robust characters long
                </li>
                <li
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: requirements.hasUpper
                      ? "var(--success)"
                      : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>
                    {requirements.hasUpper ? "🟢" : "⚪"}
                  </span>
                  At least one uppercase letter (A-Z)
                </li>
                <li
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: requirements.hasLower
                      ? "var(--success)"
                      : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>
                    {requirements.hasLower ? "🟢" : "⚪"}
                  </span>
                  At least one lowercase letter (a-z)
                </li>
                <li
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: requirements.hasNumber
                      ? "var(--success)"
                      : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>
                    {requirements.hasNumber ? "🟢" : "⚪"}
                  </span>
                  At least one numeric digit (0-9)
                </li>
                <li
                  style={{
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: requirements.hasSpecial
                      ? "var(--success)"
                      : "var(--text-secondary)",
                    transition: "color 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>
                    {requirements.hasSpecial ? "🟢" : "⚪"}
                  </span>
                  At least one unique symbol (!@#$ etc.)
                </li>
              </ul>
            </div>

            <PopInteractive scale={0.97} hoverScale={1.01}>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Synchronizing Mainframe...
                  </>
                ) : (
                  <>
                    Reset Access Credentials <ArrowRight size={18} />
                  </>
                )}
              </button>
            </PopInteractive>
          </form>
        )}

        <div className="divider">SECURE SYSTEM</div>

        <div className="auth-footer">
          Remembered password? <Link to="/signin">Sign In</Link>
        </div>
      </AnimatedStagger>
    </AuthLayout>
  );
};

export default ForgotPassword;
