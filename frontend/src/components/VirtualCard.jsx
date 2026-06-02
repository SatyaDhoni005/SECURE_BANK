import { useState, useEffect } from "react";
import { Wifi } from "lucide-react";
import { PopInteractive } from "./Animated";

const VirtualCard = ({ cardholderName, accountNumber, cardNumber, revealed = false, isCardActive = true }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Derive and mask card number
  const displayCardNumber = (() => {
    const raw = cardNumber
      ? cardNumber
      : (accountNumber
          ? `9821 8211 ${accountNumber.slice(4, 8)} ${accountNumber.slice(8, 12)}`
          : "9821 8211 4019 3882");
    if (revealed) return raw;
    const parts = raw.split(" ");
    if (parts.length === 4) {
      return `${parts[0]} **** **** ${parts[3]}`;
    }
    return "9821 **** **** 0000";
  })();

  return (
    <PopInteractive scale={0.98} hoverScale={1.02}>
      <div
        style={{
          width: "100%",
          height: isMobile ? "180px" : "220px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
          borderRadius: "20px",
          position: "relative",
          color: "white",
          padding: isMobile ? "1.25rem" : "1.75rem",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        {/* Frozen state overlay */}
        {!isCardActive && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              borderRadius: "20px"
            }}
          >
            <span
              style={{
                fontSize: isMobile ? "1.2rem" : "1.5rem",
                fontWeight: 900,
                color: "#EF4444",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: "0.4rem 1.5rem",
                borderRadius: "8px",
                border: "2px solid #EF4444",
                letterSpacing: "3px",
                textTransform: "uppercase",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
              }}
            >
              FROZEN
            </span>
          </div>
        )}

        {/* Abstract holographic glow effect in card background */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
            pointerEvents: "none"
          }}
        />

        {/* Card Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontWeight: 800, fontSize: isMobile ? "0.9rem" : "1.05rem", letterSpacing: "1px" }}>SECURE VAULT</span>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px",
                textTransform: "uppercase"
              }}
            >
              PREMIUM
            </span>
          </div>
          <Wifi size={isMobile ? 16 : 20} style={{ transform: "rotate(90deg)", color: "rgba(255, 255, 255, 0.7)" }} />
        </div>

        {/* Chip Icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 1 }}>
          <div
            style={{
              width: isMobile ? "32px" : "40px",
              height: isMobile ? "22px" : "28px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              borderRadius: "6px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
              position: "relative"
            }}
          >
            {/* Fine metallic grid lines on chip */}
            <div style={{ position: "absolute", top: "0", left: isMobile ? "10px" : "13px", right: isMobile ? "10px" : "13px", bottom: "0", borderLeft: "1px solid rgba(0,0,0,0.15)", borderRight: "1px solid rgba(0,0,0,0.15)" }} />
            <div style={{ position: "absolute", left: "0", top: isMobile ? "7px" : "9px", right: "0", bottom: isMobile ? "7px" : "9px", borderTop: "1px solid rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(0,0,0,0.15)" }} />
          </div>
        </div>

        {/* Card Number */}
        <div
          style={{
            fontSize: isMobile ? "1rem" : "1.35rem",
            fontWeight: 700,
            fontFamily: "monospace",
            letterSpacing: isMobile ? "0px" : "2px",
            zIndex: 1,
            color: "rgba(255,255,255,0.95)",
            display: "flex",
            justifyContent: isMobile ? "space-between" : "flex-start",
            width: "100%"
          }}
        >
          {isMobile ? (
            displayCardNumber.split(" ").map((chunk, idx) => (
              <span key={idx} style={{ letterSpacing: "1px" }}>{chunk}</span>
            ))
          ) : (
            displayCardNumber
          )}
        </div>

        {/* Card Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.15rem" }}>
              Cardholder Name
            </div>
            <div style={{ fontSize: isMobile ? "0.75rem" : "0.85rem", fontWeight: 700, letterSpacing: "0.5px", color: "white" }}>
              {cardholderName ? cardholderName.toUpperCase() : "VALUED CUSTOMER"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.15rem" }}>
              Expires
            </div>
            <div style={{ fontSize: isMobile ? "0.75rem" : "0.85rem", fontWeight: 700, fontFamily: "monospace" }}>
              {revealed ? "12 / 30" : "** / **"}
            </div>
          </div>
        </div>
      </div>
    </PopInteractive>
  );
};

export default VirtualCard;
