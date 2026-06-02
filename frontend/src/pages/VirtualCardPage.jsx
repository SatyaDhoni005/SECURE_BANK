import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, Shield, Info, Check, Copy, Eye, EyeOff, Lock, Unlock, RefreshCw, AlertCircle } from "lucide-react";
import { ApiService } from "../services/Api";
import VirtualCard from "../components/VirtualCard";
import { PopInteractive } from "../components/Animated";

const VirtualCardPage = () => {
  const navigate = useNavigate();
  
  // Card states
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCvv, setCopiedCvv] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("392");
  const [isCardActive, setIsCardActive] = useState(true);
  const [cardCreated, setCardCreated] = useState("01 Jun 2026");
  const [cardLastUsed, setCardLastUsed] = useState("Never");

  // Telemetry and UI states
  const [revealed, setRevealed] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [alertError, setAlertError] = useState("");

  // Sync details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await ApiService.getDashboardData();
        setAccountNumber(response.account_number);
        setCardNumber(response.card_number);
        setName(response.name);
        setCardCvv(response.card_cvv || "392");
        setIsCardActive(response.is_card_active !== false);
        setCardCreated(response.card_created_at || "01 Jun 2026");
        setCardLastUsed(response.card_last_used || "Never");
      } catch (err) {
        const userStr = localStorage.getItem("secure_bank_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setName(user.name);
        }
      }
    };
    fetchUser();
  }, []);

  const fullCardNum = cardNumber
    ? cardNumber
    : (accountNumber
        ? `9821 8211 ${accountNumber.slice(4, 8)} ${accountNumber.slice(8, 12)}`
        : "9821 8211 4019 3882");

  const maskedCardNum = (() => {
    const parts = fullCardNum.split(" ");
    if (parts.length === 4) {
      return `${parts[0]} **** **** ${parts[3]}`;
    }
    return "9821 **** **** 0000";
  })();

  const fallbackCopyText = (text, onSuccess) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        onSuccess();
      } else {
        console.error("Fallback copy unsuccessful");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopyNumber = () => {
    if (!revealed) return;
    const textToCopy = fullCardNum.replace(/\s/g, "");
    const onSuccess = () => {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(onSuccess)
        .catch(err => {
          console.error("Clipboard API failed, trying fallback:", err);
          fallbackCopyText(textToCopy, onSuccess);
        });
    } else {
      fallbackCopyText(textToCopy, onSuccess);
    }
  };

  const handleCopyCvv = () => {
    if (!revealed) return;
    const textToCopy = cardCvv;
    const onSuccess = () => {
      setCopiedCvv(true);
      setTimeout(() => setCopiedCvv(false), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(onSuccess)
        .catch(err => {
          console.error("Clipboard API failed, trying fallback:", err);
          fallbackCopyText(textToCopy, onSuccess);
        });
    } else {
      fallbackCopyText(textToCopy, onSuccess);
    }
  };

  const handleToggleReveal = () => {
    if (revealed) {
      setRevealed(false);
    } else {
      setShowPinModal(true);
    }
  };

  const handleVerifyPin = async () => {
    setIsVerifying(true);
    setPinError("");
    try {
      const response = await ApiService.verifyPIN(pinValue);
      if (response.success) {
        setRevealed(true);
        setShowPinModal(false);
        setPinValue("");
      } else {
        setPinError(response.message || "Invalid PIN entered.");
      }
    } catch (err) {
      setPinError(err.message || "PIN verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFreezeToggle = async () => {
    try {
      const response = await ApiService.freezeCard();
      setIsCardActive(response.is_card_active);
      setSuccessMessage(response.message);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setAlertError(err.message || "Failed to alter card freeze state.");
      setTimeout(() => setAlertError(""), 4000);
    }
  };

  const handleRegenerateCvv = async () => {
    try {
      const response = await ApiService.regenerateCVV();
      setCardCvv(response.card_cvv);
      setSuccessMessage("CVV verification code regenerated successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setAlertError(err.message || "Failed to regenerate CVV.");
      setTimeout(() => setAlertError(""), 4000);
    }
  };

  const handleReplaceCard = async () => {
    if (!window.confirm("Are you sure you want to replace this card? The current card number and CVV will be permanently deactivated and replaced.")) {
      return;
    }
    try {
      const response = await ApiService.replaceCard();
      setCardNumber(response.card_number);
      setCardCvv(response.card_cvv);
      setIsCardActive(response.is_card_active);
      setCardCreated(response.card_created_at);
      setSuccessMessage("Virtual card replaced successfully with new numbers!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setAlertError(err.message || "Failed to replace card.");
      setTimeout(() => setAlertError(""), 4000);
    }
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
        <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 }}>Virtual Debit Center</span>
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.4rem" }}>
              Virtual Debit Card
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Manage your high-security virtual ledger payment parameters.
            </p>
          </div>

          {/* Banner Notifications */}
          {successMessage && (
            <div style={{ backgroundColor: "#D1FAE5", border: "1px solid #10B981", color: "#065F46", padding: "1rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Check size={16} /> {successMessage}
            </div>
          )}
          {alertError && (
            <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #EF4444", color: "#991B1B", padding: "1rem", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={16} /> {alertError}
            </div>
          )}

          {/* Gorgeous Virtual Card Card */}
          <VirtualCard cardholderName={name} accountNumber={accountNumber} cardNumber={cardNumber} revealed={revealed} isCardActive={isCardActive} />

          {/* Active Card Security Actions panel */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <button
              onClick={handleToggleReveal}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                backgroundColor: "white",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#0A2540",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
              {revealed ? "Hide Details" : "Show Details"}
            </button>

            <button
              onClick={handleFreezeToggle}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isCardActive ? "#EF4444" : "#10B981",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "white",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
              }}
            >
              {isCardActive ? <Lock size={16} /> : <Unlock size={16} />}
              {isCardActive ? "Freeze Card" : "Unfreeze Card"}
            </button>

            <button
              onClick={handleRegenerateCvv}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                backgroundColor: "white",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#0a2540",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <RefreshCw size={16} />
              Generate New CVV
            </button>

            <button
              onClick={handleReplaceCard}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                backgroundColor: "white",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#0a2540",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <RefreshCw size={16} />
              Replace Card
            </button>
          </div>

          {/* Details Table Card */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.01)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--primary)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <Shield size={18} style={{ color: "var(--accent)" }} /> Card Credentials
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Card Number</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: "var(--primary)", marginTop: "0.15rem" }}>
                    {revealed ? fullCardNum : maskedCardNum}
                  </div>
                </div>
                {revealed && (
                  <button
                    onClick={handleCopyNumber}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.4rem 0.75rem",
                      backgroundColor: "white",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "var(--text-secondary)"
                    }}
                  >
                    {copiedNumber ? <Check size={12} style={{ color: "#10B981" }} /> : <Copy size={12} />}
                    {copiedNumber ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Expiry Date</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: "var(--primary)", marginTop: "0.15rem" }}>
                    {revealed ? "12 / 2030" : "** / ****"}
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: isCardActive ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                  {isCardActive ? "Active" : "Frozen"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>CVV Verification</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: "var(--primary)", marginTop: "0.15rem" }}>
                    {revealed ? cardCvv : "***"}
                  </div>
                </div>
                {revealed && (
                  <button
                    onClick={handleCopyCvv}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.4rem 0.75rem",
                      backgroundColor: "white",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "var(--text-secondary)"
                    }}
                  >
                    {copiedCvv ? <Check size={12} style={{ color: "#10B981" }} /> : <Copy size={12} />}
                    {copiedCvv ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.25rem" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Card Limit</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.15rem" }}>
                    ₹50,000 / day
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Last Used</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.15rem" }}>
                    {cardLastUsed}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Created Date</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.15rem" }}>
                    {cardCreated}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <Info size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "0.1rem" }} />
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Your virtual debit card parameters are fully dynamic and guarded by end-to-end ledger encryption. Use CVV and card numbers above for compliant online sandbox savings authorizations.
            </p>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(10, 37, 64, 0.75)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "white",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            padding: "2.5rem 2rem",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2540", margin: "0 0 0.5rem 0" }}>
                Security Verification
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--text-secondary)", margin: 0, fontWeight: 600 }}>
                Enter Transaction PIN
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
              <div style={{ position: "relative", display: "flex", gap: "0.75rem", margin: "1rem 0" }}>
                {/* Transparent input on top */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPinValue(val);
                    if (pinError) setPinError("");
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    zIndex: 2,
                    border: "none",
                    outline: "none"
                  }}
                  disabled={isVerifying}
                  autoFocus
                />
                
                {/* Styled placeholder underline character boxes resembling [ _ _ _ _ ] */}
                {[0, 1, 2, 3].map((index) => {
                  const hasChar = pinValue && pinValue[index] !== undefined;
                  const isActive = index === (pinValue ? pinValue.length : 0);
                  return (
                    <div
                      key={index}
                      style={{
                        width: "55px",
                        height: "55px",
                        borderRadius: "12px",
                        border: pinError 
                          ? "2.5px solid #EF4444" 
                          : (isActive ? "2.5px solid #10B981" : "2.5px solid var(--border-color)"),
                        backgroundColor: "#F8FAFC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        color: "#0A2540",
                        transition: "all 0.15s ease",
                        boxShadow: isActive ? "0 0 0 3px rgba(16, 185, 129, 0.15)" : "none"
                      }}
                    >
                      {hasChar ? "•" : "_"}
                    </div>
                  );
                })}
              </div>

              {pinError && (
                <span style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: 700, marginTop: "0.5rem" }}>
                  ⚠️ {pinError}
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinValue("");
                  setPinError("");
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#F1F5F9",
                  border: "none",
                  borderRadius: "10px",
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPin}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  backgroundColor: "#0A2540",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
                disabled={isVerifying || pinValue.length < 4}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualCardPage;
