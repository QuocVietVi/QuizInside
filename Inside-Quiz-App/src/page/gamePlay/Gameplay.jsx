// Gameplay.jsx
import { useState, useEffect } from "react";
import "./Gameplay.css";
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import Button from "@mui/material/Button";
import RoomCreate from "../roomCreate/RoomCreate";
import QuizItemGameplay from "../../component/quizItemGamePlay/QuizItemGameplay";
import LeaderBoardGamePlay from "../../component/leaderBoardGamePlay/LeaderBoardGamePlay";
import {
  createRoom,
  startGame,
  connectToRoom,
  sendAnswer,
} from "../../services/gameService";

export default function Gameplay({ token = "aaa", category = "Công nghệ" }) {
  const [roomID, setRoomID] = useState(null);
  const [players, setPlayers] = useState([]);
  const [screen, setScreen] = useState("room"); // room | quiz | leaderboard
  const [question, setQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- WebSocket callback
  const handleMessage = (msg) => {
    switch (msg.type) {
      case "update_players":
        setPlayers(
          msg.payload.players.map((p, i) => ({
            ...p,
            avatar: `https://i.pravatar.cc/50?img=${i + 1}`,
          }))
        );
        break;

      case "question":
        setQuestion(msg.payload.question);
        setScreen("quiz");
        break;

      case "results":
      case "game_over":
        setLeaderboard(calculateScores(msg.payload.leaderboard));
        setScreen("leaderboard");
        break;

      default:
        console.log("Tin nhắn không xác định:", msg);
    }
  };

  // --- Tạo room khi Gameplay mount
  useEffect(() => {
    (async () => {
      try {
        const res = await createRoom(token, category, handleMessage);
        setRoomID(res.room_id);
      } catch (err) {
        console.error("Không tạo được phòng:", err);
      }
    })();
  }, [category]);

  // --- Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStartGame = async () => {
    if (!roomID) return;
    try {
      await startGame(roomID, token);
    } catch (err) {
      console.error("Không thể start game:", err);
    }
  };

  const handleAnswer = (answer, timeLeft) => {
    const score = calculateScore(timeLeft);
    sendAnswer({ ...answer, score });
  };

  return (
    <div className="gameplay">
      {/* === HEADER GIỮ NGUYÊN === */}
      <header className="header">
        <div className="header-left">
          <img src={`${import.meta.env.BASE_URL}logo/logo.png`} alt="Logo" className="logo" />
          <span className="room-code">PIN: {roomID || "..."}</span>
          <img className="userIcon" src={`${import.meta.env.BASE_URL}icon/userIcon.png`} alt="" />
          <span className="player-count">{players.length}</span>
        </div>

        <div className="header-right">
          <button onClick={toggleFullscreen} className="zoom-btn">
            {isFullscreen ? <ZoomInMapIcon /> : <ZoomOutMapIcon />}
          </button>
          {/* <Button
            variant="contained"
            color="error"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Clear Storage
          </Button> */}
          <span>{category}</span>

        </div>
      </header>

      {/* === BODY GAME === */}
      {screen === "room" && (
        <RoomCreate roomID={roomID} players={players} onStart={handleStartGame} />
      )}
      {screen === "quiz" && question && (
        <QuizItemGameplay
          question={question.text}
          answers={question.options}
          image={question.image}
          correctIndex={question.correct_id}
          onSelectAnswer={handleAnswer}
        />
      )}
      {screen === "leaderboard" && <LeaderBoardGamePlay leaderboard={leaderboard} />}
    </div>
  );
}

// --- tính điểm dựa trên thời gian
function calculateScore(timeLeft) {
  const base = 1000;
  const multiplier = 50;
  return base + timeLeft * multiplier;
}

// --- sắp xếp leaderboard
function calculateScores(players) {
  return [...players].sort((a, b) => b.score - a.score);
}
