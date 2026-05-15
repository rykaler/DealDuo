// SellerProfile.js

import React, {
  useEffect,
  useState,
} from "react";

import { supabase }
from "./supabaseClient";

import "./Profile.css";

const SellerProfile = ({
  sellerId,
  goBack,
}) => {

  const [seller, setSeller] =
    useState(null);

  const [listings, setListings] =
    useState([]);

  useEffect(() => {
    fetchSeller();
  }, []);

  const fetchSeller =
    async () => {

    // FETCH SELLER
    const {
      data: sellerData,
    } = await supabase
      .from("users")
      .select("*")
      .eq("id", sellerId)
      .single();

    setSeller(sellerData);

    // FETCH SELLER LISTINGS
    const { data } =
      await supabase
        .from("listings")
        .select("*")
        .eq("user_id", sellerId)
        .order("created_at", {
          ascending: false,
        });

    setListings(data || []);
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
            Seller Profile
          </span>
        </button>

      </div>

      {/* =========================
          PROFILE CARD
      ========================= */}
      <div className="profile-card">

        <div className="profile-avatar">
          {seller?.email?.[0]?.toUpperCase() || "U"}
        </div>

        <h1>
          {seller?.name ||
            seller?.email?.split("@")[0]}
        </h1>

        <p className="email">
          {seller?.email}
        </p>

      </div>

      {/* =========================
          LISTINGS
      ========================= */}
      <div className="my-listings">

        <h2>Seller Listings</h2>

        <div className="listing-grid">

          {listings.length === 0 ? (

            <p>No listings yet.</p>

          ) : (

            listings.map((item) => (

              <div
                className={`listing-card ${
                  item.is_sold
                    ? "sold"
                    : item.is_traded
                    ? "traded"
                    : ""
                }`}
                key={item.id}
              >

                {/* SOLD */}
                {item.is_sold && (
                  <div className="badge">
                    SOLD
                  </div>
                )}

                {/* TRADED */}
                {item.is_traded && (
                  <div className="badge traded">
                    TRADED
                  </div>
                )}

                {/* IMAGE */}
                <img
                  src={item.image_url}
                  alt=""
                />

                {/* INFO */}
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

export default SellerProfile;