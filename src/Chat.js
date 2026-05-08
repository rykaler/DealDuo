import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Chat.css";

const Chat = ({ receiverId, goBack }) => {

  const [user, setUser] = useState(null);

  const [receiver, setReceiver] = useState(null);

  const [userStatus, setUserStatus] = useState(null);

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [toast, setToast] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {

    const { data } = await supabase.auth.getUser();

    setUser(data.user);

    if (data.user) {

      // GET CURRENT USER STATUS
      const { data: status } = await supabase
        .from("users")
        .select(
          "is_suspended, chat_disabled, suspension_reason"
        )
        .eq("id", data.user.id)
        .single();

      setUserStatus(status);

      // GET RECEIVER INFO
      const { data: receiverData } = await supabase
        .from("users")
        .select("email")
        .eq("id", receiverId)
        .single();

      setReceiver(receiverData);
    }
  };

  useEffect(() => {
    if (user && receiverId) {
      fetchMessages();
    }
  }, [user, receiverId]);

  const fetchMessages = async () => {

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order("created_at", {
        ascending: true,
      });

    setMessages(data || []);
  };

  // BLOCK IF RESTRICTED
  const isBlocked =
    userStatus?.is_suspended ||
    userStatus?.chat_disabled;

  const sendMessage = async () => {

    if (isBlocked) {
      return showToast(
        "⚠ You are restricted from sending messages"
      );
    }

    if (!text.trim()) return;

    await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        text,
      });

    setText("");

    fetchMessages();
  };

  // REPORT
  const reportUser = async () => {

    await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: receiverId,
        reason: "User reported from chat",
      });

    showToast("⚠ User reported");
  };

  // BLOCK
  const blockUser = async () => {

    await supabase
      .from("blocked_users")
      .insert({
        blocker_id: user.id,
        blocked_id: receiverId,
      });

    showToast("🚫 User blocked");
  };

  const showToast = (msg) => {

    setToast(msg);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  return (
    <div className="chat-page">

      {/* HEADER */}
      <div className="chat-header">

        <div className="header-left">

          <button onClick={goBack}>
            ←
          </button>

          {/* ✅ USER NAME */}
          <h3>
            {receiver?.email
              ? receiver.email.split("@")[0]
              : "Conversation"}
          </h3>

        </div>

        {/* REPORT */}
        <div className="report-wrap">

          <button className="report-btn">
            Report
          </button>

          <div className="report-menu">

            <button onClick={reportUser}>
              ⚠ Report User
            </button>

            <button onClick={blockUser}>
              🚫 Block User
            </button>

          </div>

        </div>

      </div>

      {/* WARNING */}
      {userStatus?.is_suspended && (
        <div className="ban-banner">
          ⚠ Your account is suspended
          <br />
          <small>
            {userStatus.suspension_reason}
          </small>
        </div>
      )}

      {userStatus?.chat_disabled &&
        !userStatus?.is_suspended && (
          <div className="ban-banner">
            ⚠ Chat feature is temporarily disabled
          </div>
        )}

      {/* CHAT BOX */}
      <div className="chat-box">

        {messages.length === 0 && (
          <div className="no-msg">
            No messages yet
          </div>
        )}

        {messages.map((msg) => (

          <div
            key={msg.id}
            className={
              msg.sender_id === user?.id
                ? "my-msg"
                : "their-msg"
            }
          >
            {msg.text}
          </div>

        ))}

      </div>

      {/* INPUT */}
      <div className="chat-input">

        <input
          value={text}
          disabled={isBlocked}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder={
            isBlocked
              ? "Messaging disabled"
              : "Type a message..."
          }
        />

        <button
          onClick={sendMessage}
          disabled={isBlocked}
        >
          Send
        </button>

      </div>

      {/* TOAST */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

    </div>
  );
};

export default Chat;