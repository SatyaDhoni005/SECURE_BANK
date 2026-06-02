import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Landmark, Check, Copy, AlertCircle, LogIn } from "lucide-react";
import { ApiService } from "../services/Api";
import { PopInteractive } from "../components/Animated";

const AccountIdentity = () => {
  const { accountNumber } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchIdentity = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ApiService.getAccountIdentity(accountNumber);
        setAccount(response);
      } catch (err) {
        setError(err.message || "Failed to load account identity.");
      } finally {
        setLoading(false);
      }
    };
    if (accountNumber) {
      fetchIdentity();
    }
  }, [accountNumber]);

  const fallbackCopyText = (text) => {
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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Fallback copy unsuccessful");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopy = () => {
    if (!account) return;
    const textToCopy = account.account_number;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error("Clipboard API failed, trying fallback:", err);
          fallbackCopyText(textToCopy);
        });
    } else {
      fallbackCopyText(textToCopy);
    }
  };

  // Render elegant premium loading skeleton
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--sans)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #E2E8F0",
            borderTopColor: "#10B981",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem auto"
          }}></div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Verifying cryptographic ledger identity...
          </p>
        </div>
      </div>
    );
  }

  // Render error screen (e.g. account not found)
  if (error || !account) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--sans)",
        padding: "2rem"
      }}>
        <div style={{
          backgroundColor: "white",
          border: "1px solid var(--border-color)",
          borderRadius: "24px",
          padding: "3rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.02)",
          textAlign: "center"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            border: "2px solid #EF4444",
            color: "#EF4444",
            marginBottom: "1.5rem"
          }}>
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2540", marginBottom: "0.75rem" }}>
            Identity Verification Failed
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "2rem" }}>
            {error || "The scanned bank account identity does not exist in the mainframe ledger."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={() => navigate("/signin")}
              style={{
                backgroundColor: "#0A2540",
                color: "white",
                border: "none",
                padding: "0.85rem",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.9rem",
                transition: "all 0.2s"
              }}
            >
              Sign In to Secure Bank
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format account number from SBK20262576111 to SBK-2026-2576111
  const formattedAccountNumber = account.account_number.startsWith("SBK")
    ? account.account_number.replace(/(SBK)(\d{4})(\d+)/, "$1-$2-$3")
    : account.account_number;

  const isStatusActive = account.status === "ACTIVE";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "var(--bg-primary)",
      fontFamily: "var(--sans)",
      color: "var(--text-primary)",
      padding: "2rem"
    }}>
      <PopInteractive scale={0.98} hoverScale={1.01}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "white",
          borderRadius: "24px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 25px 50px -12px rgba(10, 37, 64, 0.05), 0 0 1px 0 rgba(10, 37, 64, 0.1)",
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: "#0A2540",
            padding: "1.75rem",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
          }}>
            <Landmark size={22} style={{ color: "#10B981" }} />
            <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "1px" }}>SECURE BANK</span>
          </div>

          {/* Identity Body */}
          <div style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <div style={{
                fontSize: "0.75rem",
                color: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                padding: "0.3rem 0.75rem",
                borderRadius: "20px",
                display: "inline-block",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                Verified Account Identity
              </div>
            </div>

            {/* Account Holder Name */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
                Account Holder
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0A2540" }}>
                {account.account_holder}
              </div>
            </div>

            {/* Account Number */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
                Account Number
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "monospace", color: "#0A2540", letterSpacing: "0.5px" }}>
                {formattedAccountNumber}
              </div>
            </div>

            {/* Status */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "0.5rem" }}>
                Status
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: isStatusActive ? "#065F46" : "#991B1B",
                  backgroundColor: isStatusActive ? "#D1FAE5" : "#FEE2E2",
                  border: isStatusActive ? "1px solid #10B981" : "1px solid #EF4444",
                  padding: "0.3rem 1rem",
                  borderRadius: "8px",
                  textTransform: "uppercase"
                }}>
                  {account.status}
                </span>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                padding: "0.9rem",
                backgroundColor: copied ? "#10B981" : "#0A2540",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: copied ? "0 4px 12px rgba(16, 185, 129, 0.2)" : "0 4px 12px rgba(10, 37, 64, 0.1)",
                transition: "all 0.2s ease"
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Account Number Copied!" : "Copy Account Number"}
            </button>
          </div>
        </div>
      </PopInteractive>

      {/* Return to portal button */}
      <button
        onClick={() => navigate("/signin")}
        style={{
          marginTop: "1.5rem",
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem"
        }}
      >
        <LogIn size={14} /> Back to Sign In
      </button>
    </div>
  );
};

export default AccountIdentity;
