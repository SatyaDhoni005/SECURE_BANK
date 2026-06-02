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
} from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { ApiService } from "../services/Api";
import {
  Animated,
  AnimatedStagger,
  Shake,
  PopInteractive,
} from "../components/Animated";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Lazy state initializer to fetch router state without useEffect cascading re-renders
  const [globalMessage, setGlobalMessage] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("timeout") === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
      return {
        type: "error",
        text: "Session expired due to 15 minutes of inactivity. Please login again.",
      };
    }
    if (location.state?.verificationSuccess) {
      // Clear location state to prevent repeating on reload
      window.history.replaceState({}, document.title);
      return {
        type: "success",
        text: location.state.verificationSuccess,
      };
    }
    return null;
  });

  // Client-side validations
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email address is required to access your account.";
    } else if (!emailRegex.test(email)) {
      newErrors.email =
        "Please provide a valid corporate or personal email format.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
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
      // Simulate authentication request
      const response = await ApiService.signIn(email, password);

      setIsLoginSuccess(true);

      // Save user and JWT token details to localStorage
      localStorage.setItem('secure_bank_access_token', response.access);
      localStorage.setItem('secure_bank_refresh_token', response.refresh);
      localStorage.setItem('secure_bank_user', JSON.stringify(response.user));

      // Redirect after a brief moment to showcase the success transition
      setTimeout(() => {
        setIsLoading(false);
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      setGlobalMessage({
        type: "error",
        text:
          err.message ||
          "An unexpected authentication error occurred. Please contact customer service.",
      });
    }
  };

  if (isLoginSuccess) {
    return (
      <AuthLayout>
        <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
          <Animated
            type="bounce"
            duration={1200}
            style={{ display: "inline-block" }}
          >
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

          <AnimatedStagger type="slide-up" interval={150} delay={300}>
            <h2
              className="auth-title"
              style={{ color: "var(--success)", marginBottom: "0.75rem" }}
            >
              Connection Secured
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
              Access granted. Synchronizing high-security banking credentials
              with mainframes...
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.6rem",
                alignItems: "center",
              }}
            >
              <span
                className="spinner"
                style={{ borderTopColor: "var(--success)" }}
              ></span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                Establishing Encrypted Session...
              </span>
            </div>
          </AnimatedStagger>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AnimatedStagger type="slide-up" interval={60} duration={800}>
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to securely manage your banking portal
          </p>
        </div>

        {/* Global Toast Alert banner */}
        {globalMessage && (
          <Shake
            trigger={globalMessage}
            active={globalMessage.type === "error"}
          >
            <div className={`custom-alert ${globalMessage.type}`}>
              <div className="custom-alert-icon">
                {globalMessage.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
              </div>
              <div className="custom-alert-text">
                {globalMessage.text && globalMessage.text.includes("[Reactivate Account]") ? (
                  <>
                    This account is currently deactivated.{" "}
                    <Link
                      to="/reactivate-account"
                      state={{ email }}
                      style={{
                        color: "inherit",
                        textDecoration: "underline",
                        fontWeight: "bold",
                        marginLeft: "0.25rem",
                      }}
                    >
                      Reactivate Account
                    </Link>
                  </>
                ) : (
                  globalMessage.text
                )}
              </div>
            </div>
          </Shake>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
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

          {/* Password Field */}
          <Shake trigger={errors.password} active={!!errors.password}>
            <div className="form-group">
              <div className="form-label">
                <label htmlFor="password-input">Password</label>
                <Link
                  to="/forgot-password"
                  className="forgot-link"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="input-container">
                <span className="input-icon-left">
                  <Lock size={18} />
                </span>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className={`input-field input-field-password ${errors.password ? "input-error" : ""}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span
                  id="password-error"
                  className="form-error-msg"
                  role="alert"
                >
                  <AlertCircle size={14} /> {errors.password}
                </span>
              )}
            </div>
          </Shake>

          {/* Remember Me checkbox */}
          <div className="form-actions">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              Remember this device
            </label>
          </div>

          {/* Action Button */}
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
                  Securing Connection...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </PopInteractive>
        </form>

        {/* Footer Info Box */}
        <div className="divider">SECURE GATEWAY</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: "1.25rem",
              display: "flex",
              alignItems: "center",
            }}
            aria-hidden="true"
          >
            🔒
          </span>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              Bank-grade 256-bit encryption
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                lineHeight: "1.3",
              }}
            >
              Your information is protected with enterprise-level security.
            </span>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </AnimatedStagger>
    </AuthLayout>
  );
};

export default SignIn;
