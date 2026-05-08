// Login.js

import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";

const Login = ({ goBack, onSuccess }) => {

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    if (loading) return;

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {

      alert(error.message);

      setLoading(false);

      return;
    }

    const {
      data: userData,
      error: userError,
    } = await supabase
      .from("users")
      .select("is_suspended, role")
      .eq("id", data.user.id)
      .single();

    if (userError) {

      alert("Error fetching user data");

      await supabase.auth.signOut();

      setLoading(false);

      return;
    }

    if (userData?.is_suspended) {

      alert("🚫 Your account is suspended.");

      await supabase.auth.signOut();

      setEmail("");
      setPassword("");

      setLoading(false);

      return;
    }

    setLoading(false);

    onSuccess(
      userData?.role === "admin"
        ? "admin"
        : "user"
    );
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* BACK BUTTON */}
        <button
          type="button"
          className="login-back-btn"
          onClick={goBack}
        >
          ← Back
        </button>

        {/* TITLE */}
        <h2>WELCOME BACK</h2>

        <p className="subtitle">
          Login to continue buying & selling
        </p>

        {/* EMAIL */}
        <label>Email</label>

        <input
          type="email"
          placeholder="student@university.edu"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        {/* PASSWORD */}
        <label>Password</label>

        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        {/* LOGIN BUTTON */}
        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "SIGN IN"}
        </button>

      </div>

    </div>
  );
};

export default Login;