import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Chat.css";

const Chat = ({ receiverId, goBack }) => {
  const [user, setUser] = useState(null);
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
      const { data: status } = await supabase
        .from("users")
        .select("is_suspended, chat_disabled, suspension_reason")
        .eq("id", data.user.id)
        .single();

      setUserStatus(status);
    }
  };

  useEffect(() => {
    if (user && receiverId) fetchMessages();
  }, [user, receiverId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  // 🚨 BLOCK IF SUSPENDED OR CHAT DISABLED
  const isBlocked =
    userStatus?.is_suspended || userStatus?.chat_disabled;

  const sendMessage = async () => {
    if (isBlocked) {
      return showToast("⚠ You are restricted from sending messages");
    }

    if (!text.trim()) return;

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      text,
    });

    setText("");
    fetchMessages();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="chat-page">

      {/* HEADER */}
      <div className="chat-header">
        <button onClick={goBack}>←</button>
        <h3>Conversation</h3>
      </div>

      {/* 🚨 SUSPENSION WARNING */}
      {userStatus?.is_suspended && (
        <div className="ban-banner">
          ⚠ Your account is suspended
          <br />
          <small>{userStatus.suspension_reason}</small>
        </div>
      )}

      {userStatus?.chat_disabled && !userStatus?.is_suspended && (
        <div className="ban-banner">
          ⚠ Chat feature is temporarily disabled
        </div>
      )}

      {/* CHAT BOX */}
      <div className="chat-box">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender_id === user?.id ? "my-msg" : "their-msg"}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* INPUT (DISABLED IF BLOCKED) */}
      <div className="chat-input">
        <input
          value={text}
          disabled={isBlocked}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isBlocked
              ? "Messaging disabled"
              : "Type a message..."
          }
        />

        <button onClick={sendMessage} disabled={isBlocked}>
          Send
        </button>
      </div>

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default Chat;