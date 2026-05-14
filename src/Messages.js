import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Messages.css";

const Messages = ({ goBack, openChat }) => {

  const [user, setUser] = useState(null);

  const [conversations, setConversations] =
    useState([]);

  const [toast, setToast] =
    useState("");

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {

    if (user) {

      fetchMessages();

      // REALTIME
      const channel =
        supabase
          .channel("messages-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
            },
            () => {
              fetchMessages();
            }
          )
          .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

  }, [user]);

  /* GET USER */
  const getUser = async () => {

    const { data } =
      await supabase.auth.getUser();

    setUser(data.user);
  };

  /* FETCH CONVERSATIONS */
  const fetchMessages = async () => {

    const { data: messages, error } =
      await supabase
        .from("messages")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error || !messages) {
      console.log(error);
      return;
    }

    const unique = {};

    for (const msg of messages) {

      // ONLY USER'S MESSAGES
      if (
        msg.sender_id !== user.id &&
        msg.receiver_id !== user.id
      ) {
        continue;
      }

      const otherUserId =
        msg.sender_id === user.id
          ? msg.receiver_id
          : msg.sender_id;

      if (!unique[otherUserId]) {

        // GET USER NAME
        const {
          data: userInfo
        } = await supabase
          .from("users")
          .select("name")
          .eq("id", otherUserId)
          .single();

        unique[otherUserId] = {
          ...msg,
          otherUserId,
          otherUserName:
            userInfo?.name ||
            "Unknown User",
        };
      }
    }

    setConversations(
      Object.values(unique)
    );
  };

  /* TOAST */
  const showToast = (message) => {

    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  return (
    <div className="messages-page">

      {/* SIDEBAR */}
      <div className="messages-sidebar">

        {/* HEADER */}
        <div className="messages-header">

          <button onClick={goBack}>
            ←
          </button>

          <h2>Messages</h2>

        </div>

        {/* LIST */}
        <div className="messages-list">

          {conversations.length === 0 ? (

            <div className="empty-msg">
              No conversations yet
            </div>

          ) : (

            conversations.map((msg) => (

              <div
                key={msg.id}
                className="message-item"
              >

                <div
                  className="message-left"
                  onClick={() =>
                    openChat(
                      msg.otherUserId
                    )
                  }
                >

                  {/* AVATAR */}
                  <div className="avatar">

                    {msg.otherUserName
                      ?.slice(0, 1)
                      .toUpperCase()}

                  </div>

                  {/* INFO */}
                  <div className="message-info">

                    <p>
                      {msg.otherUserName}
                    </p>

                    <small>
                      {msg.text}
                    </small>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="chat-preview">

        <h3>
          Select a conversation
        </h3>

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

export default Messages;