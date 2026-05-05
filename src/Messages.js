import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Messages.css";

const Messages = ({ goBack, openChat }) => {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [reportUser, setReportUser] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return;

    const unique = {};

    data.forEach((msg) => {
      const other =
        msg.sender_id === user.id
          ? msg.receiver_id
          : msg.sender_id;

      if (!unique[other]) unique[other] = msg;
    });

    setConversations(Object.values(unique));
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="messages-page">

      <div className="messages-sidebar">

        <div className="messages-header">
          <button onClick={goBack}>←</button>
          <h2>Messages</h2>
        </div>

        <div className="messages-list">

          {conversations.map((msg) => {
            const otherUser =
              msg.sender_id === user.id
                ? msg.receiver_id
                : msg.sender_id;

            return (
              <div key={msg.id} className="message-item">

                <div
                  className="message-left"
                  onClick={() => openChat(otherUser)}
                >
                  <div className="avatar">
                    {otherUser?.slice(0, 1)}
                  </div>

                  <div className="message-info">
                    <p>{otherUser}</p>
                    <small>{msg.text}</small>
                  </div>
                </div>

                <button
                  className="report-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportUser(otherUser);
                  }}
                >
                  ⚠
                </button>

              </div>
            );
          })}

        </div>
      </div>

      <div className="chat-preview">
        <h3>Select a conversation</h3>
      </div>

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}

    </div>
  );
};

export default Messages;