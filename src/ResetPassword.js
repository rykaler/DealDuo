import React, {
  useState
} from "react";

import { supabase }
from "./supabaseClient";

import "./Login.css";

const ResetPassword = () => {

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const updatePassword =
    async () => {

      if (!password) {

        return alert(
          "Enter new password"
        );
      }

      setLoading(true);

      const { error } =
        await supabase.auth
          .updateUser({
            password
          });

      if (error) {

        alert(error.message);

        setLoading(false);

        return;
      }

      alert(
        "Password updated successfully!"
      );

      window.location.href = "/";

      setLoading(false);
    };

  return (

    <div className="login-page">

      <div className="login-card">

        <h2>
          RESET PASSWORD
        </h2>

        <p className="subtitle">
          Enter your new password
        </p>

        <label>
          New Password
        </label>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          className="login-btn"
          onClick={updatePassword}
          disabled={loading}
        >

          {loading
            ? "Updating..."
            : "UPDATE PASSWORD"}

        </button>

      </div>

    </div>
  );
};

export default ResetPassword;