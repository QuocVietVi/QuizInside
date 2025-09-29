import React, { useState } from "react";
import "./Home.css";
import Button from "@mui/material/Button";
import HomeContent from "../homeContent/HomeContent";
import { joinRoom } from "../../services/gameService";
import { useNavigate } from "react-router-dom";

function Home() {
  const BASE_URL = import.meta.env.BASE_URL;
  const [pin, setPin] = useState("");
  // Generate unique token for each session
  const token = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const navigate = useNavigate();

  const handlePinChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    value = value.substring(0, 6);
    if (value.length > 3) {
      value = value.substring(0, 3) + " " + value.substring(3);
    }
    setPin(value);
  };

  const handleJoinGame = async () => {
    const roomID = pin.replace(/\s/g, "");

    // Validation
    if (!roomID) {
      alert("Vui lòng nhập mã PIN để tham gia game");
      return;
    }

    if (roomID.length !== 6) {
      alert("Mã PIN phải có đầy đủ 6 chữ số");
      return;
    }

    if (!/^\d+$/.test(roomID)) {
      alert("Mã PIN chỉ được chứa các chữ số");
      return;
    }

    try {
      console.log("Joining room with unique token:", token);
      // Navigate to gameplay page with unique token
      navigate("/gameplay", {
        state: {
          roomID: roomID,
          isHost: false,
          category: "Quiz", // sẽ được update từ server
          token: token // Pass unique token
        }
      });
    } catch (err) {
      console.error("Navigation error:", err);
      alert("Lỗi join room: " + err.message);
    }
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
            <Button
              variant="contained"
              onClick={handleJoinGame}
              sx={{
                ml: 1,
                borderRadius: "20px",
                fontWeight: 600,
                backgroundColor: "#91d9bf",
                color: "black",
                "&:hover": { backgroundColor: "#81c8af" },
              }}
            >
              Join
            </Button>
          </div>

          {/* Right side */}
          <div className="navbar-right">
            <div className="navbar-search">
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
                "&:hover": { backgroundColor: "#81c8af" },
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
          <span className="join-text">Enter PIN:</span>
          <input
            type="text"
            placeholder="123 456"
            className="join-input"
            value={pin}
            onChange={handlePinChange}
          />
          <Button
            variant="contained"
            onClick={handleJoinGame}
            sx={{
              mt: 1,
              borderRadius: "20px",
              fontWeight: 600,
              backgroundColor: "#91d9bf",
              color: "black",
              "&:hover": { backgroundColor: "#81c8af" },
              "@media (max-width: 648px)": {
                position: "absolute",
                right: 15,
                textTransform: "none",
              },
            }}
          >
            Join
          </Button>
        </div>
      </div>

      <div>
        <HomeContent />
      </div>
    </div>
  );
}

export default Home;
