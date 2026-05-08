// LandingPage.js

import React from "react";
import "./LandingPage.css";

const LandingPage = ({
  goLogin,
  goSignup
}) => {

  return (
    <div className="landing-page">

      <div className="hero-card">

        {/* LOGO */}
        <h1 className="logo-landing">
          DEAL<span>DUO</span>
        </h1>

        {/* TAGLINE */}
        <p className="tagline">
          FIND A DEAL, MAKE IT REAL
        </p>

        {/* BUTTONS */}
        <div className="buttons">

          <button
            className="landing-login-btn"
            onClick={goLogin}
          >
            LOGIN
          </button>

          <button
            className="landing-signup-btn"
            onClick={goSignup}
          >
            SIGN UP
          </button>

        </div>

      </div>

    </div>
  );
};

export default LandingPage;