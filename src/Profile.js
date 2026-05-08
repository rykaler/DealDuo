// Profile.js

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Profile.css";

const Profile = ({ goBack }) => {

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      setListings(data || []);
    }
  };

  return (
    <div className="profile-page">

      {/* =========================
          TOP BAR
      ========================= */}
      <div className="profile-top">

        <button
          className="back-btn"
          onClick={goBack}
        >
          <span className="arrow">
            ←
          </span>

          <span className="back-text">
            Profile
          </span>
        </button>

      </div>

      {/* =========================
          PROFILE CARD
      ========================= */}
      <div className="profile-card">

        <div className="profile-avatar">
          {user?.email?.[0]?.toUpperCase() || "U"}
        </div>

        <h1>
          {user?.email?.split("@")[0]}
        </h1>

        <p className="email">
          {user?.email}
        </p>

      </div>

      {/* =========================
          MY LISTINGS
      ========================= */}
      <div className="my-listings">

        <h2>My Listings</h2>

        <div className="listing-grid">

          {listings.length === 0 ? (

            <p>No listings yet.</p>

          ) : (

            listings.map((item) => (

              <div
                className="listing-card"
                key={item.id}
              >

                {item.is_sold && (
                  <div className="badge">
                    SOLD
                  </div>
                )}

                {item.is_traded && (
                  <div className="badge">
                    TRADED
                  </div>
                )}

                <img
                  src={item.image_url}
                  alt=""
                />

                <h3>{item.title}</h3>

                <p className="price">
                  ₱{item.price}
                </p>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
};

export default Profile;