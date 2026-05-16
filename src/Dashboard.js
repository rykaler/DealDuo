// =========================
// Dashboard.js
// =========================

import React, {
  useEffect,
  useState
} from "react";

import { supabase }
from "./supabaseClient";

import "./Dashboard.css";

import EditListing
from "./EditListing";

import ListingDetails
from "./ListingDetails";

const Dashboard = ({
  goAddListing,
  goChat,
  goMessages,
  goTrades,
  goProfile,
  goSellerProfile
}) => {

  const [listings, setListings] =
    useState([]);

  const [filtered, setFiltered] =
    useState([]);

  const [user, setUser] =
    useState(null);

  const [showMenu, setShowMenu] =
    useState(false);

  const [showFilters, setShowFilters] =
    useState(false);

  const [category, setCategory] =
    useState("");

  const [priceRange, setPriceRange] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [editItem, setEditItem] =
    useState(null);

  const [selectedListing, setSelectedListing] =
    useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {

    const { data } =
      await supabase.auth.getUser();

    setUser(data.user);

    fetchListings();
  };

  // =========================
  // FETCH LISTINGS
  // =========================

  const fetchListings = async () => {

    // GET LISTINGS
    const { data, error } =
      await supabase
        .from("listings")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.log(error);
      return;
    }

    // GET SELLER INFO
    const updatedListings =
      await Promise.all(

        (data || []).map(
          async (item) => {

            const {
              data: seller
            } = await supabase
              .from("users")
              .select("name, email")
              .eq("id", item.user_id)
              .single();

            return {
              ...item,

              seller_name:
                seller?.name ||

                seller?.email?.split("@")[0] ||

                "User"
            };
          }
        )
      );

    setListings(updatedListings);
  };

  // =========================
  // FILTERS
  // =========================

  useEffect(() => {

    let temp = [...listings];

    if (category) {
      temp = temp.filter(
        (i) =>
          i.category === category
      );
    }

    if (priceRange === "low") {
      temp = temp.filter(
        (i) => i.price <= 500
      );
    }

    if (priceRange === "mid") {
      temp = temp.filter(
        (i) =>
          i.price > 500 &&
          i.price <= 2000
      );
    }

    if (priceRange === "high") {
      temp = temp.filter(
        (i) => i.price > 2000
      );
    }

    if (status === "available") {
      temp = temp.filter(
        (i) =>
          !i.is_sold &&
          !i.is_traded
      );
    }

    if (status === "sold") {
      temp = temp.filter(
        (i) => i.is_sold
      );
    }

    if (status === "traded") {
      temp = temp.filter(
        (i) => i.is_traded
      );
    }

    setFiltered(temp);

  }, [
    listings,
    category,
    priceRange,
    status,
  ]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {

    await supabase.auth.signOut();

    window.location.href = "/";
  };

  // =========================
  // OPEN DETAILS
  // =========================

  if (selectedListing) {

    return (
      <ListingDetails
        listingId={selectedListing}
        goBack={() =>
          setSelectedListing(null)
        }
        goChat={goChat}
        goSellerProfile={
          goSellerProfile
        }
      />
    );
  }

  const displayItems =
    category ||
    priceRange ||
    status
      ? filtered
      : listings;

  return (
    <div className="dashboard">

      {editItem && (
        <EditListing
          id={editItem}
          onClose={() => {
            setEditItem(null);
            fetchListings();
          }}
        />
      )}

      {/* SIDEBAR */}
      <div className="sidebar">

        <h2 className="logo">
          DEAL<span>DUO</span>
        </h2>

        <button className="menu-item active">
          Home
        </button>

        <button
          className="menu-item"
          onClick={goTrades}
        >
          Trade Requests
        </button>

        <button
          className="menu-item"
          onClick={goMessages}
        >
          Messages
        </button>

      </div>

      {/* MAIN */}
      <div className="main">

        {/* TOPBAR */}
        <div className="topbar">

          <input
            className="search"
            placeholder="Search..."
          />

          <div className="top-actions">

            <button
              className="add-btn"
              onClick={goAddListing}
            >
              + Add Listing
            </button>
            <div className="filter-wrapper">

  <button
    className="filter-toggle"
    onClick={() =>
      setShowFilters(
        !showFilters
      )
    }
  >
    Filter
  </button>

  {showFilters && (

    <div className="filter-dropdown">

      {/* CATEGORY */}
      <div className="filter-group">

        <p>Category</p>

        <button
          onClick={() =>
            setCategory("")
          }
        >
          All
        </button>

        <button
          onClick={() =>
            setCategory(
              "Books"
            )
          }
        >
          Books
        </button>

        <button
          onClick={() =>
            setCategory(
              "Uniform"
            )
          }
        >
          Uniform
        </button>

        <button
          onClick={() =>
            setCategory(
              "Electronics"
            )
          }
        >
          Electronics
        </button>

      </div>

      {/* PRICE */}
      <div className="filter-group">

        <p>Price</p>

        <button
          onClick={() =>
            setPriceRange("")
          }
        >
          All
        </button>

        <button
          onClick={() =>
            setPriceRange(
              "low"
            )
          }
        >
          Below ₱500
        </button>

        <button
          onClick={() =>
            setPriceRange(
              "mid"
            )
          }
        >
          ₱500 - ₱2000
        </button>

        <button
          onClick={() =>
            setPriceRange(
              "high"
            )
          }
        >
          Above ₱2000
        </button>

      </div>

      {/* STATUS */}
      <div className="filter-group">

        <p>Status</p>

        <button
          onClick={() =>
            setStatus("")
          }
        >
          All
        </button>

        <button
          onClick={() =>
            setStatus(
              "available"
            )
          }
        >
          Available
        </button>

        <button
          onClick={() =>
            setStatus(
              "sold"
            )
          }
        >
          Sold
        </button>

        <button
          onClick={() =>
            setStatus(
              "traded"
            )
          }
        >
          Traded
        </button>

      </div>

    </div>

  )}

</div>

            {/* AVATAR */}
            <div
              className="avatar"
              onClick={() =>
                setShowMenu(!showMenu)
              }
            >
              {user?.email?.[0]?.toUpperCase() ||
                "U"}
            </div>

            {/* DROPDOWN */}
            {showMenu && (
              <div className="dropdown">

                <p onClick={goProfile}>
                  My Profile
                </p>

                <p
                  onClick={handleLogout}
                >
                  Logout
                </p>

              </div>
            )}

          </div>

        </div>

        {/* TITLE */}
        <h1 className="title">
          Marketplace
        </h1>

        {/* PRODUCTS */}
        <div className="products">

          {displayItems.map((item) => (

            <div
              className={`product-card ${
                item.is_sold
                  ? "sold-card"
                  : item.is_traded
                  ? "traded-card"
                  : ""
              }`}
              key={item.id}

              onClick={() =>
                setSelectedListing(
                  item.id
                )
              }
            >

              {/* IMAGE */}
              <div className="image-wrapper">

                <img
                  src={item.image_url}
                  alt=""
                />

                {item.is_sold && (
                  <div className="image-overlay">
                    SOLD
                  </div>
                )}

                {item.is_traded && (
                  <div className="image-overlay">
                    TRADED
                  </div>
                )}

              </div>

              {/* INFO */}
              <div className="product-info">

                <h4>
                  {item.title}
                </h4>

                <p className="price">
                  ₱{item.price}
                </p>

                <p className="posted-by">
                  Posted by{" "}
                  {item.seller_name}
                </p>

                <p className="posted-time">

                  {new Date(
                    item.created_at
                  ).toLocaleDateString()}

                </p>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default Dashboard;