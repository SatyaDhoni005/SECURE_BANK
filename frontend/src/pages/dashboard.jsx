import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Landmark,
  LogOut,
  AlertCircle,
  User,
  Settings as SettingsIcon,
  Bell,
  X,
} from "lucide-react";
import { ApiService } from "../services/Api";
import { Animated, AnimatedStagger } from "../components/Animated";
import VirtualCard from "../components/VirtualCard";
import QRCodeCard from "../components/QRCodeCard";
import QuickActions from "../components/QuickActions";
import RecentTransactions from "../components/RecentTransactions";
import HiddenBalance from "../components/HiddenBalance";

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdowns when clicking outside for a premium interactive feel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch protected bank account details
  const fetchAccountDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getDashboardData();
      setData(response);

      // Also fetch real-time transaction ledger entries for real notifications!
      try {
        const txnResponse = await ApiService.getTransactions();
        if (txnResponse.success) {
          setTransactions(txnResponse.transactions);
        }
      } catch (e) {
        console.error(
          "Failed to sync transactions for dynamic notifications:",
          e,
        );
      }
    } catch (err) {
      setError(
        err.message || "Failed to sync with the secure banking mainframe.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, []);

  // Establish secure, persistent WebSockets connection for live updates
  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;
    let isMounted = true;

    const connectWebSocket = () => {
      on;
      const token = localStorage.getItem("secure_bank_access_token");
      if (!token) return;

      try {
        const wsProtocol =
          window.location.protocol === "https:" ? "wss:" : "ws:";
        const apiBaseHost = (
          import.meta.env.VITE_API_URL || "http://localhost:8000/api"
        )
          .replace("http://", "")
          .replace("https://", "")
          .split("/")[0];

        const wsUrl = `${wsProtocol}//${apiBaseHost}/ws/updates/?token=${token}`;

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log(
            "Secure bank mainframe WebSockets telemetry link active.",
          );
        };

        socket.onmessage = (event) => {
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.type === "balance_and_transaction") {
              // 1. Instantly update balance
              setData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  balance: eventData.balance,
                };
              });

              // 2. Instantly prepend new transaction to ledger
              setTransactions((prev) => {
                if (prev.some((t) => t.id === eventData.transaction.id)) {
                  return prev;
                }
                return [eventData.transaction, ...prev];
              });
            }
          } catch (e) {
            console.error("Failed to parse WebSockets payload:", e);
          }
        };

        socket.onclose = (event) => {
          console.log(
            "WebSocket telemetry link disconnected. Reason code:",
            event.code,
          );
          if (isMounted && event.code !== 4003) {
            reconnectTimeout = setTimeout(connectWebSocket, 5000);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket telemetry link exception:", err);
          socket.close();
        };
      } catch (err) {
        console.error(
          "Failed to initialize WebSocket telemetry connection:",
          err,
        );
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Fetch/initialize notifications including dynamic ledger activities & security alerts
  useEffect(() => {
    if (data) {
      const email = data.email || "user";
      const readIds = JSON.parse(
        localStorage.getItem(`read_notifications_${email}`) || "[]",
      );

      const list = [];

      // 1. DYNAMIC TRANSACTION LEDGER NOTIFICATIONS
      transactions.forEach((txn) => {
        const isCredit = txn.type === "credit";

        let emoji = isCredit ? "💰" : "💸";
        let title = isCredit ? "Amount Credited" : "Amount Debited";

        list.push({
          id: `txn-${txn.id}`,
          type: txn.type, // 'credit' or 'debit'
          title: `${emoji} ${title}`,
          message: isCredit
            ? `${txn.description} of $${txn.amount} has been successfully processed.`
            : `${txn.description} of $${txn.amount} has been authorized and debited.`,
          time: txn.date,
          timestamp: 0, // Keep transactions in their current order
        });
      });

      // 2. DYNAMIC SYSTEM SECURITY NOTIFICATIONS
      if (!data.pin_created) {
        list.push({
          id: "sec-pin-alert",
          type: "alert",
          title: "🚨 Action Required",
          message:
            "Your Transaction PIN has not been configured. Setup a PIN to secure balance access.",
          time: "Just now",
          timestamp: Date.now(),
        });
      } else {
        list.push({
          id: "sec-pin-ok",
          type: "success",
          title: "🟢 Account Secured",
          message:
            "Transaction PIN configured. Multi-factor vault security is active.",
          time: "Active",
          timestamp: Date.now() - 600000, // 10 minutes ago
        });
      }

      // Fetch dynamic alerts from localStorage (for password changes, PIN updates, etc.)
      const customAlerts = JSON.parse(
        localStorage.getItem(`security_alerts_${email}`) || "[]",
      );
      customAlerts.forEach((alert) => {
        if (!list.some((item) => item.id === alert.id)) {
          list.push(alert);
        }
      });

      // 3. DYNAMIC SYSTEM & ACCOUNT STATE ISSUES
      if (data.status && data.status !== "ACTIVE") {
        list.push({
          id: "acc-restricted",
          type: "alert",
          title: "⚠️ Account Restricted",
          message: `Your account status is currently ${data.status}. Please contact mainframe operations immediately.`,
          time: "Urgent",
          timestamp: Date.now(),
        });
      }

      // Compliance status
      list.push({
        id: "sys-compliance",
        type: "success",
        title: "✅ Compliance Passed",
        message:
          "Security KYC compliance verification checks completed successfully.",
        time: "System",
        timestamp: Date.now() - 3600000, // 1 hour ago
      });

      // Map dynamic "read" state based on readIds stored in localStorage
      const mappedList = list.map((item) => ({
        ...item,
        read: readIds.includes(item.id),
      }));

      // Unread notifications and alerts always at the top!
      mappedList.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return b.timestamp - a.timestamp;
      });

      setNotifications(mappedList);
      setUnreadCount(mappedList.filter((n) => !n.read).length);
    }
  }, [data, transactions]);

  const handleToggleNotifications = () => {
    const nextVal = !showNotifications;
    setShowNotifications(nextVal);
    if (nextVal) {
      markAllAsRead();
    }
  };

  const markAllAsRead = () => {
    if (data) {
      const email = data.email || "user";
      const allIds = notifications.map((n) => n.id);
      localStorage.setItem(
        `read_notifications_${email}`,
        JSON.stringify(allIds),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleSignOut = () => {
    // Purge session tokens
    localStorage.removeItem("secure_bank_access_token");
    localStorage.removeItem("secure_bank_refresh_token");
    localStorage.removeItem("secure_bank_user");
    navigate("/signin");
  };

  // Graceful loading skeleton
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0A2540 0%, #1A365D 100%)",
          color: "white",
          fontFamily: "var(--sans)",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            className="spinner"
            style={{
              width: "40px",
              height: "40px",
              borderWidth: "3px",
              borderTopColor: "#10B981",
              marginBottom: "1rem",
            }}
          ></span>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            Establishing encrypted session...
          </p>
        </div>
      </div>
    );
  }

  // Graceful network disconnect/error state
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0A2540 0%, #1A365D 100%)",
          color: "white",
          fontFamily: "var(--sans)",
          padding: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16px)",
            borderRadius: "24px",
            padding: "3rem",
            maxWidth: "480px",
            width: "100%",
            boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              border: "2px solid #EF4444",
              color: "#EF4444",
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2
            style={{
              color: "white",
              fontSize: "1.5rem",
              marginBottom: "0.75rem",
              fontWeight: 800,
            }}
          >
            Session Synced Error
          </h2>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.65)",
              fontSize: "0.9rem",
              lineHeight: "1.5",
              marginBottom: "2rem",
            }}
          >
            {error}
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <button
              onClick={fetchAccountDetails}
              style={{
                backgroundColor: "#10B981",
                color: "white",
                border: "none",
                padding: "0.8rem",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              Reconnect Mainframe
            </button>
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: "transparent",
                color: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "0.8rem",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              Secure Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format account number for elegant premium rendering (e.g. SBK-2026-3090)
  const formattedAccountNumber = data?.account_number
    ? data.account_number.startsWith("SBK")
      ? data.account_number.replace(/(SBK)(\d{4})(\d+)/, "$1-$2-$3")
      : data.account_number.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
    : "•••• •••• ••••";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: "var(--sans)",
        color: "var(--text-primary)",
      }}
    >
      {/* Premium Dark Navigation Bar */}
      <nav
        style={{
          backgroundColor: "#0A2540",
          color: "white",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            width: "95%",
            margin: "0 auto",
            padding: isMobile ? "1rem" : "1.25rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                padding: "0.5rem",
                borderRadius: "8px",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Landmark size={18} />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: isMobile ? "1.05rem" : "1.15rem",
                letterSpacing: "-0.5px",
              }}
            >
              SECURE BANK
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "0.75rem" : "1.5rem",
            }}
          >
            {!isMobile && (
              <div style={{ textAlign: "right", display: "block" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  Secure Session
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  {data.name}
                </div>
              </div>
            )}

            {/* Premium Notification Bell */}
            <div style={{ position: "relative" }} ref={notificationRef}>
              <button
                onClick={() =>
                  isMobile ? setShowDrawer(true) : handleToggleNotifications()
                }
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.16)";
                  e.currentTarget.style.color = "#10B981";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "white";
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    className="animate-glow-pulse"
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "9px",
                      backgroundColor: "#EF4444",
                      border: "1.5px solid #0A2540",
                      color: "white",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                      zIndex: 10,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown menu */}
              <div
                className={`dropdown-wrap-container ${showNotifications ? "open" : ""}`}
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: "0",
                  backgroundColor: "white",
                  borderRadius: "16px",
                  boxShadow:
                    "0 10px 30px rgba(10, 37, 64, 0.15), 0 1px 3px rgba(10, 37, 64, 0.05)",
                  border: "1px solid var(--border-color)",
                  width: "340px",
                  padding: "1.25rem",
                  zIndex: 1000,
                  color: "var(--primary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: "#0A2540",
                    }}
                  >
                    Security & Ledger Alerts
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#10B981",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    marginBottom: "0.75rem",
                  }}
                ></div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  {notifications.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "1.5rem 0",
                        color: "var(--text-secondary)",
                        fontSize: "0.8rem",
                      }}
                    >
                      No recent security or ledger logs.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      let icon = "🔔";
                      let bg = "rgba(10, 37, 64, 0.02)";
                      if (notif.type === "credit") {
                        icon = "💰";
                        bg = "rgba(16, 185, 129, 0.04)";
                      } else if (notif.type === "debit") {
                        icon = "💸";
                        bg = "rgba(239, 68, 68, 0.02)";
                      } else if (notif.type === "alert") {
                        icon = "⚠️";
                        bg = "rgba(239, 68, 68, 0.04)";
                      } else if (notif.type === "success") {
                        icon = "🛡️";
                        bg = "rgba(16, 185, 129, 0.04)";
                      }

                      return (
                        <div
                          key={notif.id}
                          style={{
                            display: "flex",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            borderRadius: "12px",
                            backgroundColor: notif.read ? "transparent" : bg,
                            border: notif.read
                              ? "1px solid transparent"
                              : "1px solid rgba(10, 37, 64, 0.05)",
                            transition: "all 0.2s",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.15rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor:
                                notif.type === "credit" ||
                                notif.type === "success"
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : "rgba(239, 68, 68, 0.1)",
                              flexShrink: 0,
                            }}
                          >
                            {icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 800,
                                  color: "#0A2540",
                                }}
                              >
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: "#EF4444",
                                  }}
                                ></span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-secondary)",
                                lineHeight: "1.3",
                                marginTop: "0.15rem",
                              }}
                            >
                              {notif.message}
                            </div>
                            <div
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--text-muted)",
                                marginTop: "0.25rem",
                                fontWeight: 600,
                              }}
                            >
                              {notif.time}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Round Interactive Avatar Circle */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() =>
                  isMobile
                    ? setShowDrawer(true)
                    : setShowDropdown(!showDropdown)
                }
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                  color: "white",
                  border: "2px solid rgba(255, 255, 255, 0.15)",
                  fontWeight: 800,
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(16, 185, 129, 0.25)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.15)";
                }}
              >
                {data.name ? data.name.charAt(0).toUpperCase() : "U"}
              </button>

              {/* Premium Animated Dropdown Menu Box */}
              {!isMobile && showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: "0",
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow:
                      "0 10px 30px rgba(10, 37, 64, 0.15), 0 1px 3px rgba(10, 37, 64, 0.05)",
                    border: "1px solid var(--border-color)",
                    width: "210px",
                    padding: "0.75rem",
                    zIndex: 1000,
                    animation:
                      "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  }}
                >
                  {/* Header Information */}
                  <div style={{ padding: "0.5rem", marginBottom: "0.5rem" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: "var(--primary)",
                      }}
                    >
                      {data.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Personal Wealth Account
                    </div>
                  </div>

                  <div
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      marginBottom: "0.5rem",
                    }}
                  ></div>

                  {/* Settings Route Button */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/settings");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: "8px",
                      color: "var(--primary)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-primary)";
                      e.currentTarget.style.color = "var(--border-focus)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--primary)";
                    }}
                  >
                    <SettingsIcon size={16} /> Portal Settings
                  </button>

                  {/* Logout solid red background */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleSignOut();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      backgroundColor: "#EF4444",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      marginTop: "0.25rem",
                      boxShadow: "0 2px 6px rgba(239, 68, 68, 0.2)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#DC2626";
                      e.currentTarget.style.boxShadow =
                        "0 4px 10px rgba(239, 68, 68, 0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#EF4444";
                      e.currentTarget.style.boxShadow =
                        "0 2px 6px rgba(239, 68, 68, 0.2)";
                    }}
                  >
                    <LogOut size={16} /> Secure Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div
        style={{
          maxWidth: "1440px",
          width: "95%",
          margin: "0 auto",
          padding: "3rem 2rem",
        }}
      >
        {/* Welcome Banner */}
        <AnimatedStagger type="slide-up" interval={80} duration={900}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h1
              style={{
                fontSize: "2.25rem",
                color: "#0A2540",
                fontWeight: 800,
                letterSpacing: "-0.8px",
                marginBottom: "0.4rem",
              }}
            >
              Welcome back, {data.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Your secure vault portal is synchronized. Last verified:{" "}
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Sprint 2 Transaction PIN Alert Banner */}
          {data?.pin_created === false && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "20px",
                padding: "1.75rem",
                marginBottom: "2.5rem",
                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.05)",
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                animation: "fadeIn 0.4s ease-out",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  lineHeight: "1",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "0.75rem",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔴
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: "0 0 0.5rem 0",
                    color: "#0A2540",
                    fontSize: "1.15rem",
                    fontWeight: 800,
                  }}
                >
                  Security Alert
                </h3>
                <p
                  style={{
                    margin: "0 0 0.75rem 0",
                    color: "rgba(10, 37, 64, 0.85)",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    lineHeight: "1.4",
                  }}
                >
                  Your Transaction PIN has not been configured.
                </p>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  Create a PIN to unlock:
                  <ul
                    style={{
                      margin: "0.4rem 0 0 1.25rem",
                      padding: 0,
                      listStyleType: "disc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                      fontWeight: 550,
                    }}
                  >
                    <li>Balance Access</li>
                    <li>Money Transfers</li>
                    <li>Card Controls</li>
                  </ul>
                </div>
                <button
                  onClick={() => navigate("/pin-management")}
                  style={{
                    backgroundColor: "#EF4444",
                    color: "white",
                    border: "none",
                    padding: "0.65rem 1.5rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#DC2626";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 15px rgba(239, 68, 68, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#EF4444";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(239, 68, 68, 0.25)";
                  }}
                >
                  Create PIN
                </button>
              </div>
            </div>
          )}

          {/* Cards Layout Grid / Flex */}
          {isMobile ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                width: "100%",
              }}
            >
              {/* 1. Balance Card */}
              <div
                className="auth-card"
                style={{
                  maxWidth: "100%",
                  padding: "0",
                  overflow: "hidden",
                  backgroundColor: "white",
                  border: "1px solid var(--border-color)",
                  borderRadius: "20px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                }}
              >
                {/* Premium Gradient Header block containing Hidden Balance */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #0A2540 0%, #1A365D 100%)",
                    padding: "2rem 1.5rem",
                    color: "white",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      color: "rgba(255, 255, 255, 0.05)",
                      pointerEvents: "none",
                    }}
                  >
                    <Landmark size={100} />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontWeight: 700,
                        color: "#10B981",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                      }}
                    >
                      Premium Savings Vault
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                        color: "#10B981",
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#10B981",
                          display: "inline-block",
                          boxShadow: "0 0 8px #10B981",
                        }}
                      ></span>
                      {data.status}
                    </div>
                  </div>

                  {/* Integrated Hidden Balance Component */}
                  <HiddenBalance
                    balance={data.balance}
                    pinCreated={data?.pin_created}
                  />
                </div>

                {/* White Detailed block */}
                <div style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "1.25rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Account Owner
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#0A2540",
                          fontSize: "1.05rem",
                        }}
                      >
                        {data.name}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Account Number
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color: "#0A2540",
                          fontSize: "1.05rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {formattedAccountNumber}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. QR Code Card */}
              <QRCodeCard
                accountNumber={data?.account_number}
                localIp={data?.local_ip}
              />

              {/* 3. Mainframe Navigation */}
              <QuickActions />

              {/* 4. Virtual debit access card */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--text-muted)",
                  }}
                >
                  Virtual Ledger Access Card
                </div>
                <VirtualCard
                  cardholderName={data.name}
                  accountNumber={data.account_number}
                  cardNumber={data.card_number}
                  revealed={false}
                  isCardActive={data.is_card_active !== false}
                />
              </div>

              {/* 5. Recent Transactions */}
              <RecentTransactions />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr",
                gap: "2.5rem",
                alignItems: "start",
              }}
            >
              {/* Left Column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem",
                }}
              >
                <div
                  className="auth-card"
                  style={{
                    maxWidth: "100%",
                    padding: "0",
                    overflow: "hidden",
                    backgroundColor: "white",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  {/* Premium Gradient Header block containing Hidden Balance */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #0A2540 0%, #1A365D 100%)",
                      padding: "2.25rem 2.5rem",
                      color: "white",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "1.5rem",
                        right: "1.5rem",
                        color: "rgba(255, 255, 255, 0.05)",
                        pointerEvents: "none",
                      }}
                    >
                      <Landmark size={140} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          fontWeight: 700,
                          color: "#10B981",
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        Premium Savings Vault
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.8rem",
                          color: "#10B981",
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#10B981",
                            display: "inline-block",
                            boxShadow: "0 0 8px #10B981",
                          }}
                        ></span>
                        {data.status}
                      </div>
                    </div>

                    {/* Integrated Hidden Balance Component */}
                    <HiddenBalance
                      balance={data.balance}
                      pinCreated={data?.pin_created}
                    />
                  </div>

                  {/* White Detailed block */}
                  <div style={{ padding: "2rem 2.5rem" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "2rem",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Account Owner
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#0A2540",
                            fontSize: "1.05rem",
                          }}
                        >
                          {data.name}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Vault Account Number
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontFamily: "monospace",
                            color: "#0A2540",
                            fontSize: "1.05rem",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {formattedAccountNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virtual Debit Card Mockup (Full Width in Left Column) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Virtual Ledger Access Card
                  </div>
                  <VirtualCard
                    cardholderName={data.name}
                    accountNumber={data.account_number}
                    cardNumber={data.card_number}
                    revealed={false}
                    isCardActive={data.is_card_active !== false}
                  />
                </div>

                {/* Recent Transactions Component */}
                <RecentTransactions />
              </div>

              {/* Right Column: QR Mobile Sync (Top, beside Balance Card) & Mainframe Navigation (Bottom) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2rem",
                }}
              >
                {/* QR Mobile Sync */}
                <QRCodeCard
                  accountNumber={data?.account_number}
                  localIp={data?.local_ip}
                />

                {/* Mainframe Navigation component */}
                <QuickActions />
              </div>
            </div>
          )}
        </AnimatedStagger>
      </div>

      {/* Mobile Sidebar Navigation Drawer */}
      {isMobile && showDrawer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            display: "flex",
            justifyContent: "flex-end",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowDrawer(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(10, 37, 64, 0.45)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: "relative",
              width: "280px",
              height: "100%",
              backgroundColor: "white",
              boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "column",
              padding: "1.5rem",
              overflowY: "auto",
              animation:
                "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              color: "var(--primary)",
            }}
          >
            {/* Header / Profile */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                    color: "white",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                  }}
                >
                  {data.name ? data.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>
                    {data.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Personal Wealth
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                style={{
                  background: "rgba(10, 37, 64, 0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--primary)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                borderBottom: "1px solid var(--border-color)",
                marginBottom: "1.25rem",
              }}
            ></div>

            {/* Quick Actions (Settings & Logout) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <button
                onClick={() => {
                  setShowDrawer(false);
                  navigate("/settings");
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <SettingsIcon size={16} /> Portal Settings
              </button>
              <button
                onClick={() => {
                  setShowDrawer(false);
                  handleSignOut();
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#EF4444",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  boxShadow: "0 2px 6px rgba(239, 68, 68, 0.2)",
                }}
              >
                <LogOut size={16} /> Secure Sign Out
              </button>
            </div>

            <div
              style={{
                borderBottom: "1px solid var(--border-color)",
                marginBottom: "1.25rem",
              }}
            ></div>

            {/* Notifications Section */}
            <h4
              style={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "#0A2540",
                margin: "0 0 1rem 0",
              }}
            >
              Security & Ledger Alerts
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                flex: 1,
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1rem 0",
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                  }}
                >
                  No recent notifications.
                </div>
              ) : (
                notifications.map((notif) => {
                  let icon = "🔔";
                  if (notif.type === "credit") icon = "💰";
                  else if (notif.type === "debit") icon = "💸";
                  else if (notif.type === "alert") icon = "⚠️";
                  else if (notif.type === "success") icon = "🛡️";

                  return (
                    <div
                      key={notif.id}
                      style={{
                        display: "flex",
                        gap: "0.6rem",
                        padding: "0.6rem",
                        borderRadius: "10px",
                        backgroundColor: notif.read
                          ? "transparent"
                          : "rgba(10, 37, 64, 0.02)",
                        border: "1px solid rgba(10, 37, 64, 0.05)",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor:
                            notif.type === "credit" || notif.type === "success"
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              color: "#0A2540",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {notif.title}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-secondary)",
                            lineHeight: "1.3",
                            marginTop: "0.1rem",
                            wordBreak: "break-word",
                          }}
                        >
                          {notif.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
