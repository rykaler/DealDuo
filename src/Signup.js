// Signup.js

import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Signup.css";

const Signup = ({ goBack }) => {

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const handleSignup = async () => {

    if (!fullName || !email || !password) {

      alert("Please fill all fields");

      return;
    }

    const { data, error } =
      await supabase.auth.signUp({

        email,
        password,

        options: {
          data: {
            name: fullName,
          },
        },
      });

    if (error) {

      alert(error.message);

      return;
    }

    if (!data?.user) {

      alert(
        "Check your email to confirm account."
      );

      return;
    }

    alert("Signup successful!");

    goBack();
  };

  return (
    <div className="signup-page">

      <div className="signup-card">

        <button
          className="signup-back-btn"
          onClick={goBack}
        >
          ← Back
        </button>

        <h2>JOIN THE HUB</h2>

        <p className="subtitle">
          Create your marketplace account
        </p>

        <label>Full Name</label>

        <input
          type="text"
          placeholder="Juan Dela Cruz"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
        />

        <label>Email</label>

        <input
          type="email"
          placeholder="student@gmail.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <label>Password</label>

        <div className="password-container">

          <input
            type={showPassword ? "text" : "password"}
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
              setShowPassword(!showPassword)
            }
          >
            {showPassword ? "Hide" : "Show"}
          </button>

        </div>

        <button
          className="signup-btn"
          onClick={handleSignup}
        >
          CREATE ACCOUNT
        </button>

      </div>

    </div>
  );
};

export default Signup;