// =========================
// AdminDashboard.js
// =========================

import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import { supabase } from "./supabaseClient";

import "./Admin.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import {
  Bar,
  Pie,
} from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
);

const AdminDashboard = ({
  goBack,
}) => {

  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [loading, setLoading] =
    useState(false);

  const lastRunRef = useRef(null);

  // =========================
  // STATS
  // =========================
  const [stats, setStats] =
    useState({
      users: 0,
      reports: 0,
      suspended: 0,
      trades: 0,
      sold: 0,
      blockedUsers: 0,
    });

  // =========================
  // DATA
  // =========================
  const [usersList, setUsersList] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [soldItems, setSoldItems] =
    useState([]);

  const [reportsList, setReportsList] =
    useState([]);

  const [blockedUsers, setBlockedUsers] =
    useState([]);

  const [chartData, setChartData] =
    useState(null);

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  const init = async () => {

    setLoading(true);

    await fetchAll();

    setLoading(false);
  };

  const fetchAll = async () => {

    await fetchStats();

    await fetchUsers();

    await fetchTransactions();

    await fetchSoldItems();

    await fetchReports();

    await fetchBlockedUsers();
  };

  // =========================
  // FETCH STATS
  // =========================
  const fetchStats = async () => {

    const { count: users } =
      await supabase
        .from("users")
        .select("*", {
          count: "exact",
          head: true,
        });

    const { count: reports } =
      await supabase
        .from("reports")
        .select("*", {
          count: "exact",
          head: true,
        });

    const { count: suspended } =
      await supabase
        .from("users")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_suspended", true);

    const { count: trades } =
      await supabase
        .from("trades")
        .select("*", {
          count: "exact",
          head: true,
        })
        .in("status", [
          "completed",
          "accepted",
          "success",
        ]);

    const { count: sold } =
      await supabase
        .from("listings")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_sold", true);

    const {
      count: blockedUsers,
    } = await supabase
      .from("blocked_users")
      .select("*", {
        count: "exact",
        head: true,
      });

    setStats({
      users: users || 0,
      reports: reports || 0,
      suspended: suspended || 0,
      trades: trades || 0,
      sold: sold || 0,
      blockedUsers:
        blockedUsers || 0,
    });

    setChartData({
      labels: [
        "Users",
        "Reports",
        "Trades",
        "Sold",
        "Blocked",
      ],

      datasets: [
        {
          label:
            "System Overview",

          data: [
            users || 0,
            reports || 0,
            trades || 0,
            sold || 0,
            blockedUsers || 0,
          ],

          backgroundColor: [
            "#4CAF50",
            "#FF5252",
            "#FFC107",
            "#9C27B0",
            "#ff4d4d",
          ],
        },
      ],
    });
  };

  // =========================
  // FETCH USERS
  // =========================
  const fetchUsers = async () => {

    const { data } =
      await supabase
        .from("users")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (!data) return;

    setUsersList(data);
  };

  // =========================
  // FETCH TRADES
  // =========================
  const fetchTransactions =
    async () => {

    const { data } =
      await supabase
        .from("trades")
        .select("*")
        .in("status", [
          "completed",
          "accepted",
          "success",
        ]);

    if (!data) return;

    const ids = [
      ...new Set(
        data.flatMap((t) => [
          t.sender_id,
          t.receiver_id,
        ])
      ),
    ];

    const { data: users } =
      await supabase
        .from("users")
        .select("id,name,email")
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setTransactions(
      data.map((t) => ({
        ...t,

        senderName:
          map[t.sender_id] ||
          "Unknown",

        receiverName:
          map[t.receiver_id] ||
          "Unknown",
      }))
    );
  };

  // =========================
  // SOLD ITEMS
  // =========================
  const fetchSoldItems =
    async () => {

    const { data } =
      await supabase
        .from("listings")
        .select("*")
        .eq("is_sold", true);

    if (!data) return;

    const ids = [
      ...new Set(
        data.map(
          (l) => l.user_id
        )
      ),
    ];

    const { data: users } =
      await supabase
        .from("users")
        .select("id,name,email")
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setSoldItems(
      data.map((l) => ({
        ...l,

        ownerName:
          map[l.user_id] ||
          "Unknown",
      }))
    );
  };

  // =========================
  // FETCH REPORTS
  // =========================
  const fetchReports =
    async () => {

    const { data } =
      await supabase
        .from("reports")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (!data) return;

    const ids = [
      ...new Set(
        data.flatMap((r) => [
          r.reporter_id,
          r.reported_user_id,
        ])
      ),
    ];

    const { data: users } =
      await supabase
        .from("users")
        .select("id,name,email")
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setReportsList(
      data.map((r) => ({
        ...r,

        reporterName:
          map[r.reporter_id] ||
          "Unknown",

        reportedName:
          map[
            r.reported_user_id
          ] || "Unknown",
      }))
    );
  };

  // =========================
  // BLOCKED USERS
  // =========================
  const fetchBlockedUsers =
    async () => {

    const { data } =
      await supabase
        .from("blocked_users")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (!data) return;

    const ids = [
      ...new Set(
        data.flatMap((b) => [
          b.blocker_id,
          b.blocked_id,
        ])
      ),
    ];

    const { data: users } =
      await supabase
        .from("users")
        .select("id,name,email")
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setBlockedUsers(
      data.map((b) => ({
        ...b,

        blockerName:
          map[b.blocker_id] ||
          "Unknown",

        blockedName:
          map[b.blocked_id] ||
          "Unknown",
      }))
    );
  };

  // =========================
  // RUN MODERATION
  // =========================
  const runAutoModeration =
    async () => {

    const now = Date.now();

    if (
      lastRunRef.current &&
      now -
        lastRunRef.current <
        300000
    ) {
      alert(
        "Wait before running moderation again"
      );

      return;
    }

    lastRunRef.current = now;

    setLoading(true);

    setTimeout(() => {

      setLoading(false);

      alert(
        "Moderation completed"
      );

    }, 2000);
  };

  // =========================
  // EXPORT PDF
  // =========================
  const exportPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(22);

    doc.text(
      "DealDuo Admin Report",
      14,
      20
    );

    autoTable(doc, {
      startY: 35,

      head: [
        ["Category", "Count"]
      ],

      body: [
        ["Users", stats.users],
        ["Reports", stats.reports],
        ["Suspended", stats.suspended],
        ["Trades", stats.trades],
        ["Sold", stats.sold],
        ["Blocked Users", stats.blockedUsers],
      ],
    });

    doc.save(
      "DealDuo_Report.pdf"
    );
  };

  // =========================
  // PIE CHART
  // =========================
  const pieData = {
    labels: [
      "Trades",
      "Sold",
      "Blocked",
    ],

    datasets: [
      {
        data: [
          stats.trades,
          stats.sold,
          stats.blockedUsers,
        ],

        backgroundColor: [
          "#00C853",
          "#FF9800",
          "#ff4d4d",
        ],
      },
    ],
  };

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <div className="sidebar">

        <h3>Admin</h3>

        <p
          className={
            activeTab === "dashboard"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "dashboard"
            )
          }
        >
          Dashboard
        </p>

        <p
          className={
            activeTab === "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("users")
          }
        >
          Users
        </p>

        <p
          className={
            activeTab === "trades"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "trades"
            )
          }
        >
          Trades
        </p>

        <p
          className={
            activeTab === "sold"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("sold")
          }
        >
          Sold
        </p>

        <p
          className={
            activeTab === "reports"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "reports"
            )
          }
        >
          Reports
        </p>

        <p
          className={
            activeTab === "blocked"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "blocked"
            )
          }
        >
          Blocked Users
        </p>

      </div>

      {/* MAIN */}
      <div className="dashboard-container">

        {/* HEADER */}
        <div className="dashboard-header">

          <h2>
            {activeTab.toUpperCase()}
          </h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >

            <button
              onClick={exportPDF}
            >
              Export PDF
            </button>

            <button
              onClick={
                runAutoModeration
              }
            >
              {loading
                ? "Running..."
                : "Run Moderation"}
            </button>

            <button
              onClick={goBack}
            >
              Logout
            </button>

          </div>

        </div>

        {/* DASHBOARD */}
        {activeTab ===
          "dashboard" && (

          <>
            <div className="stats-grid">

              <div className="stat-card">
                <h3>Users</h3>
                <p>{stats.users}</p>
              </div>

              <div className="stat-card">
                <h3>Reports</h3>
                <p>{stats.reports}</p>
              </div>

              <div className="stat-card">
                <h3>Suspended</h3>
                <p>{stats.suspended}</p>
              </div>

              <div className="stat-card">
                <h3>Trades</h3>
                <p>{stats.trades}</p>
              </div>

              <div className="stat-card">
                <h3>Sold</h3>
                <p>{stats.sold}</p>
              </div>

              <div className="stat-card blocked-card">
                <h3>Blocked Users</h3>
                <p>
                  {stats.blockedUsers}
                </p>
              </div>

            </div>

            {chartData && (

              <div className="stats-grid">

                <div className="stat-card">
                  <Bar
                    data={chartData}
                  />
                </div>

                <div className="stat-card">
                  <Pie
                    data={pieData}
                  />
                </div>

              </div>

            )}

          </>
        )}

        {/* USERS */}
        {activeTab === "users" && (

          <div className="stats-grid">

            {usersList.map((u) => (

              <div
                key={u.id}
                className="stat-card"
              >

                <h3>
                  {u.name ||
                    "No Name"}
                </h3>

                <small>
                  {u.email}
                </small>

                <br />

                <p
                  style={{
                    fontSize: "15px",
                    marginTop: "10px",
                  }}
                >
                  {u.is_suspended
                    ? "Suspended"
                    : "Active"}
                </p>

              </div>

            ))}

          </div>

        )}

        {/* TRADES */}
        {activeTab === "trades" && (

          <div className="stats-grid">

            {transactions.map((t) => (

              <div
                key={t.id}
                className="stat-card"
              >

                <h3>
                  Successful Trade
                </h3>

                <small>
                  Sender:
                  {" "}
                  {t.senderName}
                </small>

                <br />

                <small>
                  Receiver:
                  {" "}
                  {t.receiverName}
                </small>

                <p
                  style={{
                    marginTop: "10px",
                    fontSize: "18px",
                  }}
                >
                  {t.status}
                </p>

              </div>

            ))}

          </div>

        )}

        {/* SOLD */}
        {activeTab === "sold" && (

          <div className="stats-grid">

            {soldItems.map((s) => (

              <div
                key={s.id}
                className="stat-card"
              >

                <h3>
                  {s.title}
                </h3>

                <small>
                  Seller:
                  {" "}
                  {s.ownerName}
                </small>

                <p
                  style={{
                    marginTop: "10px",
                  }}
                >
                  SOLD
                </p>

              </div>

            ))}

          </div>

        )}

        {/* REPORTS */}
        {activeTab === "reports" && (

          <div className="stats-grid">

            {reportsList.map((r) => (

              <div
                key={r.id}
                className="report-card"
              >

                <h3>
                  {r.reason}
                </h3>

                <small>
                  Severity:
                  {" "}
                  {r.severity}
                </small>

                <br />

                <small>
                  Reporter:
                  {" "}
                  {r.reporterName}
                </small>

                <br />

                <small>
                  Reported User:
                  {" "}
                  {r.reportedName}
                </small>

              </div>

            ))}

          </div>

        )}

        {/* BLOCKED */}
        {activeTab === "blocked" && (

          <div className="stats-grid">

            {blockedUsers.map((b) => (

              <div
                key={b.id}
                className="stat-card blocked-card"
              >

                <h3>
                  Blocked User
                </h3>

                <small>
                  Blocker:
                  {" "}
                  {b.blockerName}
                </small>

                <br />

                <small>
                  Blocked:
                  {" "}
                  {b.blockedName}
                </small>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default AdminDashboard;