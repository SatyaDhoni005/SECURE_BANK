import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Landmark, 
  ArrowRight, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Coins,
  RefreshCw
} from "lucide-react";
import { PopInteractive } from "../components/Animated";
import { ApiService } from "../services/Api";

const Transfer = () => {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Verification states
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverAccountNumber, setReceiverAccountNumber] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [verifying, setVerifying] = useState(false);

  // PIN modal states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [executingTransfer, setExecutingTransfer] = useState(false);

  // Global Page Status
  const [status, setStatus] = useState("idle"); // idle, success, loading
  const [error, setError] = useState("");
  const [newBalance, setNewBalance] = useState(null);

  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Focus first PIN input when modal opens
  useEffect(() => {
    if (isPinModalOpen) {
      setTimeout(() => {
        if (pinRefs[0].current) pinRefs[0].current.focus();
      }, 100);
    }
  }, [isPinModalOpen]);

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
    if (recipientVerified) {
      setRecipientVerified(false);
      setReceiverName("");
      setReceiverAccountNumber("");
      setReceiverEmail("");
      setError("");
    }
  };

  const handleVerifyRecipient = async (e) => {
    e.preventDefault();
    if (!recipient.trim()) {
      setError("Please enter a recipient email or account number.");
      return;
    }

    setError("");
    setVerifying(true);

    try {
      const data = await ApiService.verifyRecipient(recipient);
      if (data.success) {
        setReceiverName(data.name);
        setReceiverAccountNumber(data.account_number);
        setReceiverEmail(data.email);
        setRecipientVerified(true);
      } else {
        setError(data.message || "Recipient not found.");
      }
    } catch (err) {
      setError(err.message || "Unable to verify recipient. Please verify the bank identifier.");
    } finally {
      setVerifying(false);
    }
  };

  const triggerPinModal = (e) => {
    e.preventDefault();
    if (!recipientVerified) {
      setError("Please verify recipient credentials first.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }
    setError("");
    setPinValues(["", "", "", ""]);
    setPinError("");
    setIsPinModalOpen(true);
  };

  const handlePinChange = (index, value) => {
    // Only accept single numeric digit
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pinValues];
    newPin[index] = value;
    setPinValues(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      pinRefs[index + 1].current.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!pinValues[index] && index > 0) {
        // Clear previous and focus it
        const newPin = [...pinValues];
        newPin[index - 1] = "";
        setPinValues(newPin);
        pinRefs[index - 1].current.focus();
      } else {
        const newPin = [...pinValues];
        newPin[index] = "";
        setPinValues(newPin);
      }
    }
  };

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    const pinString = pinValues.join("");
    if (pinString.length !== 4) {
      setPinError("Please enter your complete 4-digit Transaction PIN.");
      return;
    }

    setPinError("");
    setExecutingTransfer(true);

    try {
      const data = await ApiService.executeTransfer(
        receiverAccountNumber,
        amount,
        remarks,
        pinString
      );

      if (data.success) {
        setNewBalance(data.new_balance);
        setIsPinModalOpen(false);
        setStatus("success");
      } else {
        setPinError(data.message || "Outbound transfer rejected.");
      }
    } catch (err) {
      setPinError(err.message || "Transaction PIN authorization failed.");
    } finally {
      setExecutingTransfer(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", fontFamily: "var(--sans)", color: "var(--text-primary)" }}>
      {/* Top Navbar */}
      <nav style={{ backgroundColor: "#0A2540", padding: isMobile ? "1rem" : "1.25rem 2rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              marginRight: "0.25rem"
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Landmark size={18} style={{ color: "#10B981" }} />
            <span style={{ fontWeight: 800, fontSize: isMobile ? "1.05rem" : "1.15rem", letterSpacing: "-0.5px" }}>SECURE BANK</span>
          </div>
        </div>
        {!isMobile && <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 }}>Wealth Outbound Gateway</span>}
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: isMobile ? "1.5rem 1rem" : "3rem 2rem" }}>
        <div style={{ backgroundColor: "white", border: "1px solid var(--border-color)", borderRadius: "24px", padding: isMobile ? "1.5rem" : "2.5rem", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.4rem" }}>
              Outbound Wire Transfer
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              Secure direct compliance ledger transfers inside the Secure Bank system.
            </p>
          </div>

          {status === "idle" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div className="custom-alert error" style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "0.85rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{error}</div>
                </div>
              )}

              {/* Step 1: Recipient input and verification */}
              <div className="form-group">
                <label className="form-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Recipient (Email, Phone or Account Number)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: "0.75rem", width: "100%" }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ 
                      width: "100%", 
                      padding: "0.75rem 1rem", 
                      border: "1px solid var(--border-color)", 
                      borderRadius: "var(--radius-md)", 
                      fontSize: "0.95rem", 
                      color: "var(--text-primary)" 
                    }}
                    placeholder={isMobile ? "Email, Phone or Account #" : "Search by Email, Phone or Account Number..."}
                    value={recipient}
                    onChange={handleRecipientChange}
                    disabled={verifying}
                  />
                  <PopInteractive scale={0.96} hoverScale={1.02}>
                    <button
                      onClick={handleVerifyRecipient}
                      disabled={verifying || !recipient.trim()}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: recipientVerified ? "var(--accent)" : "#0A2540",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: (verifying || !recipient.trim()) ? "not-allowed" : "pointer",
                        opacity: (verifying || !recipient.trim()) ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        height: "100%",
                        width: isMobile ? "100%" : "auto",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {verifying ? (
                        <>
                          <RefreshCw size={14} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                          Verifying...
                        </>
                      ) : recipientVerified ? (
                        <>
                          <UserCheck size={14} />
                          Verified
                        </>
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </PopInteractive>
                </div>
              </div>

              {/* Step 2: Show receiver details if verified */}
              {recipientVerified && (
                <div 
                  style={{ 
                    backgroundColor: "var(--success-bg)", 
                    border: "1px solid var(--success-border)", 
                    borderRadius: "var(--radius-lg)", 
                    padding: "1.25rem", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "1rem",
                    animation: "fadeIn 0.3s ease-out"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Verified Receiver</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--primary)" }}>{receiverName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace", marginTop: "0.15rem" }}>
                      Acc: {receiverAccountNumber} &bull; {receiverEmail}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Enter Amount & Remarks (Visible only if recipient verified) */}
              {recipientVerified ? (
                <form onSubmit={triggerPinModal} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "0.5rem", animation: "fadeIn 0.35s ease-out" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                      Amount ($)
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "1.2rem", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--text-secondary)", fontSize: "1rem" }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="input-field"
                        style={{ paddingLeft: "2.2rem", width: "100%", padding: "0.75rem 1rem 0.75rem 2.2rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontSize: "0.95rem" }}
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                      Transfer Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      style={{ width: "100%", padding: "0.75rem 1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontSize: "0.95rem" }}
                      placeholder="Compliance reference or memo"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>

                  <PopInteractive scale={0.97} hoverScale={1.01}>
                    <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      Authorize Outbound Transfer <ArrowRight size={16} />
                    </button>
                  </PopInteractive>
                </form>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  <Coins size={24} style={{ margin: "0 auto 0.75rem", opacity: 0.6 }} />
                  Please verify recipient email or account details to unlock transfer parameters.
                </div>
              )}
            </div>
          )}

          {status === "success" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981", marginBottom: "1.5rem" }}>
                <CheckCircle2 size={40} />
              </div>
              <h2 style={{ fontSize: "1.40rem", fontWeight: 800, color: "var(--primary)", marginBottom: "0.5rem" }}>Transfer Authorized Successfully</h2>
              
              <div style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "1.25rem", margin: "1.5rem 0 2rem", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Recipient Name:</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>{receiverName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Recipient Account:</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>{receiverAccountNumber}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Debited Amount:</span>
                  <span style={{ fontWeight: 800, color: "var(--danger)" }}>-${parseFloat(amount).toFixed(2)}</span>
                </div>
                {newBalance !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Your Remaining Balance:</span>
                    <span style={{ fontWeight: 800, color: "var(--success)" }}>${parseFloat(newBalance).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
                Your outbound transfer has been successfully processed. Real-time debit and credit email notifications have been dispatched.
              </p>
              <PopInteractive scale={0.98} hoverScale={1.02}>
                <button onClick={() => navigate("/dashboard")} className="btn-primary" style={{ width: "100%" }}>
                  Return to Mainframe
                </button>
              </PopInteractive>
            </div>
          )}
        </div>
      </div>

      {/* UPI-like Secure Transaction PIN Modal Backdrop Overlay */}
      {isPinModalOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(10, 37, 64, 0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.25s ease-out"
          }}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "24px",
              padding: "2.5rem",
              maxWidth: "440px",
              width: "90%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--border-color)",
              textAlign: "center"
            }}
          >
            <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981", marginBottom: "1rem" }}>
              <Lock size={28} />
            </div>

            <h3 style={{ fontSize: "1.25rem", color: "#0A2540", fontWeight: 800, marginBottom: "0.5rem" }}>
              Security Verification
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              Enter your secure 4-digit Transaction PIN to authorize this fund transfer of <strong style={{ color: "var(--primary)" }}>${parseFloat(amount).toFixed(2)}</strong> to <strong style={{ color: "var(--primary)" }}>{receiverName}</strong>.
            </p>

            {pinError && (
              <div style={{ display: "flex", gap: "0.5rem", padding: "0.6rem 0.8rem", backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "0.8rem", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <div>{pinError}</div>
              </div>
            )}

            <form onSubmit={handleFinalSubmit}>
              {/* Digit Inputs Row */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
                {pinValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={pinRefs[idx]}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    disabled={executingTransfer}
                    style={{
                      width: "50px",
                      height: "55px",
                      borderRadius: "12px",
                      border: pinError ? "2px solid var(--danger)" : "2px solid var(--border-color)",
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      textAlign: "center",
                      color: "var(--primary)",
                      backgroundColor: "var(--bg-primary)",
                      outline: "none",
                      transition: "all 0.15s ease",
                      boxShadow: "var(--input-shadow)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--border-focus)";
                      e.target.style.backgroundColor = "white";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = pinError ? "var(--danger)" : "var(--border-color)";
                      e.target.style.backgroundColor = "var(--bg-primary)";
                    }}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  disabled={executingTransfer}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "white",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: executingTransfer ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executingTransfer || pinValues.join("").length !== 4}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "#0A2540",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: (executingTransfer || pinValues.join("").length !== 4) ? "not-allowed" : "pointer",
                    opacity: (executingTransfer || pinValues.join("").length !== 4) ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem"
                  }}
                >
                  {executingTransfer ? (
                    <>
                      <RefreshCw size={14} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                      Authorizing...
                    </>
                  ) : (
                    "Authorize"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfer;
