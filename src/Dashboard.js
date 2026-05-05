import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Dashboard.css";
import EditListing from "./EditListing";

const Dashboard = ({ goAddListing, goChat, goMessages, goTrades }) => {
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [user, setUser] = useState(null);

  const [showMenu, setShowMenu] = useState(false);

  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [status, setStatus] = useState("");

  const [editItem, setEditItem] = useState(null);

  const [tradeItem, setTradeItem] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  // INIT
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    fetchListings();

    if (data.user) {
      fetchMyItems(data.user.id);
    }
  };

  // LISTINGS
  const fetchListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    setListings(data || []);
  };

  // MY ITEMS (for trade select)
  const fetchMyItems = async (userId) => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", userId)
      .eq("is_sold", false)
      .eq("is_traded", false);

    setMyItems(data || []);
  };

  // FILTERS
  useEffect(() => {
    let temp = [...listings];

    if (category) temp = temp.filter(i => i.category === category);

    if (priceRange === "low") temp = temp.filter(i => i.price <= 500);
    if (priceRange === "mid") temp = temp.filter(i => i.price > 500 && i.price <= 2000);
    if (priceRange === "high") temp = temp.filter(i => i.price > 2000);

    if (status === "available") {
      temp = temp.filter(i => !i.is_sold && !i.is_traded);
    }

    if (status === "sold") {
      temp = temp.filter(i => i.is_sold);
    }

    if (status === "traded") {
      temp = temp.filter(i => i.is_traded);
    }

    setFiltered(temp);
  }, [listings, category, priceRange, status]);

  // MARK AS SOLD
  const markAsSold = async (id) => {
    await supabase
      .from("listings")
      .update({ is_sold: true })
      .eq("id", id);

    fetchListings();
  };

  // MARK AS TRADED (NEW)
  const markAsTraded = async (id) => {
    await supabase
      .from("listings")
      .update({ is_traded: true })
      .eq("id", id);

    fetchListings();
  };

  // DELETE
  const handleDelete = async (id) => {
    await supabase.from("listings").delete().eq("id", id);
    fetchListings();
  };

  // OPEN TRADE MODAL
  const handleTrade = (item) => {
    setTradeItem(item);
    if (user) fetchMyItems(user.id);
  };

  // SEND TRADE
  const sendTrade = async () => {
    if (!selectedItem) return alert("Select your item!");

    const payload = {
      sender_id: user.id,
      receiver_id: tradeItem.user_id,
      sender_item: selectedItem,
      receiver_item: tradeItem.id,
      status: "pending"
    };

    const { error } = await supabase
      .from("trades")
      .insert([payload]);

    if (error) return alert(error.message);

    alert("Trade sent!");
    setTradeItem(null);
    setSelectedItem("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayItems =
    category || priceRange || status ? filtered : listings;

  return (
    <div className="dashboard">

      {/* TRADE MODAL */}
      {tradeItem && (
        <div className="modal">
          <div className="modal-content">
            <h2>Trade Offer</h2>

            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <option value="">Select your item</option>
              {myItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={sendTrade}>Send</button>
              <button onClick={() => setTradeItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2 className="logo">DEAL<span>DUO</span></h2>

        <button className="menu-item active">Home</button>
        <button className="menu-item" onClick={goTrades}>
          Trade Requests
        </button>
        <button className="menu-item" onClick={goMessages}>
          Messages
        </button>
      </div>

      {/* MAIN */}
      <div className="main">

        <div className="topbar">
          <input className="search" placeholder="Search..." />

          <div className="top-actions">
            <button className="add-btn" onClick={goAddListing}>
              + Add Listing
            </button>

            <div className="avatar" onClick={() => setShowMenu(!showMenu)}>
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>

            {showMenu && (
              <div className="dropdown">
                <p onClick={handleLogout}>Logout</p>
              </div>
            )}
          </div>
        </div>

        <h1 className="title">Marketplace</h1>

        <div className="content">

          {/* FILTERS */}
          <div className="filters">

            <h3>Filters</h3>

            <div className="filter-group">
              <p>Category</p>
              <button onClick={() => setCategory("books")}>Books</button>
              <button onClick={() => setCategory("uniform")}>Uniform</button>
              <button onClick={() => setCategory("electronics")}>Gadgets</button>
              <button onClick={() => setCategory("")}>Clear</button>
            </div>

            <div className="filter-group">
              <p>Price</p>
              <button onClick={() => setPriceRange("low")}>₱0-500</button>
              <button onClick={() => setPriceRange("mid")}>₱500-2000</button>
              <button onClick={() => setPriceRange("high")}>₱2000+</button>
              <button onClick={() => setPriceRange("")}>Clear</button>
            </div>

            <div className="filter-group">
              <p>Status</p>
              <button onClick={() => setStatus("available")}>Available</button>
              <button onClick={() => setStatus("sold")}>Sold</button>
              <button onClick={() => setStatus("traded")}>Traded</button>
              <button onClick={() => setStatus("")}>Clear</button>
            </div>

          </div>

          {/* PRODUCTS */}
          <div className="products">

            {displayItems.map((item) => (
              <div className="product-card" key={item.id}>

                {/* BADGES */}
                {item.is_sold && (
                  <div className="sold-badge">SOLD</div>
                )}

                {item.is_traded && (
                  <div className="sold-badge">TRADED</div>
                )}

                <img src={item.image_url} alt="" />

                <h4>{item.title}</h4>
                <p className="price">₱{item.price}</p>

                <div className="product-actions">

                  {/* OWNER */}
                  {user?.id === item.user_id ? (
                    <>
                      <button>Edit</button>

                      {!item.is_sold && !item.is_traded && (
                        <>
                          <button onClick={() => markAsSold(item.id)}>
                            Mark as Sold
                          </button>

                          <button onClick={() => markAsTraded(item.id)}>
                            Mark Trade Complete
                          </button>
                        </>
                      )}

                      <button onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      {!item.is_sold && !item.is_traded && (
                        <>
                          <button onClick={() => goChat(item.user_id)}>
                            Message
                          </button>

                          <button onClick={() => handleTrade(item)}>
                            Trade
                          </button>
                        </>
                      )}
                    </>
                  )}

                </div>

              </div>
            ))}

          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;