import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
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

const ReactivateAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lazy pre-fill entered email from login transition state
  const [email, setEmail] = useState(() => location.state?.email || "");

  // Wizard state: 1 = Email, 2 = OTP, 3 = Activated
  const [step, setStep] = useState(1);

  // Form states
  const [otp, setOtp] = useState("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState(null);

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
      const response = await ApiService.reactivateSendOTP(email);
      setGlobalMessage({
        type: "success",
        text: response.message || "A secure reactivation OTP has been sent to your email.",
      });
      setTimeout(() => {
        setStep(2);
        setIsLoading(false);
        setGlobalMessage(null);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: "error",
        text: err.message || "Email validation failed. No deactivated account matching this email found.",
      });
    }
  };

  // Step 2: Verify OTP & Activate Submit Handler
  const handleVerifyAndReactivate = async (e) => {
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
      // 1. Verify the reactivation OTP
      const verifyResponse = await ApiService.reactivateVerifyOTP(email, otp);
      
      // 2. Confirm reactivation
      const confirmResponse = await ApiService.reactivateConfirm(email, otp);

      setGlobalMessage({
        type: "success",
        text: confirmResponse.message || "Account reactivated successfully. Redirecting...",
      });

      setStep(3);
      setIsLoading(false);
      setGlobalMessage(null);

      // Redirect after a brief moment to show success
      setTimeout(() => {
        navigate("/signin", {
          state: { verificationSuccess: "Your account has been successfully reactivated! Please sign in." },
        });
      }, 2500);

    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: "error",
        text: err.message || "Reactivation code verification failed. Invalid or expired OTP.",
      });
    }
  };

  return (
    <AuthLayout>
      <AnimatedStagger type="slide-up" interval={60} duration={800}>
        {/* Header Block */}
        <div className="auth-header">
          <h1 className="auth-title">Reactivate Account</h1>
          <p className="auth-subtitle">
            {step === 1 && "Request dynamic authorization credentials"}
            {step === 2 && "Enter the 6-digit account reactivation OTP"}
            {step === 3 && "Vault portal access restored successfully"}
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

        {/* Wizard Forms */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleSendOTP} noValidate>
            <Shake trigger={errors.email} active={!!errors.email}>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">
                  Your Account Email Address
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
                    Retrieving Accounts...
                  </>
                ) : (
                  <>
                    Send Reactivation OTP <ArrowRight size={18} />
                  </>
                )}
              </button>
            </PopInteractive>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyAndReactivate} noValidate>
            <Shake trigger={errors.otp} active={!!errors.otp}>
              <div className="form-group">
                <label className="form-label" htmlFor="otp-input">
                  6-Digit Reactivation OTP
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
                    Restoring Portal...
                  </>
                ) : (
                  <>
                    Confirm Reactivation <ArrowRight size={18} />
                  </>
                )}
              </button>
            </PopInteractive>

            {/* Back button */}
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
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <Animated type="bounce" duration={1200} style={{ display: "inline-block" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--success-bg)",
                  border: "2px solid var(--success)",
                  color: "var(--success)",
                  boxShadow: "0 0 25px rgba(16, 185, 129, 0.25)",
                  marginBottom: "1.5rem",
                }}
              >
                <CheckCircle2 size={40} />
              </div>
            </Animated>

            <h2 className="auth-title" style={{ color: "var(--success)", marginBottom: "0.75rem" }}>
              Portal Access Restored
            </h2>
            <p
              className="auth-subtitle"
              style={{
                maxWidth: "340px",
                margin: "0 auto 2rem auto",
                fontSize: "0.9rem",
                lineHeight: "1.5",
              }}
            >
              Your account reactivation is verified. Restoring secure savings vaults and ledger links. Please wait...
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", alignItems: "center" }}>
              <span className="spinner" style={{ borderTopColor: "var(--success)" }}></span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Redirecting to Secure Gate...
              </span>
            </div>
          </div>
        )}

        <div className="divider">SECURE SYSTEM</div>

        <div className="auth-footer">
          Remembered credentials? <Link to="/signin">Sign In</Link>
        </div>
      </AnimatedStagger>
    </AuthLayout>
  );
};

export default ReactivateAccount;
