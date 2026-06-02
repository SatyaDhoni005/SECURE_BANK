import { useState, useEffect } from "react";
import { ArrowUpRight, Landmark, Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { PopInteractive } from "./Animated";
import { ApiService } from "../services/Api";

const RecentTransactions = ({ limit }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 350);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getTransactions();
        if (data.success) {
          setTransactions(data.transactions);
        } else {
          setError(data.message || "Failed to load transactions.");
        }
      } catch (err) {
        setError(err.message || "Unable to connect to transaction ledger.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 350);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine display limits automatically
  const activeLimit = limit || (window.location.pathname.includes("dashboard") ? 4 : null);
  const displayedTxns = activeLimit ? transactions.slice(0, activeLimit) : transactions;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <RefreshCw size={24} className="spinner" style={{ color: "var(--accent)", animation: "spin 1s linear infinite", margin: "0 auto 0.5rem" }} />
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Loading ledger transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", gap: "0.5rem", padding: "1rem", backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-md)", color: "var(--danger)", fontSize: "0.85rem", alignItems: "center", justifyContent: "center" }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "20px",
        border: "1px solid var(--border-color)",
        padding: isSmallMobile ? "1rem" : isMobile ? "1.25rem" : "1.75rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: isSmallMobile ? "0.75rem" : "1.25rem"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3
          style={{
            fontSize: isSmallMobile ? "0.9rem" : "1rem",
            fontWeight: 800,
            color: "var(--primary)",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <Landmark size={isSmallMobile ? 16 : 18} style={{ color: "var(--accent)" }} /> Recent Transactions
        </h3>
        <span
          style={{
            fontSize: isSmallMobile ? "0.65rem" : "0.7rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            cursor: "pointer",
            textDecoration: "underline"
          }}
          onClick={() => window.location.pathname = "/transactions"}
        >
          Audit Ledger
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: isSmallMobile ? "0.6rem" : "0.85rem" }}>
        {displayedTxns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No recent transactions logged in this audit ledger.
          </div>
        ) : (
          displayedTxns.map((txn, idx) => {
            const isCredit = txn.type === "credit";
            const color = isCredit ? "#10B981" : "#EF4444";
            const bg = isCredit ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)";
            
            // Set dynamic icon matching design
            let icon = isCredit ? <Landmark size={16} /> : <ArrowUpRight size={16} />;
            if (txn.description.toLowerCase().includes("vault")) {
              icon = <Landmark size={16} />;
            } else if (txn.description.toLowerCase().includes("wire") || txn.description.toLowerCase().includes("inflow")) {
              icon = <Wallet size={16} />;
            }

            return (
              <PopInteractive key={idx} scale={0.99} hoverScale={1.01}>
                <div
                  style={{
                    padding: isSmallMobile ? "0.6rem 0.75rem" : "0.85rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: isSmallMobile ? "0.5rem" : "0.75rem", flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: color,
                        backgroundColor: bg,
                        padding: isSmallMobile ? "0.4rem" : "0.5rem",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isSmallMobile ? "0.75rem" : "0.85rem", fontWeight: 700, color: "var(--primary)", whiteSpace: "normal", wordBreak: "break-word" }}>
                        {txn.description}
                      </div>
                      <div style={{ fontSize: isSmallMobile ? "0.62rem" : "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem", whiteSpace: "normal" }}>
                        {txn.id} • {txn.date}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: isSmallMobile ? "0.8rem" : "0.9rem",
                      fontWeight: 800,
                      color: color,
                      textAlign: "right",
                      flexShrink: 0,
                      marginLeft: isSmallMobile ? "0.4rem" : "0.5rem"
                    }}
                  >
                    {isCredit ? "+" : "-"} ${txn.amount}
                  </div>
                </div>
              </PopInteractive>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
