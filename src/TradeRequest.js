import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Trade.css";

export default function TradeRequests({ goBack, goChat }) {
  const [trades, setTrades] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    await fetchTrades();
    setLoading(false);
  };

  const fetchTrades = async () => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    setTrades(data || []);
  };

  // =========================
  // ACCEPT TRADE (START TRADE)
  // =========================
  const acceptTrade = async (trade) => {
    try {
      // 1. update status → accepted
      await supabase
        .from("trades")
        .update({ status: "accepted" })
        .eq("id", trade.id);

      // 2. swap ownership
      await supabase
        .from("listings")
        .update({
          user_id: trade.receiver_id,
          is_sold: true,
        })
        .eq("id", trade.sender_item);

      await supabase
        .from("listings")
        .update({
          user_id: trade.sender_id,
          is_sold: true,
        })
        .eq("id", trade.receiver_item);

      // 3. create chat room (safe check)
      const { data: existingChat } = await supabase
        .from("chats")
        .select("*")
        .eq("trade_id", trade.id)
        .maybeSingle();

      if (!existingChat) {
        await supabase.from("chats").insert([
          {
            user1: trade.sender_id,
            user2: trade.receiver_id,
            trade_id: trade.id,
          },
        ]);
      }

      await fetchTrades();

      // 4. go to chat
      if (goChat) {
        goChat(trade.sender_id);
      }
    } catch (err) {
      console.log("ACCEPT ERROR:", err);
    }
  };

  // =========================
  // REJECT TRADE
  // =========================
  const rejectTrade = async (id) => {
    await supabase
      .from("trades")
      .update({ status: "rejected" })
      .eq("id", id);

    await fetchTrades();
  };

  // =========================
  // COMPLETE TRADE (ONLY RECEIVER CAN CLICK)
  // =========================
  const completeTrade = async (trade) => {
    try {
      await supabase
        .from("trades")
        .update({ status: "completed" })
        .eq("id", trade.id);

      await fetchTrades();
    } catch (err) {
      console.log("COMPLETE ERROR:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>No user found</p>;

  // ONLY SHOW MY RECEIVED TRADES
  const myTrades = trades.filter(
    (t) => String(t.receiver_id) === String(user.id)
  );

  return (
    <div className="trade-page">

      <button onClick={goBack}>← Back</button>

      <h2>Trade Requests</h2>

      {myTrades.length === 0 && <p>No trade requests yet.</p>}

      {myTrades.map((t) => (
        <div key={t.id} className="trade-card">

          <p><b>Status:</b> {t.status}</p>
          <p>Sender: {t.sender_id}</p>
          <p>Sender Item: {t.sender_item}</p>
          <p>Receiver Item: {t.receiver_item}</p>

          {/* =========================
              PENDING
          ========================= */}
          {t.status === "pending" && (
            <div>
              <button onClick={() => acceptTrade(t)}>
                Accept
              </button>

              <button onClick={() => rejectTrade(t.id)}>
                Reject
              </button>
            </div>
          )}

          {/* =========================
              ACCEPTED (ONLY RECEIVER CAN COMPLETE)
          ========================= */}
          {t.status === "accepted" &&
            String(t.receiver_id) === String(user.id) && (
              <div>
                <button onClick={() => completeTrade(t)}>
                  Mark as Completed
                </button>
              </div>
            )}

          {/* =========================
              COMPLETED
          ========================= */}
          {t.status === "completed" && (
            <p style={{ color: "limegreen" }}>
              ✔ Trade Completed
            </p>
          )}

        </div>
      ))}
    </div>
  );
}