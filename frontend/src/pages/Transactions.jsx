import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, Calendar, Download, Search } from "lucide-react";
import RecentTransactions from "../components/RecentTransactions";

const Transactions = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", fontFamily: "var(--sans)", color: "var(--text-primary)" }}>
      {/* Top Navbar */}
      <nav style={{ backgroundColor: "#0A2540", padding: isMobile ? "1rem" : "1.25rem 2rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            <span style={{ fontWeight: 800, fontSize: isMobile ? "1.05rem" : "1.15rem", letterSpacing: "-0.5px" }}>SECURE BANK</span>
          </div>
        </div>
        {!isMobile && (
          <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 }}>Real-time Audit Ledger</span>
        )}
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: isMobile ? "1.5rem 1rem" : "3rem 2rem" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? "1rem" : "0px", marginBottom: isMobile ? "1.5rem" : "2.5rem" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.4rem" }}>
              Ledger Transactions
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Comprehensive real-time cryptographic audit of system transactions.
            </p>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              backgroundColor: "white",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              width: isMobile ? "100%" : "auto"
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            backgroundColor: "white",
            border: "1px solid var(--border-color)",
            padding: "0.75rem 1.25rem",
            borderRadius: "14px",
            marginBottom: "1.5rem",
            alignItems: "center"
          }}
        >
          <Search size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder={isMobile ? "Search transactions..." : "Search hash, description, or reference ID..."}
            style={{ border: "none", outline: "none", width: "100%", fontSize: "0.85rem" }}
          />
        </div>

        {/* Recent Transactions List */}
        <RecentTransactions />
      </div>
    </div>
  );
};

export default Transactions;
