// Gameplay.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./Gameplay.css";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import QuizIcon from "@mui/icons-material/Quiz";
import Button from "@mui/material/Button";
import RoomCreate from "../roomCreate/RoomCreate";
import QuizItemGameplay from "../../component/quizItemGamePlay/QuizItemGameplay";
import LeaderBoardGamePlay from "../../component/leaderBoardGamePlay/LeaderBoardGamePlay";
import {
  createRoom,
  startGame,
  joinRoom,
  sendAnswer,
  leaveRoom,
  getConnectionStatus,
  checkSession,
  initiateLogin,
} from "../../services/gameService";

export default function Gameplay() {
  const location = useLocation();
  const category = location.state?.category || "Công nghệ";
  const isHost = location.state?.isHost !== false;
  const joinedRoomID = location.state?.roomID;
  
  // Enhanced token retrieval with comprehensive debugging
  let userToken = location.state?.token;
  
  console.log('=== Gameplay Token Debug ===');
  console.log('Token from navigation state:', userToken);
  
  // If no token from navigation state, try other sources
  if (!userToken) {
    console.log('No token from navigation, trying storage...');
    
    userToken = localStorage.getItem('userToken') || 
               sessionStorage.getItem('userToken');
    
    console.log('Token from storage:', userToken);
    
    if (!userToken) {
      // Try cookies
      const cookies = document.cookie.split('; ');
      console.log('Checking cookies:', cookies);
      
      const possibleCookieNames = ['token', 'access_token', 'auth_token', 'jwt'];
      for (const cookieName of possibleCookieNames) {
        const cookieToken = cookies.find(row => row.startsWith(`${cookieName}=`))?.split('=')[1];
        if (cookieToken) {
          userToken = cookieToken;
          console.log(`Found token in cookie '${cookieName}':`, cookieToken);
          break;
        }
      }
    }
  }
  
  // Final fallback - generate token (should rarely be used)
  if (!userToken) {
    userToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.warn('No OAuth token found anywhere, using fallback token:', userToken);
  }

  console.log('Final token for gameplay:', userToken);
  console.log('===========================');

  const [roomID, setRoomID] = useState(joinedRoomID || null);
  const [players, setPlayers] = useState([]);
  const [screen, setScreen] = useState("room");
  const [question, setQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [userLoginStatus, setUserLoginStatus] = useState(null);

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [correctId, setCorrectId] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);

  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const hasInitialized = useRef(false);
  const isComponentMounted = useRef(true);

  // --- WebSocket callback với error handling
  const handleMessage = (msg) => {
    console.log("Received message:", msg);
    setConnectionStatus("connected");

    switch (msg.type) {
      case "room_created":
        setRoomID(msg.payload.room_id);
        setPlayers(
          msg.payload.players?.map((p, i) => ({
            ...p,
            avatar: `https://i.pravatar.cc/50?img=${i + 1}`,
          })) || []
        );
        if (msg.payload.current_user_id) {
          setCurrentUserId(msg.payload.current_user_id);
        }
        break;

      case "room_joined":
        setRoomID(msg.payload.room_id);
        setPlayers(
          msg.payload.players?.map((p, i) => ({
            ...p,
            avatar: `https://i.pravatar.cc/50?img=${i + 1}`,
          })) || []
        );
        if (msg.payload.current_user_id) {
          setCurrentUserId(msg.payload.current_user_id);
        }
        break;

      case "update_players":
        setPlayers(
          msg.payload.players?.map((p, i) => ({
            ...p,
            // Use modulo to cycle through available avatars for unlimited players
            avatar: `https://i.pravatar.cc/50?img=${(i % 70) + 1}`,
          })) || []
        );
        if (msg.payload.current_user_id) {
          setCurrentUserId(msg.payload.current_user_id);
        }
        console.log(`Updated players count: ${msg.payload.players?.length || 0}`);
        break;

      case "question":
        setQuestion(msg.payload.question);
        setScreen("quiz");
        setCorrectId(null);
        setAnswerFeedback(null);
        setCurrentQuestionNumber(prev => prev + 1);
        break;

      case "answer_feedback":
        setAnswerFeedback(msg.payload.correct);
        break;

      case "results":
        // Ensure we show top 10 players in leaderboard
        const topPlayers = msg.payload.leaderboard?.slice(0, 10) || [];
        setLeaderboard(calculateScores(topPlayers));
        setCorrectId(msg.payload.correct_id);
        setTimeout(() => {
          setScreen("leaderboard");
          setCorrectId(null);
          setAnswerFeedback(null);
        }, 3000);
        break;

      case "game_over":
        // Ensure we show top 10 players in final leaderboard
        const finalTopPlayers = msg.payload.leaderboard?.slice(0, 10) || [];
        setLeaderboard(calculateScores(finalTopPlayers));
        setCorrectId(msg.payload.correct_id);
        setScreen("leaderboard");
        break;

      case "error":
        console.error("Server error:", msg.message);
        setConnectionStatus("error");
        alert("Lỗi từ server: " + msg.message);
        break;

      default:
        console.log("Tin nhắn không xác định:", msg);
    }
  };

  // Error handler for WebSocket
  const handleWebSocketError = (error) => {
    console.error("WebSocket error:", error);

    if (!isComponentMounted.current) return;

    setConnectionStatus("error");

    // Handle specific error cases
    if (error.message.includes("đã tham gia phòng") || error.message.includes("already in room")) {
      alert(error.message + "\n\nBạn có muốn tải lại trang để thử lại?");
      return;
    }

    if (error.message.includes("không tồn tại") || error.message.includes("not found")) {
      alert("Phòng không tồn tại. Vui lòng kiểm tra lại mã PIN.");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }

    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      console.log(`Retrying connection... Attempt ${retryCountRef.current}/${maxRetries}`);

      setTimeout(() => {
        if (isComponentMounted.current) {
          setConnectionStatus("reconnecting");
          initializeRoom();
        }
      }, 2000 * retryCountRef.current);
    } else {
      console.error("Max retries exceeded");
    }
  };

  // Initialize room connection
  const initializeRoom = async () => {
    // Prevent duplicate initialization
    if (hasInitialized.current) {
      console.log("Already initialized, skipping...");
      return;
    }

    // Check login status first
    const loginResult = await checkSession();
    console.log('Login check result in gameplay:', loginResult);
    setUserLoginStatus(loginResult);
    
    if (!loginResult.success) {
      console.error("User not logged in");
      setConnectionStatus("error");
      alert("Vui lòng đăng nhập để tham gia game. Bạn sẽ được chuyển đến trang đăng nhập.");
      setTimeout(async () => {
        try {
          await initiateLogin();
        } catch (error) {
          console.error('Login initiation failed:', error);
        }
      }, 1000);
      return;
    }

    // Try to get fresh token from login result if current token is fallback
    if (userToken.startsWith('fallback_') && loginResult.success) {
      const freshToken = loginResult.token || 
                        loginResult.user?.token || 
                        loginResult.access_token;
      
      if (freshToken) {
        console.log('Replacing fallback token with fresh token:', freshToken);
        userToken = freshToken;
        localStorage.setItem('userToken', freshToken);
        sessionStorage.setItem('userToken', freshToken);
      }
    }

    // Enhanced token validation
    console.log('Using token for room operations:', userToken);
    if (!userToken || userToken === 'undefined' || userToken === 'null') {
      console.error("No valid token available for room operations");
      setConnectionStatus("error");
      alert("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      setTimeout(async () => {
        try {
          await initiateLogin();
        } catch (error) {
          console.error('Login initiation failed:', error);
        }
      }, 1000);
      return;
    }

    if (userToken.startsWith('fallback_')) {
      console.warn("Still using fallback token - this may cause authentication issues");
      // Don't block the request, let the server handle the invalid token
    }

    hasInitialized.current = true;
    
    // Reset question number when starting new game
    setCurrentQuestionNumber(0);

    try {
      setConnectionStatus("connecting");

      if (joinedRoomID) {
        console.log("Joining room:", joinedRoomID, "with token:", userToken);
        const res = await joinRoom(joinedRoomID, userToken, handleMessage, handleWebSocketError);
        console.log("Join room response:", res);
      } else {
        console.log("Creating new room with category:", category, "with token:", userToken);
        const res = await createRoom(userToken, category, handleMessage, handleWebSocketError);
        console.log("Create room response:", res);
        if (res.room_id) {
          setRoomID(res.room_id);
        }
      }

      // Reset retry count on successful connection
      retryCountRef.current = 0;

    } catch (err) {
      console.error("Lỗi tạo/join room:", err);
      hasInitialized.current = false; // Allow retry

      if (!isComponentMounted.current) return;

      setConnectionStatus("error");

      // Handle specific errors with user-friendly messages
      if (err.message.includes("đăng nhập")) {
        alert(err.message);
        setTimeout(async () => {
          try {
            await initiateLogin();
          } catch (error) {
            console.error('Login initiation failed:', error);
          }
        }, 1000);
      } else if (err.message.includes("đã tham gia phòng") || err.message.includes("already in room")) {
        alert(err.message);
      } else if (err.message.includes("không tồn tại") || err.message.includes("not found")) {
        alert("Phòng không tồn tại hoặc đã đóng. Vui lòng kiểm tra lại mã PIN.");
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else if (err.message.includes("WebSocket") || err.message.includes("Connection") || err.message.includes("timeout")) {
        handleWebSocketError(err);
      } else {
        alert("Không thể kết nối phòng: " + err.message);
      }
    }
  };

  // Manual retry function
  const handleRetry = () => {
    hasInitialized.current = false;
    retryCountRef.current = 0;
    setConnectionStatus("connecting");
    initializeRoom();
  };

  // --- Tạo room hoặc join room khi Gameplay mount
  useEffect(() => {
    isComponentMounted.current = true;

    // Only initialize if not already done
    if (!hasInitialized.current) {
      initializeRoom();
    }

    // Cleanup function
    return () => {
      isComponentMounted.current = false;
      retryCountRef.current = maxRetries; // Stop retries when component unmounts
      leaveRoom(); // Clean disconnect
    };
  }, []); // Remove dependencies to prevent re-runs

  // --- Ngăn reload bằng F5 / Ctrl+R
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        alert("Reload trang sẽ ngắt kết nối game. Vui lòng sử dụng nút Back của trình duyệt.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStartGame = async () => {
    if (!roomID) {
      alert("Chưa có Room ID");
      return;
    }

    if (connectionStatus !== "connected") {
      alert("Chưa kết nối được WebSocket. Vui lòng đợi hoặc thử lại.");
      return;
    }

    try {
      console.log("Starting game for room:", roomID);
      await startGame(roomID, userToken);
    } catch (err) {
      console.error("Không thể start game:", err);
      alert("Lỗi start game: " + err.message);
    }
  };

  const handleAnswer = (answer) => {
    try {
      const currentStatus = getConnectionStatus();
      if (currentStatus !== "connected") {
        alert("Kết nối không ổn định. Không thể gửi câu trả lời.");
        return;
      }

      if (question?.type === "fill_in_the_blank") {
        sendAnswer({ answer_text: answer });
      } else {
        sendAnswer({ answer_id: answer });
      }
    } catch (err) {
      console.error("Lỗi gửi answer:", err);
      alert("Lỗi gửi câu trả lời: " + err.message);
    }
  };

  // Connection status indicator
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return retryCountRef.current > 0
          ? `Đang kết nối... (Lần thử ${retryCountRef.current}/${maxRetries})`
          : "Đang kết nối...";
      case "connected":
        return "";
      case "reconnecting":
        return `Đang kết nối lại... (Lần thử ${retryCountRef.current}/${maxRetries})`;
      case "error":
        return "Lỗi kết nối";
      default:
        return "";
    }
  };

  return (
    <div className="gameplay">
      <header className="header">
        <div className="header-left">
          <img
            src={`${import.meta.env.BASE_URL}logo/logo.png`}
            alt="Logo"
            className="logo"
          />
          <span className="room-code">PIN: {roomID || "..."}</span>
          <img
            className="userIcon"
            src={`${import.meta.env.BASE_URL}icon/userIcon.png`}
            alt=""
          />
          <span className="player-count">{players.length}</span>
        </div>

        <div className="header-right">
          {screen === "quiz" && (
            <div style={{
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{ 
                fontWeight: "bold",
                color: "rgb(253, 238, 224)",
                webkitTextStroke: "1px rgb(253, 238, 224)",
                fontSize: "16px", 
                marginRight: "8px" 
              }}>
                {currentQuestionNumber}/10
              </span>
              {currentQuestionNumber === 10 && (
                <span style={{
                  backgroundColor: "#ff6b35",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  marginRight: "8px",
                  animation: "pulse 1s infinite"
                }}>
                  x2 ĐIỂM
                </span>
              )}
              <div style={{
                backgroundColor: currentQuestionNumber === 10 ? "#ff6b35" : "black",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: currentQuestionNumber === 10 ? "0 0 10px #ff6b35" : "none"
              }}>
                <QuizIcon style={{ color: "white", fontSize: "18px" }} />
              </div>
            </div>
          )}
          <button onClick={toggleFullscreen} className="zoom-btn">
            {isFullscreen ? <ZoomInMapIcon /> : <ZoomOutMapIcon />}
          </button>
          {connectionStatus !== "connected" && (
            <span style={{ marginLeft: "10px", color: "orange", fontSize: "12px" }}>
              {getConnectionStatusText()}
            </span>
          )}
        </div>
      </header>

      {connectionStatus === "connecting" && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          color: "white",
          fontSize: "18px"
        }}>
          Đang kiểm tra đăng nhập và kết nối tới server...
        </div>
      )}

      {connectionStatus === "error" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          color: "red",
          fontSize: "16px",
          textAlign: "center"
        }}>
          <p>Không thể kết nối tới server</p>
          <p style={{ fontSize: "14px", color: "#ccc", marginBottom: "20px" }}>
            {retryCountRef.current >= maxRetries
              ? "Đã thử kết nối nhiều lần nhưng không thành công. Server có thể đang bảo trì."
              : "Có lỗi xảy ra khi kết nối. Vui lòng thử lại."
            }
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="contained"
              onClick={handleRetry}
              sx={{ backgroundColor: "#91d9bf", color: "black" }}
            >
              Thử lại
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.href = "/"}
              sx={{ color: "white", borderColor: "white" }}
            >
              Về trang chủ
            </Button>
          </div>
        </div>
      )}

      {connectionStatus === "connected" && screen === "room" && (
        <RoomCreate
          roomCode={roomID}
          players={players}
          onStart={handleStartGame}
          category={category}
          isHost={isHost}
          currentUserId={currentUserId}
        />
      )}

      {connectionStatus === "connected" && screen === "quiz" && question && (
        <QuizItemGameplay
          question={question.text}
          answers={question.options}
          image={question.image}
          correctIndex={correctId}
          answerFeedback={answerFeedback}
          onSelectAnswer={handleAnswer}
          type={question.type}
        />
      )}

      {connectionStatus === "connected" && screen === "leaderboard" && (
        <LeaderBoardGamePlay leaderboard={leaderboard} />
      )}
    </div>
  );
}

function calculateScore(timeLeft) {
  const base = 1000;
  const multiplier = 50;
  return base + timeLeft * multiplier;
}

function calculateScores(players) {
  // Sort and return top 10 players
  return [...players].sort((a, b) => b.score - a.score).slice(0, 10);
}

