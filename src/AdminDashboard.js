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
      messages: 0,
      suspended: 0,
      trades: 0,
      sold: 0,
      blockedUsers: 0,
    });

  // =========================
  // DATA
  // =========================
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

    const { count: messages } =
      await supabase
        .from("messages")
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
      messages: messages || 0,
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
        "Messages",
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
            messages || 0,
            trades || 0,
            sold || 0,
            blockedUsers || 0,
          ],

          backgroundColor: [
            "#4CAF50",
            "#FF5252",
            "#2196F3",
            "#FFC107",
            "#9C27B0",
            "#ff4d4d",
          ],
        },
      ],
    });
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
        .select(
          "id, name, email"
        )
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setReportsList(
      data.map((r) => ({
        id: r.id,

        reason: r.reason,

        severity:
          r.severity,

        reporterName:
          map[r.reporter_id] ||
          r.reporter_id?.slice(
            0,
            6
          ),

        reportedName:
          map[
            r.reported_user_id
          ] ||
          r.reported_user_id?.slice(
            0,
            6
          ),
      }))
    );
  };

  // =========================
  // FETCH TRADES
  // =========================
  const fetchTransactions =
    async () => {

    const { data } =
      await supabase
        .from("trades")
        .select(
          "id, sender_id, receiver_id, status"
        )
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
        .select(
          "id, name, email"
        )
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setTransactions(
      data.map((t) => ({
        id: t.id,

        senderName:
          map[t.sender_id] ||
          t.sender_id?.slice(0, 6),

        receiverName:
          map[t.receiver_id] ||
          t.receiver_id?.slice(0, 6),

        status: t.status,
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
        .select(
          "id, title, user_id"
        )
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
        .select(
          "id, name, email"
        )
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
          l.user_id?.slice(
            0,
            6
          ),
      }))
    );
  };

  // =========================
  // FETCH BLOCKED USERS
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
        .select(
          "id, name, email"
        )
        .in("id", ids);

    const map = {};

    users?.forEach((u) => {

      map[u.id] =
        u.name ||
        u.email?.split("@")[0];

    });

    setBlockedUsers(
      data.map((b) => ({

        id: b.id,

        blockerName:
          map[b.blocker_id] ||
          b.blocker_id?.slice(0, 6),

        blockedName:
          map[b.blocked_id] ||
          b.blocked_id?.slice(0, 6),

      }))
    );
  };

  // =========================
  // RUN AUTO MODERATION
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

    const { data } =
      await supabase
        .from("reports")
        .select("*");

    if (!data) {
      setLoading(false);
      return;
    }

    const severityWeight = {
      low: 1,
      medium: 3,
      high: 7,
    };

    const map = {};

    data.forEach((r) => {

      if (
        !map[
          r.reported_user_id
        ]
      ) {
        map[
          r.reported_user_id
        ] = {
          score: 0,
        };
      }

      map[
        r.reported_user_id
      ].score +=
        severityWeight[
          r.severity
        ] || 1;
    });

    for (const userId in map) {

      const score =
        map[userId].score;

      if (score >= 20) {

        await supabase
          .from("users")
          .update({
            is_suspended: true,
          })
          .eq("id", userId);
      }
    }

    setLoading(false);

    alert(
      "Moderation completed"
    );

    fetchAll();
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

    doc.setFontSize(11);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      30
    );

    autoTable(doc, {
      startY: 40,

      head: [
        ["Category", "Count"]
      ],

      body: [
        ["Users", stats.users],
        ["Reports", stats.reports],
        ["Messages", stats.messages],
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
          🚫 Blocked Users
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
                <h3>Messages</h3>
                <p>{stats.messages}</p>
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

        {/* BLOCKED USERS */}
        {activeTab ===
          "blocked" && (

          <div className="stats-grid">

            {blockedUsers.length === 0 ? (

              <div className="stat-card blocked-card">

                <h3>
                  No blocked users
                </h3>

              </div>

            ) : (

              blockedUsers.map((b) => (

                <div
                  key={b.id}
                  className="stat-card blocked-card"
                >

                  <h3>
                    🚫 Blocked User
                  </h3>

                  <p>
                    Blocked By
                  </p>

                  <small>
                    {b.blockerName}
                  </small>

                  <br />
                  <br />

                  <p>
                    User Blocked
                  </p>

                  <small>
                    {b.blockedName}
                  </small>

                </div>

              ))
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default AdminDashboard;