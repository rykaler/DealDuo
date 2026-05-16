// =========================
// ListingDetails.js
// =========================

import React, {
  useEffect,
  useState
} from "react";

import { supabase }
from "./supabaseClient";

import "./ListingDetails.css";

import EditListing from "./EditListing";

const ListingDetails = ({
  listingId,
  goBack,
  goChat,
  goSellerProfile
}) => {

  const [item, setItem] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [message, setMessage] =
    useState(
      "Hi, is this still available?"
    );

    const [editOpen, setEditOpen] =
  useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();

    setUser(user);

    fetchItem();
  };

  const fetchItem = async () => {

    const { data, error } =
      await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

    if (error) {
      console.log(error);
      return;
    }

    setItem(data);
  };

  // SEND MESSAGE
  const handleSend = async () => {

    if (!user) {
      return alert("Login first");
    }

    if (user.id === item.user_id) {
      return alert(
        "You cannot message yourself"
      );
    }

    const { error } =
      await supabase
        .from("messages")
        .insert([
          {
            sender_id: user.id,
            receiver_id:
              item.user_id,
            text: message
          }
        ]);

    if (error) {
      return alert(error.message);
    }

    alert("Message sent!");

    goChat(item.user_id);
  };

  // DELETE
  const handleDelete = async () => {

    const confirmDelete =
      window.confirm(
        "Delete this listing?"
      );

    if (!confirmDelete) return;

    const { error } =
      await supabase
        .from("listings")
        .delete()
        .eq("id", item.id);

    if (error) {
      return alert(error.message);
    }

    alert("Deleted!");

    goBack();
  };

  // MARK SOLD
  const handleSold = async () => {

    const { error } =
      await supabase
        .from("listings")
        .update({
          is_sold: true
        })
        .eq("id", item.id);

    if (error) {
      return alert(error.message);
    }

    fetchItem();
  };

  // MARK TRADED
  const handleTraded = async () => {

    const { error } =
      await supabase
        .from("listings")
        .update({
          is_traded: true
        })
        .eq("id", item.id);

    if (error) {
      return alert(error.message);
    }

    fetchItem();
  };

if (editOpen) {

  return (
    <EditListing
      id={item.id}
      onClose={() => {

        setEditOpen(false);

        fetchItem();

      }}
    />
  );
}

  if (!item) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }

  return (
    <div className="details-page">

      {/* LEFT SIDE */}
      <div className="details-left">

        <button
          className="back-btn-listing"
          onClick={goBack}
        >
          ✕
        </button>

        <div className="image-container">

          <img
            src={item.image_url}
            alt=""
            className="main-image"
          />

          {item.is_sold && (
            <div className="status-badge">
              SOLD
            </div>
          )}

          {item.is_traded && (
            <div className="status-badge">
              TRADED
            </div>
          )}

        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="details-right">

        <div className="info-card">

          <h1>
            {item.title}
          </h1>

          <h2>
            ₱{item.price}
          </h2>

          <p className="posted">
            Posted on{" "}
            {new Date(
              item.created_at
            ).toLocaleDateString()}
          </p>

          <p className="seller-name">
            Seller:{" "}
            {item.email || "User"}
          </p>

          {/* VIEW PROFILE BUTTON */}
          {user?.id !== item.user_id && (

            <button
              className="view-profile-btn"
              onClick={() =>
                goSellerProfile(
                  item.user_id
                )
              }
            >
              View Profile
            </button>

          )}

          {/* OWNER BUTTONS */}
          {user?.id === item.user_id ? (

            <div className="owner-buttons">

           <button
  className="owner-btn"
  onClick={() =>
    setEditOpen(true)
  }
>
  Edit
</button>

              {!item.is_sold &&
                !item.is_traded && (
                  <>
                    <button
                      className="owner-btn"
                      onClick={
                        handleSold
                      }
                    >
                      Mark as Sold
                    </button>

                    <button
                      className="owner-btn"
                      onClick={
                        handleTraded
                      }
                    >
                      Mark Trade Complete
                    </button>
                  </>
                )}

              <button
                className="delete-btn"
                onClick={
                  handleDelete
                }
              >
                Delete
              </button>

            </div>

          ) : (

            <>
              {/* MESSAGE BUTTON */}
              <div className="action-buttons">

                <button
                  className="message-btn"
                  onClick={() =>
                    goChat(
                      item.user_id
                    )
                  }
                >
                  Message
                </button>

              </div>

              {/* MESSAGE BOX */}
              <div className="seller-box">

                <p>
                  Send seller a message
                </p>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }
                />

                <button
                  className="send-btn"
                  onClick={
                    handleSend
                  }
                >
                  Send
                </button>

              </div>
            </>
          )}

          {/* DETAILS */}
          <div className="details-section">

            <h3>Details</h3>

            <div className="detail-row">

              <span>
                Condition
              </span>

              <span>
                Used
              </span>

            </div>

            <div className="detail-row">

              <span>
                Category
              </span>

              <span>
                {item.category}
              </span>

            </div>

          </div>

          {/* DESCRIPTION */}
          <div className="description-box">

            <h3>
              Description
            </h3>

            <p>
              {item.description}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ListingDetails;