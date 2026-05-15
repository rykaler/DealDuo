// =========================
// App.js
// =========================

import React, {
  useState,
  useEffect
} from "react";

import { supabase }
from "./supabaseClient";

import LandingPage from "./LandingPage";
import Signup from "./Signup";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AddListing from "./AddListing";
import Chat from "./Chat";
import Messages from "./Messages";
import AdminDashboard from "./AdminDashboard";
import TradeRequests from "./TradeRequest";
import Profile from "./Profile";
import SellerProfile from "./SellerProfile";

function App() {

  const [page, setPage] =
    useState("landing");

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [selectedSeller, setSelectedSeller] =
    useState(null);

  const [role, setRole] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {

    try {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {

        setPage("landing");

        setLoading(false);

        return;
      }

      const { data, error } =
        await supabase
          .from("users")
          .select(
            "role, is_suspended"
          )
          .eq("id", user.id)
          .single();

      if (error || !data) {

        await supabase.auth.signOut();

        setPage("landing");

        setLoading(false);

        return;
      }

      if (data.is_suspended) {

        alert(
          "🚫 Your account is suspended."
        );

        await supabase.auth.signOut();

        setPage("landing");

        setLoading(false);

        return;
      }

      setRole(data.role);

      setPage(
        data.role === "admin"
          ? "admin"
          : "dashboard"
      );

      setLoading(false);

    } catch (err) {

      console.log(err);

      setPage("landing");

      setLoading(false);
    }
  };

  // OPEN CHAT
  const openChat = (userId) => {

    setSelectedUser(userId);

    setPage("chat");
  };

  // OPEN SELLER PROFILE
  const openSellerProfile =
    (sellerId) => {

    setSelectedSeller(sellerId);

    setPage("sellerProfile");
  };

  // OPEN TRADES
  const openTrades = () => {

    setPage("trades");
  };

  if (loading) {

    return (
      <div
        style={{
          color: "white",
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>

      {/* LANDING */}
      {page === "landing" && (
        <LandingPage
          goLogin={() =>
            setPage("login")
          }
          goSignup={() =>
            setPage("signup")
          }
        />
      )}

      {/* LOGIN */}
      {page === "login" && (
        <Login
          goBack={() =>
            setPage("landing")
          }

          onSuccess={(userRole) => {

            setRole(userRole);

            setPage(
              userRole === "admin"
                ? "admin"
                : "dashboard"
            );
          }}
        />
      )}

      {/* SIGNUP */}
      {page === "signup" && (
        <Signup
          goBack={() =>
            setPage("landing")
          }

          onSuccess={(userRole) => {

            setRole(userRole);

            setPage(
              userRole === "admin"
                ? "admin"
                : "dashboard"
            );
          }}
        />
      )}

      {/* DASHBOARD */}
      {page === "dashboard" &&
        role !== "admin" && (
          <Dashboard

            goAddListing={() =>
              setPage("addListing")
            }

            goChat={openChat}

            goMessages={() =>
              setPage("messages")
            }

            goTrades={openTrades}

            goProfile={() =>
              setPage("profile")
            }

            goSellerProfile={
              openSellerProfile
            }
          />
        )}

      {/* PROFILE */}
      {page === "profile" && (
        <Profile
          goBack={() =>
            setPage("dashboard")
          }
        />
      )}

      {/* SELLER PROFILE */}
      {page ===
        "sellerProfile" &&
        selectedSeller && (
          <SellerProfile

            sellerId={
              selectedSeller
            }

            goBack={() =>
              setPage("dashboard")
            }
          />
        )}

      {/* ADMIN */}
      {page === "admin" &&
        role === "admin" && (
          <AdminDashboard
            goBack={async () => {

              await supabase.auth.signOut();

              setPage("landing");
            }}
          />
        )}

      {/* ADD LISTING */}
      {page === "addListing" && (
        <AddListing
          goBack={() =>
            setPage("dashboard")
          }
        />
      )}

      {/* CHAT */}
      {page === "chat" &&
        selectedUser && (
          <Chat
            receiverId={selectedUser}

            goBack={() =>
              setPage("dashboard")
            }
          />
        )}

      {/* MESSAGES */}
      {page === "messages" && (
        <Messages
          goBack={() =>
            setPage("dashboard")
          }

          openChat={openChat}
        />
      )}

      {/* TRADES */}
      {page === "trades" && (
        <TradeRequests
          goBack={() =>
            setPage("dashboard")
          }

          goChat={openChat}
        />
      )}

    </>
  );
}

export default App;