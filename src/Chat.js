// =========================
// CHAT.JS
// =========================

import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import { supabase }
from "./supabaseClient";

import "./Chat.css";

const Chat = ({
  receiverId,
  goBack,
}) => {

  const [user, setUser] =
    useState(null);

  const [receiver, setReceiver] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [toast, setToast] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [severity, setSeverity] =
    useState("low");

  const [isBlocked, setIsBlocked] =
    useState(false);

  const bottomRef = useRef();

  /* =========================
     GET USER
  ========================= */

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {

    const { data } =
      await supabase.auth.getUser();

    setUser(data.user);

    if (data.user) {

      // CHECK IF SUSPENDED
      const {
        data: currentUser
      } = await supabase

        .from("users")

        .select("is_suspended")

        .eq(
          "id",
          data.user.id
        )

        .single();

      if (
        currentUser?.is_suspended
      ) {

        alert(
          "Your account has been suspended."
        );

        window.location.href = "/";
        return;
      }

      // RECEIVER INFO
      const {
        data: receiverData
      } = await supabase

        .from("users")

        .select("name,email")

        .eq(
          "id",
          receiverId
        )

        .single();

      setReceiver(receiverData);

      checkBlocked(
        data.user.id
      );
    }
  };

  /* =========================
     CHECK BLOCK
  ========================= */

  const checkBlocked =
    async (myId) => {

    const { data } =
      await supabase

        .from("blocked_users")

        .select("*")

        .or(
          `and(blocker_id.eq.${myId},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${myId})`
        );

    setIsBlocked(
      data?.length > 0
    );
  };

  /* =========================
     FETCH MESSAGES
  ========================= */

  useEffect(() => {

    if (!user) return;

    fetchMessages();

    const channel =
      supabase
        .channel(
          "chat-realtime"
        )

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },

          (payload) => {

            const newMessage =
              payload.new;

            const isCurrentChat =
              (
                newMessage.sender_id ===
                  user.id &&
                newMessage.receiver_id ===
                  receiverId
              ) ||

              (
                newMessage.sender_id ===
                  receiverId &&
                newMessage.receiver_id ===
                  user.id
              );

            if (
              isCurrentChat
            ) {

              setMessages(
                (prev) => [
                  ...prev,
                  newMessage,
                ]
              );

            }

          }
        )

        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };

  }, [user, receiverId]);

  const fetchMessages =
    async () => {

    const { data } =
      await supabase

        .from("messages")

        .select("*")

        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
        )

        .order(
          "created_at",
          {
            ascending: true,
          }
        );

    setMessages(
      data || []
    );
  };

  /* =========================
     AUTO SCROLL
  ========================= */

  useEffect(() => {

    bottomRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [messages]);

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage =
    async () => {

    if (isBlocked) {

      return showToast(
        "🚫 Chat blocked"
      );
    }

    if (!text.trim())
      return;

    const messageText =
      text;

    setText("");

    await supabase

      .from("messages")

      .insert({

        sender_id:
          user.id,

        receiver_id:
          receiverId,

        text:
          messageText,

      });
  };

  /* =========================
     REPORT USER
  ========================= */

  const reportUser =
    async () => {

    // CHECK EXISTING REPORT
    const {
      data: existing
    } = await supabase

      .from("reports")

      .select("*")

      .eq(
        "reporter_id",
        user.id
      )

      .eq(
        "reported_id",
        receiverId
      );

    if (
      existing &&
      existing.length > 0
    ) {

      return showToast(
        "⚠ You already reported this user"
      );
    }

    // INSERT REPORT
    const { error } =
      await supabase

        .from("reports")

        .insert({

          reporter_id:
            user.id,

          reported_id:
            receiverId,

          severity,

          reason:
            severity ===
            "high"

              ? "Harassment / Scam"

              : severity ===
                "medium"

              ? "Misleading Information"

              : "Spam",

        });

    if (error) {

      console.log(error);

      return showToast(
        "❌ Failed to report"
      );
    }

    // COUNT REPORTS
    const {
      data: reportCount
    } = await supabase

      .from("reports")

      .select("*")

      .eq(
  "reported_id",
  receiverId
)
.limit(5);

    // AUTO SUSPEND AFTER 5 REPORTS
if (
  (reportCount?.length || 0) >= 5
) {

  const targetId =
    reportCount[0]
      ?.reported_id;

  const {
    data: suspendedUser,
    error: suspendError
  } = await supabase

    .from("users")

    .update({
      is_suspended: true
    })

    .eq(
      "id",
      targetId
    )

    .select();

  console.log(
    "Suspended User:",
    suspendedUser
  );

  console.log(
    "Suspend Error:",
    suspendError
  );
}
    setMenuOpen(false);
  };

  /* =========================
     BLOCK USER
  ========================= */

  const blockUser =
    async () => {

    const {
      data: existing
    } = await supabase

      .from(
        "blocked_users"
      )

      .select("*")

      .eq(
        "blocker_id",
        user.id
      )

      .eq(
        "blocked_id",
        receiverId
      );

    if (
      existing &&
      existing.length > 0
    ) {

      return showToast(
        "🚫 User already blocked"
      );
    }

    await supabase

      .from(
        "blocked_users"
      )

      .insert({

        blocker_id:
          user.id,

        blocked_id:
          receiverId,

      });

    setIsBlocked(true);

    showToast(
      "🚫 User blocked"
    );

    setMenuOpen(false);
  };

  /* =========================
     TOAST
  ========================= */

  const showToast =
    (msg) => {

      setToast(msg);

      setTimeout(() => {

        setToast("");

      }, 3000);
    };

  /* =========================
     UI
  ========================= */

  return (

    <div className="chat-page">

      {/* HEADER */}
      <div className="chat-header">

        <div className="header-left">

          <button
            onClick={
              goBack
            }
          >
            ←
          </button>

          <h3>

            {receiver?.name ||

              receiver?.email
                ?.split("@")[0] ||

              "Conversation"}

          </h3>

        </div>

        {/* REPORT */}
        <div className="report-wrap">

          <button
            className="report-btn"

            onClick={() =>
              setMenuOpen(
                !menuOpen
              )
            }
          >
            Report
          </button>

          {menuOpen && (

            <div className="report-menu">

              <div className="severity-wrap">

                <label>
                  Severity
                </label>

                <select

                  value={
                    severity
                  }

                  onChange={(
                    e
                  ) =>
                    setSeverity(
                      e.target
                        .value
                    )
                  }
                >

                  <option value="low">
                    Spam
                  </option>

                  <option value="medium">
                    Misleading
                  </option>

                  <option value="high">
                    Scam / Harassment
                  </option>

                </select>

              </div>

              <button
                onClick={
                  reportUser
                }
              >
                ⚠ Report User
              </button>

              <button
                onClick={
                  blockUser
                }
              >
                🚫 Block User
              </button>

            </div>

          )}

        </div>

      </div>

      {/* BLOCKED */}
      {isBlocked && (

        <div className="block-banner">

          🚫 One of you blocked
          this conversation

        </div>

      )}

      {/* CHAT */}
      <div className="chat-box">

        {messages.length ===
          0 && (

          <div className="no-msg">

            No messages yet

          </div>

        )}

        {messages.map(
          (msg) => (

            <div

              key={msg.id}

              className={
                msg.sender_id ===
                user?.id

                  ? "my-msg"

                  : "their-msg"
              }
            >

              {msg.text}

            </div>

          )
        )}

        <div ref={bottomRef}></div>

      </div>

      {/* INPUT */}
      <div className="chat-input">

        <input

          value={text}

          disabled={
            isBlocked
          }

          onChange={(e) =>
            setText(
              e.target.value
            )
          }

          placeholder={
            isBlocked

              ? "Messaging disabled"

              : "Type message..."
          }

          onKeyDown={(
            e
          ) => {

            if (
              e.key ===
              "Enter"
            ) {

              sendMessage();

            }

          }}
        />

        <button

          onClick={
            sendMessage
          }

          disabled={
            isBlocked
          }
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