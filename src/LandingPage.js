import React from "react";
import "./LandingPage.css";

const LandingPage = ({ goLogin, goSignup }) => {
  return (
    <div className="landing-page">

      <div className="hero-card">

        <h1 className="logo">
          DEAL<span>DUO</span>
        </h1>

        <p className="tagline">
          FIND A DEAL, MAKE IT REAL
        </p>

        <div className="buttons">
          <button className="landing-login-btn" onClick={goLogin}>
            LOGIN
          </button>

          <button className="landing-signup-btn" onClick={goSignup}>
            SIGN UP
          </button>
        </div>

      </div>

    </div>
  );
};

export default LandingPage;