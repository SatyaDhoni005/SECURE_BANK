import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, Lock, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Sparkles, Mail } from "lucide-react";
import { PopInteractive } from "../components/Animated";
import { ApiService } from "../services/Api";

const PinManagement = () => {
  const navigate = useNavigate();
  const [loadingUser, setLoadingUser] = useState(true);
  const [pinCreated, setPinCreated] = useState(false);
  const [activeTab, setActiveTab] = useState("change"); // change, reset

  // Create PIN fields
  const [createPin, setCreatePin] = useState("");
  const [confirmCreatePin, setConfirmCreatePin] = useState("");
  const [createOtp, setCreateOtp] = useState("");
  const [createOtpSent, setCreateOtpSent] = useState(false);

  // Change PIN fields
  const [currentPin, setCurrentPin] = useState("");
  const [changePin, setChangePin] = useState("");
  const [confirmChangePin, setConfirmChangePin] = useState("");
  const [changeOtp, setChangeOtp] = useState("");
  const [changeOtpSent, setChangeOtpSent] = useState(false);

  // Reset PIN fields
  const [password, setPassword] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [confirmResetPin, setConfirmResetPin] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);

  const [status, setStatus] = useState("idle"); // idle, loading, success
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedPinAlert, setGeneratedPinAlert] = useState("");

  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const response = await ApiService.getDashboardData();
        setPinCreated(response.pin_created);
      } catch (err) {
        setError("Failed to verify security configuration status.");
      } finally {
        setLoadingUser(false);
      }
    };
    checkPinStatus();
  }, []);

  const handleGeneratePin = (target) => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    if (target === "create") {
      setCreatePin(randomPin);
      setConfirmCreatePin(randomPin);
    } else if (target === "change") {
      setChangePin(randomPin);
      setConfirmChangePin(randomPin);
    } else if (target === "reset") {
      setResetPin(randomPin);
      setConfirmResetPin(randomPin);
    }
    setGeneratedPinAlert(`Auto-Generated Secure PIN: ${randomPin}. Please memorise this code before saving.`);
    setError("");
  };

  const handleCreateSendOtp = async () => {
    if (createPin.length !== 4 || !/^\d+$/.test(createPin)) {
      setError("Transaction PIN must be exactly 4 numeric digits.");
      return;
    }
    if (createPin !== confirmCreatePin) {
      setError("PIN codes do not match.");
      return;
    }

    setError("");
    setIsRequestingOtp(true);
    try {
      const response = await ApiService.sendPinOTP();
      setCreateOtpSent(true);
      setGeneratedPinAlert(response.message || "A secure configuration OTP has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to deliver secure authorization OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleCreatePinSubmit = async (e) => {
    e.preventDefault();
    if (!createOtp || createOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setError("");
    setGeneratedPinAlert("");
    setStatus("loading");
    try {
      await ApiService.createPIN(createPin, createOtp);
      setSuccessMessage("Your Transaction PIN has been successfully configured and activated.");
      setStatus("success");
      setPinCreated(true);
      setCreateOtpSent(false);
      setCreateOtp("");

      // Log security event for real notifications!
      try {
        const userStr = localStorage.getItem("secure_bank_user");
        const email = userStr ? JSON.parse(userStr).email : "user";
        const customAlerts = JSON.parse(localStorage.getItem(`security_alerts_${email}`) || "[]");
        customAlerts.push({
          id: `sec-pin-create-${Date.now()}`,
          type: "success",
          title: "🟢 PIN Configured",
          message: "Your new Transaction PIN was successfully created and activated.",
          time: "Just now",
          timestamp: Date.now()
        });
        localStorage.setItem(`security_alerts_${email}`, JSON.stringify(customAlerts));
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      setError(err.message || "Failed to configure Transaction PIN.");
      setStatus("idle");
    }
  };

  const handleChangeSendOtp = async () => {
    if (currentPin.length !== 4 || !/^\d+$/.test(currentPin)) {
      setError("Current PIN must be exactly 4 numeric digits.");
      return;
    }
    if (changePin.length !== 4 || !/^\d+$/.test(changePin)) {
      setError("New PIN must be exactly 4 numeric digits.");
      return;
    }
    if (changePin !== confirmChangePin) {
      setError("New PIN codes do not match.");
      return;
    }

    setError("");
    setIsRequestingOtp(true);
    try {
      const response = await ApiService.sendPinOTP();
      setChangeOtpSent(true);
      setGeneratedPinAlert(response.message || "A secure update OTP has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to deliver secure authorization OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    if (!changeOtp || changeOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setError("");
    setGeneratedPinAlert("");
    setStatus("loading");
    try {
      await ApiService.changePIN(currentPin, changePin, changeOtp);
      setSuccessMessage("Your Transaction PIN has been successfully updated.");
      setStatus("success");
      setCurrentPin("");
      setChangePin("");
      setConfirmChangePin("");
      setChangeOtpSent(false);
      setChangeOtp("");

      // Log security event for real notifications!
      try {
        const userStr = localStorage.getItem("secure_bank_user");
        const email = userStr ? JSON.parse(userStr).email : "user";
        const customAlerts = JSON.parse(localStorage.getItem(`security_alerts_${email}`) || "[]");
        customAlerts.push({
          id: `sec-pin-change-${Date.now()}`,
          type: "success",
          title: "🟢 PIN Changed",
          message: "Your Transaction PIN was successfully changed.",
          time: "Just now",
          timestamp: Date.now()
        });
        localStorage.setItem(`security_alerts_${email}`, JSON.stringify(customAlerts));
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      setError(err.message || "Failed to update Transaction PIN.");
      setStatus("idle");
    }
  };

  const handleResetSendOtp = async () => {
    if (!password) {
      setError("Please enter your account password to authorize reset.");
      return;
    }
    if (resetPin.length !== 4 || !/^\d+$/.test(resetPin)) {
      setError("New PIN must be exactly 4 numeric digits.");
      return;
    }
    if (resetPin !== confirmResetPin) {
      setError("New PIN codes do not match.");
      return;
    }

    setError("");
    setIsRequestingOtp(true);
    try {
      const response = await ApiService.sendPinOTP();
      setResetOtpSent(true);
      setGeneratedPinAlert(response.message || "A secure reset OTP has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to deliver secure authorization OTP.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleResetPinSubmit = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setError("");
    setGeneratedPinAlert("");
    setStatus("loading");
    try {
      await ApiService.resetPIN(password, resetPin, resetOtp);
      setSuccessMessage("Your Transaction PIN has been successfully reset using account credentials.");
      setStatus("success");
      setPassword("");
      setResetPin("");
      setConfirmResetPin("");
      setResetOtpSent(false);
      setResetOtp("");

      // Log security event for real notifications!
      try {
        const userStr = localStorage.getItem("secure_bank_user");
        const email = userStr ? JSON.parse(userStr).email : "user";
        const customAlerts = JSON.parse(localStorage.getItem(`security_alerts_${email}`) || "[]");
        customAlerts.push({
          id: `sec-pin-reset-${Date.now()}`,
          type: "success",
          title: "🟢 PIN Reset",
          message: "Your Transaction PIN was successfully reset using account credentials.",
          time: "Just now",
          timestamp: Date.now()
        });
        localStorage.setItem(`security_alerts_${email}`, JSON.stringify(customAlerts));
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      setError(err.message || "Failed to reset Transaction PIN.");
      setStatus("idle");
    }
  };

  const clearFormStates = () => {
    setError("");
    setGeneratedPinAlert("");
    setCreateOtpSent(false);
    setChangeOtpSent(false);
    setResetOtpSent(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", fontFamily: "var(--sans)", color: "var(--text-primary)" }}>
      {/* Top Navbar */}
      <nav style={{ backgroundColor: "#0A2540", padding: "1.25rem 2rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              marginRight: "0.5rem"
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Landmark size={20} style={{ color: "#10B981" }} />
            <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.5px" }}>SECURE BANK</span>
          </div>
        </div>
        <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 }}>Vault PIN Settings</span>
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: "550px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "24px", padding: "2.5rem", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)" }}>
          
          {loadingUser ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <span className="spinner" style={{ width: "40px", height: "40px", borderTopColor: "#10B981", marginBottom: "1rem" }}></span>
              <p style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>Auditing Security Mainframe...</p>
            </div>
          ) : status === "success" ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981", marginBottom: "1.5rem" }}>
                <CheckCircle2 size={40} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "0.5rem" }}>Security Synced</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: "1.5" }}>
                {successMessage}
              </p>
              <PopInteractive scale={0.98} hoverScale={1.02}>
                <button onClick={() => { setStatus("idle"); navigate("/dashboard"); }} className="btn-primary" style={{ width: "100%" }}>
                  Return to Dashboard
                </button>
              </PopInteractive>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.75rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.4rem" }}>
                  PIN Management
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Configure a robust 4-digit transaction authorization PIN with email OTP verification.
                </p>
              </div>

              {error && (
                <div className="custom-alert error" style={{ marginBottom: "1.5rem" }}>
                  <AlertCircle size={16} />
                  <div className="custom-alert-text">{error}</div>
                </div>
              )}

              {/* TABS (only if PIN is already created) */}
              {pinCreated && (
                <div style={{
                  display: "flex",
                  borderBottom: "2px solid var(--border-color)",
                  marginBottom: "1.75rem",
                  gap: "1.5rem"
                }}>
                  <button
                    onClick={() => { setActiveTab("change"); clearFormStates(); }}
                    style={{
                      padding: "0.75rem 0",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: activeTab === "change" ? "3px solid #10B981" : "3px solid transparent",
                      color: activeTab === "change" ? "#0A2540" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <RefreshCw size={14} /> Change PIN
                  </button>
                  <button
                    onClick={() => { setActiveTab("reset"); clearFormStates(); }}
                    style={{
                      padding: "0.75rem 0",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: activeTab === "reset" ? "3px solid #10B981" : "3px solid transparent",
                      color: activeTab === "reset" ? "#0A2540" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <KeyRound size={14} /> Reset PIN (Password)
                  </button>
                </div>
              )}

              {status === "loading" ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <span className="spinner" style={{ width: "40px", height: "40px", borderTopColor: "#10B981", marginBottom: "1rem" }}></span>
                  <p style={{ fontWeight: 700, color: "var(--primary)" }}>Syncing Security Modules...</p>
                </div>
              ) : !pinCreated ? (
                /* CREATE PIN WIZARD WITH OTP */
                <form onSubmit={handleCreatePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{
                    background: "rgba(239, 68, 68, 0.04)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    borderRadius: "12px",
                    padding: "1rem",
                    color: "#EF4444",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    lineHeight: "1.4"
                  }}>
                    🔴 Safety Requirement: Please configure a secure 4-digit PIN to enable transfers, card controls, and balance access.
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Create 4-Digit Transaction PIN</span>
                      <button
                        type="button"
                        onClick={() => handleGeneratePin("create")}
                        disabled={createOtpSent}
                        style={{
                          background: "none",
                          border: "none",
                          color: createOtpSent ? "var(--text-muted)" : "#10B981",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: createOtpSent ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          textDecoration: "underline"
                        }}
                      >
                        <Sparkles size={12} /> Auto-Generate
                      </button>
                    </label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={createPin}
                      onChange={(e) => setCreatePin(e.target.value.replace(/\D/g, ""))}
                      disabled={createOtpSent}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Transaction PIN</label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={confirmCreatePin}
                      onChange={(e) => setConfirmCreatePin(e.target.value.replace(/\D/g, ""))}
                      disabled={createOtpSent}
                      required
                    />
                  </div>

                  {/* Dynamic OTP Input Block */}
                  {createOtpSent && (
                    <div className="form-group" style={{ animation: "fadeIn 0.25s ease" }}>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Mail size={14} style={{ color: "#10B981" }} /> Enter 6-Digit Email Verification OTP
                      </label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        className="input-field"
                        placeholder="000000"
                        style={{ letterSpacing: "6px", textAlign: "center", fontSize: "1.25rem", fontWeight: 700 }}
                        value={createOtp}
                        onChange={(e) => setCreateOtp(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>
                  )}

                  {generatedPinAlert && (
                    <div style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "12px",
                      padding: "1rem",
                      color: "#059669",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      textAlign: "center",
                      animation: "fadeIn 0.2s ease"
                    }}>
                      🔑 {generatedPinAlert}
                    </div>
                  )}

                  {!createOtpSent ? (
                    <PopInteractive scale={0.97} hoverScale={1.01}>
                      <button
                        type="button"
                        onClick={handleCreateSendOtp}
                        disabled={isRequestingOtp || createPin.length !== 4}
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "1rem" }}
                      >
                        {isRequestingOtp ? "Dispatching OTP..." : "Request Email Verification OTP"}
                      </button>
                    </PopInteractive>
                  ) : (
                    <PopInteractive scale={0.97} hoverScale={1.01}>
                      <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                        Verify OTP & Activate PIN
                      </button>
                    </PopInteractive>
                  )}
                </form>
              ) : activeTab === "change" ? (
                /* CHANGE PIN FORM WITH OTP */
                <form onSubmit={handleChangePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">Current Transaction PIN</label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                      disabled={changeOtpSent}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>New 4-Digit PIN</span>
                      <button
                        type="button"
                        onClick={() => handleGeneratePin("change")}
                        disabled={changeOtpSent}
                        style={{
                          background: "none",
                          border: "none",
                          color: changeOtpSent ? "var(--text-muted)" : "#10B981",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: changeOtpSent ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          textDecoration: "underline"
                        }}
                      >
                        <Sparkles size={12} /> Auto-Generate
                      </button>
                    </label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={changePin}
                      onChange={(e) => setChangePin(e.target.value.replace(/\D/g, ""))}
                      disabled={changeOtpSent}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New PIN</label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={confirmChangePin}
                      onChange={(e) => setConfirmChangePin(e.target.value.replace(/\D/g, ""))}
                      disabled={changeOtpSent}
                      required
                    />
                  </div>

                  {/* Dynamic OTP Input Block */}
                  {changeOtpSent && (
                    <div className="form-group" style={{ animation: "fadeIn 0.25s ease" }}>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Mail size={14} style={{ color: "#10B981" }} /> Enter 6-Digit Email Verification OTP
                      </label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        className="input-field"
                        placeholder="000000"
                        style={{ letterSpacing: "6px", textAlign: "center", fontSize: "1.25rem", fontWeight: 700 }}
                        value={changeOtp}
                        onChange={(e) => setChangeOtp(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>
                  )}

                  {generatedPinAlert && (
                    <div style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "12px",
                      padding: "1rem",
                      color: "#059669",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      textAlign: "center",
                      animation: "fadeIn 0.2s ease"
                    }}>
                      🔑 {generatedPinAlert}
                    </div>
                  )}

                  {!changeOtpSent ? (
                    <PopInteractive scale={0.97} hoverScale={1.01}>
                      <button
                        type="button"
                        onClick={handleChangeSendOtp}
                        disabled={isRequestingOtp || changePin.length !== 4}
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "1rem" }}
                      >
                        {isRequestingOtp ? "Dispatching OTP..." : "Request Email Verification OTP"}
                      </button>
                    </PopInteractive>
                  ) : (
                    <PopInteractive scale={0.97} hoverScale={1.01}>
                      <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                        Verify OTP & Update PIN
                      </button>
                    </PopInteractive>
                  )}
                </form>
              ) : (
                /* RESET PIN FORM WITH OTP */
                <form onSubmit={handleResetPinSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.04)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                    borderRadius: "12px",
                    padding: "1rem",
                    color: "var(--accent)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    lineHeight: "1.4"
                  }}>
                    🔐 Reset Authorization: Verify your identity using your banking login password and email verification.
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vault Login Password</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Enter account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={resetOtpSent}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>New 4-Digit PIN</span>
                      <button
                        type="button"
                        onClick={() => handleGeneratePin("reset")}
                        disabled={resetOtpSent}
                        style={{
                          background: "none",
                          border: "none",
                          color: resetOtpSent ? "var(--text-muted)" : "#10B981",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: resetOtpSent ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          textDecoration: "underline"
                        }}
                      >
                        <Sparkles size={12} /> Auto-Generate
                      </button>
                    </label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={resetPin}
                      onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
                      disabled={resetOtpSent}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New PIN</label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      className="input-field"
                      placeholder="••••"
                      style={{ letterSpacing: "12px", textAlign: "center", fontSize: "1.5rem", fontWeight: 800 }}
                      value={confirmResetPin}
                      onChange={(e) => setConfirmResetPin(e.target.value.replace(/\D/g, ""))}
                      disabled={resetOtpSent}
                      required
                    />
                  </div>

                  {/* Dynamic OTP Input Block */}
                  {resetOtpSent && (
                    <div className="form-group" style={{ animation: "fadeIn 0.25s ease" }}>
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Mail size={14} style={{ color: "#10B981" }} /> Enter 6-Digit Email Verification OTP
                      </label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        className="input-field"
                        placeholder="000000"
                        style={{ letterSpacing: "6px", textAlign: "center", fontSize: "1.25rem", fontWeight: 700 }}
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>
                  )}

                  {generatedPinAlert && (
                    <div style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: "12px",
                      padding: "1rem",
                      color: "#059669",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      textAlign: "center",
                      animation: "fadeIn 0.2s ease"
                    }}>
                      🔑 {generatedPinAlert}
                    </div>
                  )}

                  {!resetOtpSent ? (
                    <PopInteractive scale={0.97} hoverScale={1.01}>
                      <button
                        type="button"
                        onClick={handleResetSendOtp}
                        disabled={isRequestingOtp || resetPin.length !== 4}
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "1rem" }}
                      >
                        {isRequestingOtp ? "Dispatching OTP..." : "Request Email Verification OTP"}
                      </button>
                    </PopInteractive>
                  ) : (
                    <PopInteractive scale={0.97} hoverScale={1.01}>
                      <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                        Verify OTP & Reset PIN
                      </button>
                    </PopInteractive>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinManagement;
