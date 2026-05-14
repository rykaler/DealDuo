// TradeRequests.js

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Trade.css";

export default function TradeRequests({
  goBack,
  goChat
}) {

  const [trades, setTrades] =
    useState([]);

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    init();
  }, []);

  const init = async () => {

    const { data } =
      await supabase.auth.getUser();

    setUser(data.user);

    await fetchTrades();

    setLoading(false);
  };

  // =========================
  // FETCH TRADES
  // =========================
  const fetchTrades = async () => {

    const { data, error } =
      await supabase
        .from("trades")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.log(error);
      return;
    }

    setTrades(data || []);
  };

  // =========================
  // ACCEPT TRADE
  // =========================
  const acceptTrade = async (
    trade
  ) => {

    try {

      // UPDATE TRADE STATUS
      await supabase
        .from("trades")
        .update({
          status: "accepted",
        })
        .eq("id", trade.id);

      // SWAP OWNERSHIP
      await supabase
        .from("listings")
        .update({
          user_id:
            trade.receiver_id,
          is_sold: false,
        })
        .eq("id", trade.sender_item);

      await supabase
        .from("listings")
        .update({
          user_id:
            trade.sender_id,
          is_sold: false,
        })
        .eq("id", trade.receiver_item);

      // CHECK EXISTING CHAT
      const {
        data: existingChat
      } = await supabase
        .from("chats")
        .select("*")
        .eq("trade_id", trade.id)
        .maybeSingle();

      // CREATE CHAT
      if (!existingChat) {

        await supabase
          .from("chats")
          .insert([
            {
              user1:
                trade.sender_id,
              user2:
                trade.receiver_id,
              trade_id:
                trade.id,
            },
          ]);
      }

      await fetchTrades();

      // OPEN CHAT
      if (goChat) {
        goChat(trade.sender_id);
      }

    } catch (err) {

      console.log(
        "ACCEPT ERROR:",
        err
      );
    }
  };

  // =========================
  // REJECT TRADE
  // =========================
  const rejectTrade = async (
    id
  ) => {

    try {

      await supabase
        .from("trades")
        .update({
          status: "rejected",
        })
        .eq("id", id);

      await fetchTrades();

    } catch (err) {

      console.log(
        "REJECT ERROR:",
        err
      );
    }
  };

  // =========================
  // COMPLETE TRADE
  // =========================
  const completeTrade = async (
    trade
  ) => {

    try {

      await supabase
        .from("trades")
        .update({
          status: "completed",
        })
        .eq("id", trade.id);

      await fetchTrades();

    } catch (err) {

      console.log(
        "COMPLETE ERROR:",
        err
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {

    return (
      <div className="trade-page">
        <p>Loading...</p>
      </div>
    );
  }

  // =========================
  // NO USER
  // =========================
  if (!user) {

    return (
      <div className="trade-page">
        <p>No user found</p>
      </div>
    );
  }

  // =========================
  // MY TRADES
  // =========================
  const myTrades =
    trades.filter(
      (t) =>
        String(t.receiver_id) ===
        String(user.id)
    );

  return (

    <div className="trade-page">

      {/* HEADER */}
      <div className="trade-header">

        <button
          className="back-btn-trade"
          onClick={goBack}
        >
          ←
        </button>

        <h2>
          Trade Requests
        </h2>

      </div>

      {/* EMPTY */}
      {myTrades.length === 0 && (

        <p className="empty-text">
          No trade requests yet.
        </p>
      )}

      {/* TRADE CARDS */}
      {myTrades.map((t) => (

        <div
          key={t.id}
          className="trade-card"
        >

          <p>
            <b>Status:</b>{" "}
            {t.status}
          </p>

          <p>
            <b>Sender:</b>{" "}
            {t.sender_id}
          </p>

          <p>
            <b>Sender Item:</b>{" "}
            {t.sender_item}
          </p>

          <p>
            <b>Receiver Item:</b>{" "}
            {t.receiver_item}
          </p>

          {/* PENDING */}
          {t.status ===
            "pending" && (

            <div className="trade-actions">

              <button
                onClick={() =>
                  acceptTrade(t)
                }
              >
                Accept
              </button>

              <button
                onClick={() =>
                  rejectTrade(t.id)
                }
              >
                Reject
              </button>

            </div>
          )}

          {/* ACCEPTED */}
          {t.status ===
            "accepted" &&

            String(
              t.receiver_id
            ) ===
              String(user.id) && (

              <div className="trade-actions">

                <button
                  onClick={() =>
                    completeTrade(t)
                  }
                >
                  Mark as Completed
                </button>

              </div>
            )}

          {/* COMPLETED */}
          {t.status ===
            "completed" && (

            <p className="completed">
              ✔ Trade Completed
            </p>
          )}

        </div>
      ))}

    </div>
  );
}