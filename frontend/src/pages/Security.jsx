import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, Shield, Key, Eye, CheckCircle2, Lock, Smartphone } from "lucide-react";
import { PopInteractive } from "../components/Animated";

const Security = () => {
  const navigate = useNavigate();

  const safetyItems = [
    { title: "MFA Security Validation", desc: "Two-Factor authentication is active on outbound wires.", status: "Active", color: "#10B981" },
    { title: "Cryptographic SSL Session", desc: "Session SSL socket certificates verified successfully.", status: "Secure", color: "#10B981" },
    { title: "Device Session Token", desc: "Single device connection session authorized dynamically.", status: "Verified", color: "#3B82F6" }
  ];

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
        <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 }}>Security Control Tower</span>
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.4rem" }}>
              Vault Security Core
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              High-level security diagnostics and configurations for your wealth account.
            </p>
          </div>

          {/* Safety Items Card */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.01)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem"
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
              <Shield size={18} style={{ color: "var(--accent)" }} /> System Audits
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {safetyItems.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: idx !== safetyItems.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>{item.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", lineHeight: "1.35" }}>{item.desc}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "white",
                      backgroundColor: item.color,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px"
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Shortcut Button */}
          <PopInteractive scale={0.98} hoverScale={1.02}>
            <div
              style={{
                backgroundColor: "#0A2540",
                color: "white",
                borderRadius: "20px",
                padding: "1.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 10px 25px rgba(10, 37, 64, 0.1)"
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", fontWeight: 800 }}>Detailed Security Options</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" }}>Change password, PINs, or deactivate accounts</p>
              </div>
              <button
                onClick={() => navigate("/settings")}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
              >
                Go to Settings
              </button>
            </div>
          </PopInteractive>
        </div>
      </div>
    </div>
  );
};

export default Security;
