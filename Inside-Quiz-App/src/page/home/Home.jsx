import React, { useState } from "react";
import "./Home.css";
import Button from "@mui/material/Button";
import HomeContent from "../homeContent/HomeContent";

function Home() {
  const BASE_URL = import.meta.env.BASE_URL; // BASE_URL để deploy GitHub Pages
  const [pin, setPin] = useState("");

  // input pin
  const handlePinChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    value = value.substring(0, 6);
    if (value.length > 3) {
      value = value.substring(0, 3) + " " + value.substring(3);
    }
    setPin(value);
  };

  const categories = [
    { label: "Home", icon: "icon/iconHome.png" },
    { label: "Appota Learn", icon: "icon/iconAppota.png" },
    { label: "Sports", icon: "icon/iconSport.png" },
    { label: "Movies", icon: "icon/iconMovie.png" },
    { label: "Games", icon: "icon/iconGame.png" },
    { label: "Geography", icon: "icon/iconGeography.png" },
    { label: "History", icon: "icon/iconHistory.png" },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="home">
      <div className="navbar-container">
        {/* Navbar chính */}
        <div className="navbar">
          {/* Logo */}
          <div className="navbar-logo">
            <img src={`${BASE_URL}logo/logo.png`} alt="Logo" />
          </div>

          {/* Join Game box */}
          <div className="navbar-join">
            <span className="join-text">Join Game? Enter PIN:</span>
            <input
              type="text"
              placeholder="123 456"
              className="join-input"
              value={pin}
              onChange={handlePinChange}
            />
          </div>

          {/* Right side: search + login */}
          <div className="navbar-right">
            <div className="navbar-search">
              <img src={`${BASE_URL}image/searchIcon.png`} alt="Search" />
            </div>
            <Button
              variant="contained"
              sx={{
                borderRadius: "20px",
                padding: "8px 24px",
                fontWeight: 700,
                fontSize: "14px",
                width: "120px",
                textTransform: "none",
                color: "black",
                backgroundColor: "#91d9bf",
                "&:hover": {
                  backgroundColor: "#81c8af",
                },
                "&.Mui-focusVisible": {
                  outline: "none",
                },
                "&:focus": {
                  outline: "none",
                },
              }}
            >
              Sign in
            </Button>
          </div>
        </div>

        {/* Navbar phụ */}
        <div className="sub-navbar">
          {categories.map((cat, index) => (
            <div
              key={index}
              className={`category ${activeIndex === index ? "active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              <img src={`${BASE_URL}${cat.icon}`} alt={cat.label} />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="navbar-join-mobile">
          <span className="join-text">Join Game? Enter PIN:</span>
          <input
            type="text"
            placeholder="123 456"
            className="join-input"
            value={pin}
            onChange={handlePinChange}
          />
        </div>
      </div>

      <div>
        <HomeContent />
      </div>
    </div>
  );
}

export default Home;
