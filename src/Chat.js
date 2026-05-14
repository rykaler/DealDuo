import React, {
  useEffect,
  useState,
  useRef
} from "react";

import { supabase }
from "./supabaseClient";

import "./Chat.css";

const Chat = ({
  receiverId,
  goBack
}) => {

  const [user, setUser] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {

    if (user) {

      fetchMessages();

      // REALTIME
      const channel =
        supabase
          .channel("chat-room")

          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },

            (payload) => {

              const msg =
                payload.new;

              const isMine =
                msg.sender_id === user.id &&
                msg.receiver_id === receiverId;

              const isTheirs =
                msg.sender_id === receiverId &&
                msg.receiver_id === user.id;

              if (
                isMine ||
                isTheirs
              ) {

                setMessages(
                  (prev) => [
                    ...prev,
                    msg
                  ]
                );
              }
            }
          )

          .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

  }, [user]);

  useEffect(() => {

    bottomRef.current?.
      scrollIntoView({
        behavior: "smooth"
      });

  }, [messages]);

  // GET USER
  const getUser = async () => {

    const { data } =
      await supabase.auth.getUser();

    setUser(data.user);
  };

  // FETCH MESSAGES
  const fetchMessages =
    async () => {

      const { data, error } =
        await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${receiverId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${receiverId})`
          )
          .order("created_at", {
            ascending: true,
          });

      if (error) {
        console.log(error);
        return;
      }

      setMessages(data || []);
    };

  // SEND MESSAGE
  const sendMessage =
    async () => {

      if (!text.trim()) return;

      const { error } =
        await supabase
          .from("messages")
          .insert([
            {
              sender_id:
                user.id,

              receiver_id:
                receiverId,

              text: text,
            },
          ]);

      if (error) {
        console.log(error);
        return;
      }

      setText("");
    };

  return (
    <div className="chat-page">

      {/* HEADER */}
      <div className="chat-header">

        <button
          onClick={goBack}
        >
          ←
        </button>

        <h2>Chat</h2>

      </div>

      {/* BODY */}
      <div className="chat-body">

        {messages.map((msg) => (

          <div
            key={msg.id}
            className={
              msg.sender_id ===
              user?.id
                ? "my-message"
                : "their-message"
            }
          >

            {msg.text}

          </div>

        ))}

        <div ref={bottomRef}></div>

      </div>

      {/* INPUT */}
      <div className="chat-input">

        <input
          type="text"
          placeholder="Type message..."
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
        />

        <button
          onClick={sendMessage}
        >
          Send
        </button>

      </div>

    </div>
  );
};

export default Chat;