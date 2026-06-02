import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Activity, Key, Settings as SettingsIcon, FileText, CreditCard } from "lucide-react";
import { PopInteractive } from "./Animated";

const QuickActions = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const actions = [
    {
      title: "Transfer Funds",
      subtitle: "Outbound assets",
      icon: <ArrowRightLeft size={20} />,
      route: "/transfer",
      color: "#3B82F6",
      bg: "rgba(59, 130, 246, 0.08)"
    },
    {
      title: "Transactions",
      subtitle: "Ledger logs",
      icon: <Activity size={20} />,
      route: "/transactions",
      color: "#10B981",
      bg: "rgba(16, 185, 129, 0.08)"
    },
    {
      title: "Monthly Audit",
      subtitle: "Certified audits",
      icon: <FileText size={20} />,
      route: "/statements",
      color: "#8B5CF6",
      bg: "rgba(139, 92, 246, 0.08)"
    },
    {
      title: "PIN Manager",
      subtitle: "Access parameters",
      icon: <Key size={20} />,
      route: "/pin-management",
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.08)"
    },
    {
      title: "Virtual Cards",
      subtitle: "Portal debits",
      icon: <CreditCard size={20} />,
      route: "/virtual-card",
      color: "#EC4899",
      bg: "rgba(236, 72, 153, 0.08)"
    },
    {
      title: "Settings",
      subtitle: "Portal configurations",
      icon: <SettingsIcon size={20} />,
      route: "/settings",
      color: "#06B6D4",
      bg: "rgba(6, 182, 212, 0.08)"
    }
  ];

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "20px",
        border: "1px solid var(--border-color)",
        padding: "1.75rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)"
      }}
    >
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 800,
          color: "var(--primary)",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        <Activity size={18} style={{ color: "var(--accent)" }} /> Mainframe Navigation
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: isMobile ? "0.75rem" : "1rem"
        }}
      >
        {actions.map((act, idx) => (
          <PopInteractive key={idx} scale={0.98} hoverScale={1.01}>
            <button
              onClick={() => navigate(act.route)}
              style={{
                width: "100%",
                padding: isMobile ? "0.85rem 1.25rem" : "1.1rem",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                backgroundColor: "white",
                cursor: "pointer",
                display: "flex",
                flexDirection: isMobile ? "row" : "column",
                alignItems: isMobile ? "center" : "flex-start",
                gap: isMobile ? "1rem" : "0.6rem",
                textAlign: "left",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = act.color;
                e.currentTarget.style.boxShadow = `0 4px 12px ${act.bg}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  color: act.color,
                  backgroundColor: act.bg,
                  padding: "0.5rem",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                {act.icon}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>{act.title}</div>
                {!isMobile && (
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {act.subtitle}
                  </div>
                )}
              </div>
            </button>
          </PopInteractive>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
