import { useState, useEffect } from "react";
import { QrCode, Smartphone, Info, Copy, Check } from "lucide-react";
import { PopInteractive } from "./Animated";

const QRCodeCard = ({ accountNumber, localIp }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const qrUrl = (() => {
    if (!accountNumber) return "";
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      const port = window.location.port ? `:${window.location.port}` : "";
      const ipHost = localIp || "127.0.0.1";
      return `${window.location.protocol}//${ipHost}${port}/identity/${accountNumber}`;
    }
    return `${origin}/identity/${accountNumber}`;
  })();

  return (
    <PopInteractive scale={0.98} hoverScale={1.01}>
      <div
        style={{
          width: "100%",
          backgroundColor: "white",
          borderRadius: "20px",
          border: "1px solid var(--border-color)",
          padding: isMobile ? "1.25rem" : "1.75rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
          userSelect: "none"
        }}
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                color: "#10B981",
                padding: "0.4rem",
                borderRadius: "6px"
              }}
            >
              <QrCode size={16} />
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)" }}>
              {isMobile ? "QR Code" : "QR Mobile Sync"}
            </span>
          </div>
          {!isMobile && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "var(--accent)",
                backgroundColor: "var(--bg-primary)",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px"
              }}
            >
              COMPLIANT
            </span>
          )}
        </div>

        {/* Generated QR Code */}
        <div
          style={{
            width: "140px",
            height: "140px",
            backgroundColor: "white",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
        >
          {accountNumber ? (
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrUrl)}`}
              alt="Account Identity QR Code"
              style={{ width: "100%", height: "100%", borderRadius: "8px" }}
            />
          ) : (
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Generating QR...</div>
          )}
        </div>

        {/* Copy Account Number Button */}
        <button
          onClick={handleCopy}
          style={{
            width: "100%",
            padding: "0.65rem 1rem",
            backgroundColor: copied ? "rgba(16, 185, 129, 0.08)" : "white",
            border: copied ? "1.5px solid #10B981" : "1px solid var(--border-color)",
            borderRadius: "10px",
            color: copied ? "#10B981" : "var(--primary)",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
            marginTop: "0.25rem",
            boxShadow: copied ? "0 4px 10px rgba(16, 185, 129, 0.15)" : "none"
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.backgroundColor = "var(--bg-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.backgroundColor = "white";
            }
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied Account Number" : "Copy Account Number"}</span>
        </button>

        {/* Helper text instructions */}
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", marginTop: "0.25rem", width: "100%" }}>
          {!isMobile && <Info size={14} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: "0.1rem" }} />}
          <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.35", textAlign: isMobile ? "center" : "left", width: "100%" }}>
            {isMobile
              ? "Scan to view account information"
              : "Scan with your secure mobile companion app to authorize immediate outbound compliance transfers and sync offline ledger balances."}
          </p>
        </div>
      </div>
    </PopInteractive>
  );
};

export default QRCodeCard;
