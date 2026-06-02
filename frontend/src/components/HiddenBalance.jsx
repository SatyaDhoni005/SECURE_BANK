import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Lock, ShieldAlert, X } from "lucide-react";
import { CountUp } from "./Animated";
import { ApiService } from "../services/Api";
import { useNavigate } from "react-router-dom";

const HiddenBalance = ({ balance, pinCreated }) => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  const [localPinCreated, setLocalPinCreated] = useState(pinCreated);
  const [checkingPin, setCheckingPin] = useState(false);

  useEffect(() => {
    setLocalPinCreated(pinCreated);
  }, [pinCreated]);

  const handleToggleClick = async (e) => {
    if (e) e.stopPropagation();
    
    if (showBalance) {
      // Mask balance again
      setShowBalance(false);
    } else {
      // Trying to show balance - check if already verified in this runtime state
      if (isUnlocked) {
        setShowBalance(true);
      } else {
        // Trigger PIN verification flow
        setShowPinModal(true);
        setPinValue("");
        setPinError("");
        
        // Silent background check to verify latest security credentials from the DB
        setCheckingPin(true);
        try {
          const response = await ApiService.getDashboardData();
          setLocalPinCreated(response.pin_created);
        } catch (err) {
          console.error("Silent security check failed:", err);
        } finally {
          setCheckingPin(false);
        }
      }
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinValue || pinValue.length !== 4 || !/^\d+$/.test(pinValue)) {
      setPinError("Please enter a valid 4-digit numeric PIN.");
      return;
    }

    setVerifying(true);
    setPinError("");
    try {
      await ApiService.verifyPIN(pinValue);
      // Success! Unlock balance
      setIsUnlocked(true);
      setShowBalance(true);
      setShowPinModal(false);
    } catch (err) {
      setPinError(err.message || "Invalid Transaction PIN. Access denied.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {showBalance ? (
        /* Unmasked balance view */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: "3rem", fontWeight: 800, height: "45px" }}>
            <span style={{ fontSize: "2rem", color: "#10B981", alignSelf: "flex-start", marginTop: "0.3rem", marginRight: "0.2rem" }}>₹</span>
            <CountUp
              value={parseFloat(balance || 0)}
              duration={1200}
              formatter={(v) => Math.round(parseFloat(v)).toLocaleString("en-IN")}
            />
          </div>
          <div>
            <button
              onClick={handleToggleClick}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "rgba(255, 255, 255, 0.6)",
                border: "none",
                padding: "0.4rem 1rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "white";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
            >
              <EyeOff size={14} /> Hide Balance
            </button>
          </div>
        </div>
      ) : (
        /* Masked balance view (Exactly matches user specification) */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
          <div style={{ fontSize: "2.75rem", fontWeight: 800, color: "rgba(255, 255, 255, 0.35)", letterSpacing: "2px", fontFamily: "monospace" }}>
            ₹ ********
          </div>
          <div>
            <button
              onClick={handleToggleClick}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <Eye size={14} /> Show Balance
            </button>
          </div>
        </div>
      )}

      {/* Enter Transaction PIN Modal Overlay inside React Portal to prevent layout containment clip */}
      {showPinModal && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(10, 37, 64, 0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          color: "var(--primary)"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "24px",
            padding: "2.5rem",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            position: "relative",
            animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}>
            <button
              onClick={() => setShowPinModal(false)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "0.25rem",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)"}
            >
              <X size={16} />
            </button>

            {!localPinCreated ? (
              /* If PIN is not configured yet */
              <div style={{ textAlign: "center" }}>
                {checkingPin ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 0" }}>
                    <span className="spinner" style={{ width: "30px", height: "30px", borderTopColor: "#10B981", marginBottom: "0.5rem" }}></span>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700 }}>Verifying security mainframe...</p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#EF4444",
                      marginBottom: "1.5rem"
                    }}>
                      <ShieldAlert size={28} />
                    </div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0A2540", marginBottom: "0.75rem" }}>
                      🔴 PIN Not Configured
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "2rem" }}>
                      Your account is protected by multi-factor transaction security. You must configure a 4-digit Transaction PIN to view your balance.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <button
                        onClick={() => {
                          setShowPinModal(false);
                          navigate("/pin-management");
                        }}
                        style={{
                          backgroundColor: "#10B981",
                          color: "white",
                          border: "none",
                          padding: "0.8rem",
                          borderRadius: "12px",
                          cursor: "pointer",
                          fontWeight: 700,
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#059669"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#10B981"}
                      >
                        Configure PIN Now
                      </button>
                      <button
                        onClick={() => setShowPinModal(false)}
                        style={{
                          backgroundColor: "transparent",
                          color: "var(--text-secondary)",
                          border: "1px solid rgba(0,0,0,0.1)",
                          padding: "0.8rem",
                          borderRadius: "12px",
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* If PIN is configured, verify PIN */
              <form onSubmit={handlePinSubmit} style={{ textAlign: "center" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10B981",
                  marginBottom: "1.5rem"
                }}>
                  <Lock size={24} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0A2540", marginBottom: "0.5rem" }}>
                  Enter Transaction PIN
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                  Please authorize balance visibility by entering your secure 4-digit code.
                </p>

                <div style={{ marginBottom: "1.5rem" }}>
                  <style>{`
                    /* Hide Edge/IE password reveal and clear buttons */
                    .nocontrols-input::-ms-reveal,
                    .nocontrols-input::-ms-clear {
                      display: none !important;
                    }
                    /* Hide WebKit password reveal buttons if any */
                    .nocontrols-input::-webkit-contacts-auto-fill-button,
                    .nocontrols-input::-webkit-credentials-auto-fill-button {
                      display: none !important;
                    }
                  `}</style>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPinValue(val);
                      if (val.length === 4) setPinError("");
                    }}
                    placeholder="••••"
                    autoFocus
                    disabled={verifying}
                    className="nocontrols-input"
                    style={{
                      letterSpacing: "10px",
                      textIndent: "10px",
                      textAlign: "center",
                      fontSize: "2rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "12px",
                      border: "2px solid rgba(0, 0, 0, 0.1)",
                      outline: "none",
                      width: "200px",
                      color: "#0A2540",
                      fontWeight: 800,
                      transition: "all 0.2s"
                    }}
                  />
                  {pinError && (
                    <div style={{ color: "#EF4444", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: 600 }}>
                      {pinError}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowPinModal(false)}
                    disabled={verifying}
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      padding: "0.8rem",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || pinValue.length !== 4}
                    style={{
                      flex: 1,
                      backgroundColor: verifying || pinValue.length !== 4 ? "rgba(16, 185, 129, 0.5)" : "#10B981",
                      color: "white",
                      border: "none",
                      padding: "0.8rem",
                      borderRadius: "12px",
                      cursor: verifying || pinValue.length !== 4 ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      boxShadow: verifying || pinValue.length !== 4 ? "none" : "0 4px 12px rgba(16, 185, 129, 0.25)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (!verifying && pinValue.length === 4) {
                        e.currentTarget.style.backgroundColor = "#059669";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!verifying && pinValue.length === 4) {
                        e.currentTarget.style.backgroundColor = "#10B981";
                      }
                    }}
                  >
                    {verifying ? "Authorizing..." : "Unlock"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HiddenBalance;
