import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, FileText, Download, Calendar, RefreshCw, AlertCircle, Mail } from "lucide-react";
import { PopInteractive } from "../components/Animated";
import { ApiService } from "../services/Api";

const Statements = () => {
  const navigate = useNavigate();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(null); // 'download-[idx]' or 'email-[idx]' or null
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchStatements = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getStatements();
        if (data.success) {
          setStatements(data.statements);
        } else {
          setError(data.message || "Failed to load account statements.");
        }
      } catch (err) {
        setError(err.message || "Unable to connect to mainframe statements ledger.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatements();
  }, []);

  const handleDownload = async (idx, downloadUrl, period) => {
    try {
      setLoadingAction(`download-${idx}`);
      const token = localStorage.getItem('secure_bank_access_token');
      if (!token) {
        throw new Error('Unauthorized session. Please login to continue.');
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download statement PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Statement-${period.replace(" ", "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Statement Download Error: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmail = async (idx, year, month, period) => {
    try {
      setLoadingAction(`email-${idx}`);
      const response = await ApiService.emailStatement(year, month);
      if (response.success) {
        alert(response.message || `Certified statement PDF for ${period} has been successfully sent to your email.`);
      } else {
        alert(response.message || "Failed to email statement PDF.");
      }
    } catch (err) {
      alert("Statement Email Error: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

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
          <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700 }}>Certified Statements Audit</span>
        )}
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: isMobile ? "1.5rem 1rem" : "3rem 2rem" }}>
        <div style={{ marginBottom: isMobile ? "1.5rem" : "2.5rem" }}>
          <h1 style={{ fontSize: isMobile ? "1.5rem" : "2rem", color: "#0A2540", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.4rem" }}>
            Account Statements
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Certified regulatory PDF statement sheets for offline ledger audits.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <RefreshCw size={32} className="spinner" style={{ color: "var(--accent)", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Fetching dynamic statements list...</p>
          </div>
        )}

        {error && (
          <div style={{ display: "flex", gap: "0.5rem", padding: "1.25rem", backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-lg)", color: "var(--danger)", fontSize: "0.9rem", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {statements.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Statements list is currently empty. They will be generated automatically at the end of each closed calendar month.
              </div>
            ) : (
              statements.map((stmt, idx) => (
                <PopInteractive key={idx} scale={0.99} hoverScale={1.01}>
                  <div
                    style={{
                      backgroundColor: "white",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: isMobile ? "1rem" : "1.25rem 1.5rem",
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "stretch" : "center",
                      gap: "1rem",
                      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.01)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: isMobile ? "auto" : "220px", width: isMobile ? "100%" : "auto" }}>
                      <div
                        style={{
                          color: "var(--accent)",
                          backgroundColor: "var(--bg-primary)",
                          padding: "0.6rem",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)" }}>{stmt.period} Statement</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Calendar size={12} /> Issued on {stmt.date} • {stmt.size}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "0.65rem", width: isMobile ? "100%" : "auto" }}>
                      <button
                        onClick={() => handleDownload(idx, stmt.download_url, stmt.period)}
                        disabled={loadingAction !== null}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                          padding: "0.5rem 1rem",
                          backgroundColor: loadingAction === `download-${idx}` ? "var(--bg-primary)" : "white",
                          border: "1px solid var(--accent)",
                          borderRadius: "8px",
                          color: "var(--accent)",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: loadingAction !== null ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          width: isMobile ? "100%" : "auto"
                        }}
                        onMouseEnter={(e) => {
                          if (loadingAction === null) e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                        }}
                        onMouseLeave={(e) => {
                          if (loadingAction === null) e.currentTarget.style.backgroundColor = "white";
                        }}
                      >
                        {loadingAction === `download-${idx}` ? (
                          <>
                            <RefreshCw size={14} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download size={14} /> Download PDF
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleEmail(idx, stmt.year, stmt.month, stmt.period)}
                        disabled={loadingAction !== null}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                          padding: "0.5rem 1rem",
                          backgroundColor: loadingAction === `email-${idx}` ? "#E8F5E9" : "white",
                          border: "1px solid #10B981",
                          borderRadius: "8px",
                          color: "#10B981",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: loadingAction !== null ? "not-allowed" : "pointer",
                          transition: "all 0.2s",
                          width: isMobile ? "100%" : "auto"
                        }}
                        onMouseEnter={(e) => {
                          if (loadingAction === null) e.currentTarget.style.backgroundColor = "#E8F5E9";
                        }}
                        onMouseLeave={(e) => {
                          if (loadingAction === null) e.currentTarget.style.backgroundColor = "white";
                        }}
                      >
                        {loadingAction === `email-${idx}` ? (
                          <>
                            <RefreshCw size={14} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                            Mailing...
                          </>
                        ) : (
                          <>
                            <Mail size={14} /> Share via Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </PopInteractive>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statements;
