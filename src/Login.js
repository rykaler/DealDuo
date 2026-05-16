// Login.js

import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css";

const Login = ({ goBack, onSuccess }) => {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

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

      alert("Your account is suspended.");

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

  const handleForgotPassword =
    async () => {

      if (!email) {

        alert(
          "Please enter your email first."
        );

        return;
      }

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
          "https://deal-duo.vercel.app/reset-password",
          }
        );

      if (error) {

        alert(error.message);

        return;
      }

      alert(
        "Password reset link sent to your email."
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
          placeholder="student@gmail.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        {/* PASSWORD */}
        <label>Password</label>

        <div className="password-container">

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="••••••••"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            type="button"
            className="show-btn"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
          >
            {showPassword
              ? "Hide"
              : "Show"}
          </button>

        </div>

        {/* FORGOT PASSWORD */}
        <button
  type="button"
  className="forgot-password"
  onClick={handleForgotPassword}
>
  Forgot Password?
</button>

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