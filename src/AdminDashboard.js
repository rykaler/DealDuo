import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import "./Admin.css";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
);

const AdminDashboard = ({ goBack }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const lastRunRef = useRef(null);

  const [stats, setStats] = useState({
    users: 0,
    reports: 0,
    messages: 0,
    suspended: 0,
    trades: 0,
    sold: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [chartData, setChartData] = useState(null);

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
  };

  // ======================
  // STATS
  // ======================
  const fetchStats = async () => {

    const { count: users } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: reports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    const { count: messages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    const { count: suspended } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_suspended", true);

    // ✅ FIXED TRADES COUNT
    const { count: trades } = await supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .in("status", ["completed", "accepted", "success"]);

    // ✅ SOLD ITEMS
    const { count: sold } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("is_sold", true);

    setStats({
      users: users || 0,
      reports: reports || 0,
      messages: messages || 0,
      suspended: suspended || 0,
      trades: trades || 0,
      sold: sold || 0,
    });

    setChartData({
      labels: [
        "Users",
        "Reports",
        "Messages",
        "Trades",
        "Sold",
      ],
      datasets: [
        {
          label: "System Overview",
          data: [
            users || 0,
            reports || 0,
            messages || 0,
            trades || 0,
            sold || 0,
          ],
          backgroundColor: [
            "#4CAF50",
            "#FF5252",
            "#2196F3",
            "#FFC107",
            "#9C27B0",
          ],
        },
      ],
    });
  };

  // ======================
  // REPORTS
  // ======================
  const fetchReports = async () => {

    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return;

    const ids = [
      ...new Set(
        data.flatMap((r) => [
          r.reporter_id,
          r.reported_id,
        ])
      ),
    ];

    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", ids);

    const map = {};

    users?.forEach((u) => {
      map[u.id] = u.name;
    });

    setReportsList(
      data.map((r) => ({
        id: r.id,
        reason: r.reason,
        severity: r.severity,
        reporterName:
          map[r.reporter_id] ||
          r.reporter_id?.slice(0, 6),

        reportedName:
          map[r.reported_id] ||
          r.reported_id?.slice(0, 6),
      }))
    );
  };

  // ======================
  // TRANSACTIONS
  // ======================
  const fetchTransactions = async () => {

    // ✅ FIXED STATUS FILTER
    const { data } = await supabase
      .from("trades")
      .select("id, sender_id, receiver_id, status")
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

    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", ids);

    const map = {};

    users?.forEach((u) => {
      map[u.id] = u.name;
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

  // ======================
  // SOLD ITEMS
  // ======================
  const fetchSoldItems = async () => {

    const { data } = await supabase
      .from("listings")
      .select("id, title, user_id")
      .eq("is_sold", true);

    if (!data) return;

    const ids = [
      ...new Set(data.map((l) => l.user_id)),
    ];

    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", ids);

    const map = {};

    users?.forEach((u) => {
      map[u.id] = u.name;
    });

    setSoldItems(
      data.map((l) => ({
        ...l,
        ownerName:
          map[l.user_id] ||
          l.user_id?.slice(0, 6),
      }))
    );
  };

  // ======================
  // AUTO MODERATION
  // ======================
  const runAutoModeration = async () => {

    const now = Date.now();

    // 5 MINUTE COOLDOWN
    if (
      lastRunRef.current &&
      now - lastRunRef.current < 300000
    ) {
      alert("Wait before running moderation again");
      return;
    }

    lastRunRef.current = now;

    setLoading(true);

    const { data } = await supabase
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

      if (!map[r.reported_id]) {
        map[r.reported_id] = {
          score: 0,
        };
      }

      map[r.reported_id].score +=
        severityWeight[r.severity] || 1;
    });

    for (const userId in map) {

      const score = map[userId].score;

      const { data: user } = await supabase
        .from("users")
        .select("is_suspended")
        .eq("id", userId)
        .single();

      if (user?.is_suspended) continue;

      // HIDE LISTINGS
      if (score >= 8) {
        await supabase
          .from("listings")
          .update({ hidden: true })
          .eq("user_id", userId);
      }

      // DISABLE CHAT
      if (score >= 12) {
        await supabase
          .from("users")
          .update({
            chat_disabled: true,
          })
          .eq("id", userId);
      }

      // SUSPEND USER
      if (score >= 20) {
        await supabase
          .from("users")
          .update({
            is_suspended: true,
            suspended_at: new Date(),
            suspension_reason:
              "Auto moderation: high report score",
          })
          .eq("id", userId);
      }
    }

    setLoading(false);

    alert("Moderation completed");

    fetchAll();
  };

  // ======================
  // PIE CHART
  // ======================
  const pieData = {
    labels: ["Trades", "Sold"],

    datasets: [
      {
        data: [
          stats.trades,
          stats.sold,
        ],

        backgroundColor: [
          "#00C853",
          "#FF9800",
        ],
      },
    ],
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h3>Admin</h3>

        <p onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </p>

        <p onClick={() => setActiveTab("trades")}>
          Trades
        </p>

        <p onClick={() => setActiveTab("sold")}>
          Sold
        </p>

        <p onClick={() => setActiveTab("reports")}>
          Reports
        </p>
      </div>

      {/* MAIN */}
      <div className="dashboard-container">

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

            <button onClick={runAutoModeration}>
              {loading
                ? "Running..."
                : "Run Moderation"}
            </button>

            <button onClick={goBack}>
              Logout
            </button>

          </div>
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
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

            </div>

            {chartData && (
              <div className="stats-grid">

                <div className="stat-card">
                  <Bar data={chartData} />
                </div>

                <div className="stat-card">
                  <Pie data={pieData} />
                </div>

              </div>
            )}

          </>
        )}

        {/* REPORTS */}
        {activeTab === "reports" && (
          <div className="stats-grid">

            {reportsList.map((r) => (
              <div
                key={r.id}
                className="stat-card"
              >

                <h3
                  style={{
                    color:
                      r.severity === "high"
                        ? "red"
                        : r.severity === "medium"
                        ? "orange"
                        : "green",
                  }}
                >
                  {r.severity?.toUpperCase()}
                </h3>

                <p>
                  From: {r.reporterName}
                </p>

                <p>
                  Against: {r.reportedName}
                </p>

                <small>
                  {r.reason}
                </small>

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
                  Trade #{t.id}
                </h3>

                <p>
                  Sender: {t.senderName}
                </p>

                <p>
                  Receiver: {t.receiverName}
                </p>

                <small>
                  Status: {t.status}
                </small>

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

                <h3>{s.title}</h3>

                <p>
                  Owner: {s.ownerName}
                </p>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;