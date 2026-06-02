import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Landmark,
  LogOut,
  User,
  Lock,
  ShieldAlert,
  HelpCircle,
  ArrowLeft,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  PhoneCall,
  Clock,
  KeyRound,
  Download,
  Smartphone,
  FileText,
  Activity,
  Laptop,
  Eye,
  EyeOff,
} from "lucide-react";
import { ApiService } from "../services/Api";
import {
  Animated,
  AnimatedStagger,
  Shake,
  PopInteractive,
} from "../components/Animated";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // User detail state from localStorage
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("secure_bank_user");
    return userStr ? JSON.parse(userStr) : { name: "Valued Customer", email: "client@securebank.com" };
  });

  // Dropdown states (continuous navbar UX)
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Deactivation Wizard States
  const [deactivateStep, setDeactivateStep] = useState(1); // 1 = Warning, 2 = Enter OTP, 3 = Success
  const [deactivateOtp, setDeactivateOtp] = useState("");
  const [deactivateError, setDeactivateError] = useState(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Change Password States
  const [changePasswordStep, setChangePasswordStep] = useState(0); // 0 = Closed, 1 = Enter Password, 2 = Enter OTP, 3 = Success
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordOtp, setChangePasswordOtp] = useState("");
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Live password strength checklist (derived, pure render scope)
  const passwordRequirements = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
  };

  // Dynamic device detection helper
  const getDeviceDetails = () => {
    const ua = navigator.userAgent;
    let browser = "Web Browser";
    let os = "Device OS";

    if (ua.includes("Firefox")) browser = "Mozilla Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "Internet Explorer";
    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Safari")) browser = "Apple Safari";

    if (ua.includes("Windows")) os = "Windows Desktop";
    else if (ua.includes("Macintosh")) os = "macOS Desktop";
    else if (ua.includes("Android")) os = "Android Mobile";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS Mobile";
    else if (ua.includes("Linux")) os = "Linux Desktop";

    return `${browser} / ${os}`;
  };

  const handleTriggerChangePasswordOTP = async (e) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
    if (!newPassword) {
      setChangePasswordError("Password is required.");
      return;
    } else if (!allRequirementsMet) {
      setChangePasswordError("New password must satisfy all 5 requirements listed below.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("Passwords do not match. Please check.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.changePasswordSendOTP();
      setChangePasswordSuccess(response.message || "A secure change-password OTP has been sent to your email.");
      setTimeout(() => {
        setChangePasswordStep(2);
        setIsLoading(false);
        setChangePasswordSuccess(null);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setChangePasswordError(err.message || "Failed to dispatch change password OTP. Please try again.");
    }
  };

  const handleConfirmChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError(null);

    if (!changePasswordOtp) {
      setChangePasswordError("Secure verification OTP is required.");
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.changePasswordConfirm(changePasswordOtp, newPassword);
      setChangePasswordStep(3);
      setIsLoading(false);

      // Log security event for real notifications!
      try {
        const email = user ? user.email : "user";
        const customAlerts = JSON.parse(localStorage.getItem(`security_alerts_${email}`) || "[]");
        customAlerts.push({
          id: `sec-pwd-change-${Date.now()}`,
          type: "success",
          title: "🔑 Password Updated",
          message: "Your master account password was successfully updated.",
          time: "Just now",
          timestamp: Date.now()
        });
        localStorage.setItem(`security_alerts_${email}`, JSON.stringify(customAlerts));
      } catch (err) {
        console.error(err);
      }

      // Perform clean logout redirect after 2.5 seconds to enforce re-login with new password
      setTimeout(() => {
        localStorage.removeItem("secure_bank_access_token");
        localStorage.removeItem("secure_bank_refresh_token");
        localStorage.removeItem("secure_bank_user");
        navigate("/signin", {
          state: { verificationSuccess: "Your password has been changed. Please sign in with your new credentials." },
        });
      }, 2500);
    } catch (err) {
      setIsLoading(false);
      setChangePasswordError(err.message || "Failed to change password. Invalid or expired OTP.");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("secure_bank_access_token");
    localStorage.removeItem("secure_bank_refresh_token");
    localStorage.removeItem("secure_bank_user");
    navigate("/signin");
  };

  // Triggers dispatching a secure OTP for account deactivation
  const handleTriggerDeactivationOTP = async () => {
    setDeactivateError(null);
    setIsLoading(true);
    try {
      const response = await ApiService.deactivateSendOTP();
      setDeactivateSuccess(response.message || "Authorization OTP sent to your email.");
      setTimeout(() => {
        setDeactivateStep(2);
        setIsLoading(false);
        setDeactivateSuccess(null);
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setDeactivateError(err.message || "Failed to dispatch deactivation OTP. Please try again.");
    }
  };

  // Authorizes the final deactivation request
  const handleConfirmDeactivation = async (e) => {
    e.preventDefault();
    setDeactivateError(null);

    if (!deactivateOtp) {
      setDeactivateError("Security OTP verification code is required.");
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.deactivateAccount(deactivateOtp);
      setDeactivateStep(3);
      setIsLoading(false);

      // Perform clean logout redirect after 2 seconds
      setTimeout(() => {
        localStorage.removeItem("secure_bank_access_token");
        localStorage.removeItem("secure_bank_refresh_token");
        localStorage.removeItem("secure_bank_user");
        navigate("/signin", {
          state: { verificationSuccess: "Your wealth account has been deactivated. Online session suspended." },
        });
      }, 2500);
    } catch (err) {
      setIsLoading(false);
      setDeactivateError(err.message || "Deactivation authorization failed. Invalid OTP code.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: "var(--sans)",
        color: "var(--text-primary)",
      }}
    >
      {/* Premium Dark Navigation Bar (Matching Dashboard exactly for consistency) */}
      <nav
        style={{
          backgroundColor: "#0A2540",
          padding: isMobile ? "1rem" : "1.25rem 2rem",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.25rem",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              marginRight: "0.25rem",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                padding: "0.5rem",
                borderRadius: "8px",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Landmark size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: isMobile ? "1.05rem" : "1.15rem", letterSpacing: "-0.5px" }}>SECURE BANK</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.75rem" : "1.5rem" }} ref={dropdownRef}>
          {!isMobile && (
            <div style={{ textAlign: "right", display: "block" }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>Secure Session</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{user.name}</div>
            </div>
          )}

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "var(--accent)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(16, 185, 129, 0.25)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </button>

            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: "0",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(10, 37, 64, 0.15), 0 1px 3px rgba(10, 37, 64, 0.05)",
                  border: "1px solid var(--border-color)",
                  width: "210px",
                  padding: "0.75rem",
                  zIndex: 1000,
                  animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
              >
                <div style={{ padding: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)" }}>{user.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Personal Wealth Account
                  </div>
                </div>

                <div style={{ borderBottom: "1px solid var(--border-color)", marginBottom: "0.5rem" }}></div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/dashboard");
                  }}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: "var(--primary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    e.currentTarget.style.color = "var(--border-focus)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                >
                  <Landmark size={16} /> Client Mainframe
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleSignOut();
                  }}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    backgroundColor: "#EF4444",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginTop: "0.25rem",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.2)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#DC2626";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(239, 68, 68, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#EF4444";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(239, 68, 68, 0.2)";
                  }}
                >
                  <LogOut size={16} /> Secure Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Settings Body */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: isMobile ? "1.5rem 1rem" : "3rem 2rem" }}>
        <AnimatedStagger type="slide-up" interval={80} duration={900}>
          {/* Header Description */}
          <div style={{ marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "2.25rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.8px", marginBottom: "0.4rem" }}>
                Portal Settings
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Configure and audit secure account permissions, profile details, and security lifecycle configurations.
              </p>
            </div>
          </div>

          {/* Dual Column Layout */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "250px 1fr", gap: isMobile ? "1.5rem" : "2.5rem", alignItems: "start" }}>
            {/* Left Column: Vertical Sub-Navigation Tabs */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
                padding: "0.75rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {/* Profile Tab */}
                <button
                  onClick={() => setActiveTab("profile")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.8rem 1rem",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "left",
                    backgroundColor: activeTab === "profile" ? "var(--bg-primary)" : "transparent",
                    color: activeTab === "profile" ? "var(--accent)" : "var(--primary)",
                    transition: "all 0.2s",
                  }}
                >
                  <User size={18} /> Account Profile
                </button>

                {/* Security Tab */}
                <button
                  onClick={() => setActiveTab("security")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.8rem 1rem",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "left",
                    backgroundColor: activeTab === "security" ? "var(--bg-primary)" : "transparent",
                    color: activeTab === "security" ? "var(--accent)" : "var(--primary)",
                    transition: "all 0.2s",
                  }}
                >
                  <Lock size={18} /> Vault Security
                </button>

                {/* Account Management Tab */}
                <button
                  onClick={() => setActiveTab("management")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.8rem 1rem",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "left",
                    backgroundColor: activeTab === "management" ? "var(--bg-primary)" : "transparent",
                    color: activeTab === "management" ? "var(--accent)" : "var(--primary)",
                    transition: "all 0.2s",
                  }}
                >
                  <ShieldAlert size={18} /> Wealth Management
                </button>

                {/* Support Tab */}
                <button
                  onClick={() => setActiveTab("support")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.8rem 1rem",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textAlign: "left",
                    backgroundColor: activeTab === "support" ? "var(--bg-primary)" : "transparent",
                    color: activeTab === "support" ? "var(--accent)" : "var(--primary)",
                    transition: "all 0.2s",
                  }}
                >
                  <HelpCircle size={18} /> Private Concierge
                </button>
              </div>
            </div>

            {/* Right Column: Displaying Tab Details */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                border: "1px solid var(--border-color)",
                padding: isMobile ? "1.5rem" : "2.5rem",
                minHeight: isMobile ? "auto" : "420px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              }}
            >
              {/* Profile Tab Details */}
              {activeTab === "profile" && (
                <Animated type="fade" duration={300}>
                  <h2 style={{ fontSize: "1.35rem", color: "#0A2540", fontWeight: 800, marginBottom: "0.5rem" }}>
                    Account Profile Details
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>
                    Verified legal profile configuration details. Contact vault compliance desk to modify.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                        Legal Full Name
                      </label>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)" }}>{user.name}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                        Email Address
                      </label>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)" }}>{user.email}</div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-color)", paddingGap: "1.5rem", gridColumn: isMobile ? "span 1" : "span 2", margin: "0.5rem 0" }}></div>

                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                        Account Status
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", color: "var(--success)", fontWeight: 700 }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></span> ACTIVE
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.3rem" }}>
                        Audit Registration Date
                      </label>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>
                        {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                </Animated>
              )}

              {/* Vault Security Tab Details */}
              {activeTab === "security" && (
                <Animated type="fade" duration={300}>
                  <h2 style={{ fontSize: "1.35rem", color: "#0A2540", fontWeight: 800, marginBottom: "0.5rem" }}>
                    Vault Security Audits
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>
                    Configure credentials, transaction PINs, and audit active sessions.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Action Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.25rem" }}>
                      {/* Change Password */}
                      {changePasswordStep === 0 && (
                        <div style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px", background: "white" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <KeyRound size={18} style={{ color: "var(--accent)" }} />
                            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>Change Password</h4>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 1rem 0", lineHeight: "1.4" }}>
                            Update your web portal security password regularly.
                          </p>
                          <button
                            onClick={() => setChangePasswordStep(1)}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              border: "1px solid var(--accent)",
                              borderRadius: "6px",
                              backgroundColor: "white",
                              color: "var(--accent)",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "white";
                            }}
                          >
                            Configure Password
                          </button>
                        </div>
                      )}

                      {changePasswordStep === 1 && (
                        <form onSubmit={handleTriggerChangePasswordOTP} style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px", background: "white", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <KeyRound size={18} style={{ color: "var(--accent)" }} />
                            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>Configure New Password</h4>
                          </div>

                          {changePasswordError && (
                            <div className="custom-alert error" style={{ padding: "0.6rem 0.8rem", fontSize: "0.75rem", margin: 0 }}>
                              <AlertCircle size={14} />
                              <div className="custom-alert-text">{changePasswordError}</div>
                            </div>
                          )}

                          {changePasswordSuccess && (
                            <div className="custom-alert success" style={{ padding: "0.6rem 0.8rem", fontSize: "0.75rem", margin: 0 }}>
                              <CheckCircle2 size={14} />
                              <div className="custom-alert-text">{changePasswordSuccess}</div>
                            </div>
                          )}

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>New Password</label>
                            <div className="input-container" style={{ position: "relative" }}>
                              <input
                                type={showNewPassword ? "text" : "password"}
                                className="input-field"
                                style={{ paddingRight: "2.5rem", fontSize: "0.85rem", height: "36px" }}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isLoading}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                  position: "absolute",
                                  right: "0.5rem",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                              >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>Confirm Password</label>
                            <div className="input-container" style={{ position: "relative" }}>
                              <input
                                type={showConfirmNewPassword ? "text" : "password"}
                                className="input-field"
                                style={{ paddingRight: "2.5rem", fontSize: "0.85rem", height: "36px" }}
                                placeholder="••••••••"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                disabled={isLoading}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                style={{
                                  position: "absolute",
                                  right: "0.5rem",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                              >
                                {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Requirements Checklist */}
                          <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Requirements:</div>
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.25rem" }}>
                              <div style={{ fontSize: "0.7rem", color: passwordRequirements.minLength ? "var(--success)" : "var(--text-muted)" }}>
                                {passwordRequirements.minLength ? "🟢" : "⚪"} 8+ Characters
                              </div>
                              <div style={{ fontSize: "0.7rem", color: passwordRequirements.hasUpper ? "var(--success)" : "var(--text-muted)" }}>
                                {passwordRequirements.hasUpper ? "🟢" : "⚪"} Uppercase (A-Z)
                              </div>
                              <div style={{ fontSize: "0.7rem", color: passwordRequirements.hasLower ? "var(--success)" : "var(--text-muted)" }}>
                                {passwordRequirements.hasLower ? "🟢" : "⚪"} Lowercase (a-z)
                              </div>
                              <div style={{ fontSize: "0.7rem", color: passwordRequirements.hasNumber ? "var(--success)" : "var(--text-muted)" }}>
                                {passwordRequirements.hasNumber ? "🟢" : "⚪"} Number (0-9)
                              </div>
                              <div style={{ fontSize: "0.7rem", color: passwordRequirements.hasSpecial ? "var(--success)" : "var(--text-muted)", gridColumn: isMobile ? "span 1" : "span 2" }}>
                                {passwordRequirements.hasSpecial ? "🟢" : "⚪"} Special character
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                            <button
                              type="submit"
                              disabled={isLoading}
                              style={{
                                flex: 1,
                                backgroundColor: "var(--accent)",
                                color: "white",
                                border: "none",
                                padding: "0.5rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0d9488"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                            >
                              {isLoading ? "Sending..." : "Request OTP"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChangePasswordStep(0);
                                setNewPassword("");
                                setConfirmNewPassword("");
                                setChangePasswordError(null);
                              }}
                              disabled={isLoading}
                              style={{
                                flex: 1,
                                backgroundColor: "white",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                color: "var(--primary)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {changePasswordStep === 2 && (
                        <form onSubmit={handleConfirmChangePassword} style={{ padding: "1.25rem", border: "1px solid #D97706", borderRadius: "12px", background: "#FFFBF0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <Shield size={18} style={{ color: "#D97706" }} />
                            <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#D97706" }}>Authorize Password OTP</h4>
                          </div>
                          
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                            A secure code has been sent to **{user.email}**. Enter the code to authorize credential update.
                          </p>

                          {changePasswordError && (
                            <div className="custom-alert error" style={{ padding: "0.6rem 0.8rem", fontSize: "0.75rem", margin: 0 }}>
                              <AlertCircle size={14} />
                              <div className="custom-alert-text">{changePasswordError}</div>
                            </div>
                          )}

                          <div className="form-group" style={{ margin: 0 }}>
                            <input
                              type="text"
                              maxLength={6}
                              className="input-field"
                              placeholder="Enter 6-Digit OTP"
                              style={{ letterSpacing: "4px", textAlign: "center", fontWeight: 700, fontSize: "0.9rem", height: "38px" }}
                              value={changePasswordOtp}
                              onChange={(e) => setChangePasswordOtp(e.target.value.replace(/\D/g, ""))}
                              disabled={isLoading}
                              required
                            />
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="submit"
                              disabled={isLoading}
                              style={{
                                flex: 1,
                                backgroundColor: "#D97706",
                                color: "white",
                                border: "none",
                                padding: "0.5rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer"
                              }}
                            >
                              {isLoading ? "Confirming..." : "Confirm Change"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChangePasswordStep(0);
                                setNewPassword("");
                                setConfirmNewPassword("");
                                setChangePasswordOtp("");
                                setChangePasswordError(null);
                              }}
                              disabled={isLoading}
                              style={{
                                flex: 1,
                                backgroundColor: "white",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                color: "var(--primary)",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {changePasswordStep === 3 && (
                        <div style={{ padding: "1.25rem", border: "1px solid var(--success)", borderRadius: "12px", backgroundColor: "var(--success-bg)", textAlign: "center" }}>
                          <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.85rem" }}>
                            Password updated successfully. Logging out...
                          </span>
                        </div>
                      )}

                      {/* Forgot Password Recovery */}
                      <div style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px", background: "white" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <Shield size={18} style={{ color: "var(--accent)" }} />
                          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>Forgot Password Recovery</h4>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 1rem 0", lineHeight: "1.4" }}>
                          Setup backup email addresses for credential restoration.
                        </p>
                        <button
                          onClick={() => navigate("/forgot-password", { state: { email: user.email } })}
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            border: "1px solid var(--accent)",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            color: "var(--accent)",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                          }}
                        >
                          Configure Recovery
                        </button>
                      </div>

                      {/* Create Transaction PIN */}
                      <div style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px", background: "white" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <Lock size={18} style={{ color: "var(--accent)" }} />
                          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>Create Transaction PIN</h4>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 1rem 0", lineHeight: "1.4" }}>
                          Establish a 4-digit PIN for high-value savings outbound transfers.
                        </p>
                        <button style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700, border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }} disabled>
                          Create PIN
                        </button>
                      </div>

                      {/* Reset Transaction PIN */}
                      <div style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px", background: "white" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <Lock size={18} style={{ color: "var(--accent)" }} />
                          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>Reset Transaction PIN</h4>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 1rem 0", lineHeight: "1.4" }}>
                          Restore or reset access parameters for your transaction authorization PIN.
                        </p>
                        <button style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700, border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }} disabled>
                          Reset PIN
                        </button>
                      </div>
                    </div>

                    {/* Security Activity & Devices */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
                      <div>
                        <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Activity size={16} style={{ color: "var(--accent)" }} /> Security Activity
                        </h4>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.25rem" }}>
                            <span>Password Changed</span>
                            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Never</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.25rem" }}>
                            <span>2FA / MFA verification</span>
                            <span style={{ color: "#10B981", fontWeight: 700 }}>ACTIVE</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Laptop size={16} style={{ color: "var(--accent)" }} /> Login Devices
                        </h4>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.25rem" }}>
                            <span>{getDeviceDetails()}</span>
                            <span style={{ color: "#10B981", fontWeight: 700 }}>Current Session</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Animated>
              )}

              {/* Wealth Management & Deactivation Tab Details */}
              {activeTab === "management" && (
                <Animated type="fade" duration={300}>
                  <h2 style={{ fontSize: "1.35rem", color: "#0A2540", fontWeight: 800, marginBottom: "0.5rem" }}>
                    Wealth Account Management
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>
                    Configure active status, download statements, and access account life cycle parameters.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Account Status Card */}
                    <div style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "12px", backgroundColor: "var(--bg-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--primary)", fontSize: "0.9rem", fontWeight: 700 }}>Account Status</h4>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>Verify active status verification in banking database.</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--success)", fontWeight: 700, backgroundColor: "white", padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></span> ACTIVE
                      </div>
                    </div>

                    {/* Account Lifecycle Management card (Deactivation Wizard) */}
                    <div style={{
                      padding: "1.5rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      backgroundColor: "white"
                    }}>
                      <h3 style={{ fontSize: "1.05rem", color: "var(--primary)", fontWeight: 800, margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        Account Lifecycle Management
                      </h3>
                      
                      {/* Deactivation state rendering */}
                      {deactivateStep === 1 && (
                        <div style={{ padding: "1.25rem", border: "1px solid #f1f5f9", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
                          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", fontWeight: 700, color: "#EF4444" }}>⚠️ Deactivate Account</h4>
                          <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                            Temporarily disable access to your banking portal. Your visual balance will be suspended, and ledger transactions can be restored securely at any time.
                          </p>

                          {deactivateError && (
                            <div className="custom-alert error" style={{ marginBottom: "1.25rem" }}>
                              <AlertCircle size={16} />
                              <div className="custom-alert-text">{deactivateError}</div>
                            </div>
                          )}

                          {deactivateSuccess && (
                            <div className="custom-alert success" style={{ marginBottom: "1.25rem" }}>
                              <CheckCircle2 size={16} />
                              <div className="custom-alert-text">{deactivateSuccess}</div>
                            </div>
                          )}

                          <PopInteractive scale={0.97} hoverScale={1.01} style={{ display: "inline-block", width: "auto" }}>
                            <button
                              onClick={handleTriggerDeactivationOTP}
                              disabled={isLoading}
                              style={{
                                backgroundColor: "#EF4444",
                                color: "white",
                                border: "none",
                                padding: "0.6rem 1.25rem",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.15)"
                              }}
                            >
                              {isLoading ? "Requesting OTP..." : "Deactivate Account"}
                            </button>
                          </PopInteractive>
                        </div>
                      )}

                      {deactivateStep === 2 && (
                        <form onSubmit={handleConfirmDeactivation} style={{ padding: "1.25rem", border: "1px solid #F5C2C2", borderRadius: "12px", backgroundColor: "#FFF8F8" }}>
                          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", fontWeight: 700, color: "#D93025" }}>Authorize Deactivation OTP</h4>
                          <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: "1.4", marginBottom: "1rem" }}>
                            A secure code has been sent to **{user.email}**. Enter the code to authorize suspension.
                          </p>

                          {deactivateError && (
                            <div className="custom-alert error" style={{ marginBottom: "1.25rem" }}>
                              <AlertCircle size={16} />
                              <div className="custom-alert-text">{deactivateError}</div>
                            </div>
                          )}

                          <div className="form-group" style={{ marginBottom: "1rem" }}>
                            <input
                              type="text"
                              maxLength={6}
                              className="input-field"
                              placeholder="Enter 6-Digit OTP"
                              style={{ letterSpacing: "4px", textAlign: "center", fontWeight: 700 }}
                              value={deactivateOtp}
                              onChange={(e) => setDeactivateOtp(e.target.value.replace(/\D/g, ""))}
                              disabled={isLoading}
                              required
                            />
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button type="submit" disabled={isLoading} style={{ flex: 1, backgroundColor: "#EF4444", color: "white", border: "none", padding: "0.6rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                              {isLoading ? "Confirming..." : "Confirm Deactivate"}
                            </button>
                            <button type="button" onClick={() => setDeactivateStep(1)} disabled={isLoading} style={{ flex: 1, backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {deactivateStep === 3 && (
                        <div style={{ padding: "1.25rem", border: "1px solid var(--success)", borderRadius: "12px", backgroundColor: "var(--success-bg)", textAlign: "center" }}>
                          <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.85rem" }}>Portal Deactivated successfully. Redirecting...</span>
                        </div>
                      )}
                    </div>

                    {/* Secondary Actions Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "1rem" }}>
                      {/* Reactivate Account visual */}
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "12px", textAlign: "center" }}>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>Reactivate Account</h4>
                        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.3" }}>Self-service restore deactivated portals.</p>
                        <button style={{ width: "100%", padding: "0.4rem", fontSize: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }} disabled>
                          Restore Access
                        </button>
                      </div>

                      {/* Account Closure Request */}
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "12px", textAlign: "center" }}>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>Account Closure Request</h4>
                        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.3" }}>Submit ledger closure compliance request.</p>
                        <button style={{ width: "100%", padding: "0.4rem", fontSize: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }} disabled>
                          Close Account
                        </button>
                      </div>

                      {/* Download Statements */}
                      <div style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "12px", textAlign: "center" }}>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", color: "var(--primary)", fontWeight: 700 }}>Download Statements</h4>
                        <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.3" }}>Export certified active ledger sheets.</p>
                        <button style={{ width: "100%", padding: "0.4rem", fontSize: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "6px", backgroundColor: "#f8fafc", color: "var(--text-muted)", cursor: "not-allowed" }} disabled>
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </Animated>
              )}

              {/* Private Support / Concierge Tab Details */}
              {activeTab === "support" && (
                <Animated type="fade" duration={300}>
                  <h2 style={{ fontSize: "1.35rem", color: "#0A2540", fontWeight: 800, marginBottom: "0.5rem" }}>
                    Private Concierge Desk
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>
                    Direct line details to dedicated private banking wealth compliance and audit managers.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem" }}>
                    <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "12px" }}>
                      <PhoneCall size={20} style={{ color: "var(--accent)", marginBottom: "0.5rem" }} />
                      <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--primary)", fontSize: "0.85rem", fontWeight: 700 }}>Wealth Advisor Hotline</h4>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Instant zero-wait private client advisor desk.</p>
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent)" }}>+1 (800) 555-SECU</span>
                    </div>

                    <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "12px" }}>
                      <Clock size={20} style={{ color: "var(--accent)", marginBottom: "0.5rem" }} />
                      <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--primary)", fontSize: "0.85rem", fontWeight: 700 }}>Concierge Availability</h4>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Round-the-clock audit coverage.</p>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)" }}>24/7/365 Coverage Active</span>
                    </div>
                  </div>
                </Animated>
              )}
            </div>
          </div>
        </AnimatedStagger>
      </div>
    </div>
  );
};

export default Settings;
