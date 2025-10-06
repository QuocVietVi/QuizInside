// Gameplay.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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
  loadPlayerStats,
} from "../../services/gameService";
import { setLoading } from "../../services/loadingService";

export default function Gameplay() {
  const location = useLocation();
  const category = location.state?.category || "Công nghệ";
  const isHost = location.state?.isHost !== false;
  const joinedRoomID = location.state?.roomID;
  const navigate = useNavigate();
  // Enhanced token retrieval with comprehensive debugging
  let userToken = location.state?.token;

  console.log('=== Gameplay Token Debug ===');
  //console.log('Token from navigation state:', userToken);

  // If no token from navigation state, try other sources
  if (!userToken) {
    //console.log('No token from navigation, trying storage...');

    userToken = localStorage.getItem('userToken') ||
      sessionStorage.getItem('userToken');

    //console.log('Token from storage:', userToken);

    if (!userToken) {
      // Try cookies
      const cookies = document.cookie.split('; ');
      //console.log('Checking cookies:', cookies);

      const possibleCookieNames = ['token', 'access_token', 'auth_token', 'jwt'];
      for (const cookieName of possibleCookieNames) {
        const cookieToken = cookies.find(row => row.startsWith(`${cookieName}=`))?.split('=')[1];
        if (cookieToken) {
          userToken = cookieToken;
          //console.log(`Found token in cookie '${cookieName}':`, cookieToken);
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

  // console.log('Final token for gameplay:', userToken);
  // console.log('===========================');

  const [roomID, setRoomID] = useState(joinedRoomID || null);
  const [players, setPlayers] = useState([]);
  const [screen, setScreen] = useState("room");
  const [question, setQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [previousLeaderboard, setPreviousLeaderboard] = useState([]);
  const [scoreAnimations, setScoreAnimations] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [userLoginStatus, setUserLoginStatus] = useState(null);
  const [hostId, setHostId] = useState(null); // Add state for host ID

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [correctId, setCorrectId] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [showX2Animation, setShowX2Animation] = useState(false);

  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const hasInitialized = useRef(false);
  const isComponentMounted = useRef(true);

  // New refs to hold leaderboard display and queue next question
  const leaderboardHoldRef = useRef(false);
  const pendingQuestionRef = useRef(null);
  const leaderboardTimeoutRef = useRef(null);

  // New refs for the initial delay before opening leaderboard
  const leaderboardInitialDelayRef = useRef(null);
  const leaderboardInitialDelayActiveRef = useRef(false);

  // Add a ref to hold the latest leaderboard to avoid stale closures inside handlers
  const leaderboardRef = useRef([]);

  // Keep the ref in sync whenever leaderboard state changes
  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

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
          })) || []
        );
        // Remove current_user_id handling from WebSocket - we get it from API
        if (msg.payload.host_id) {
          setHostId(msg.payload.host_id);
        }
        break;

      case "room_joined":
        setRoomID(msg.payload.room_id);
        setPlayers(
          msg.payload.players?.map((p, i) => ({
            ...p,
          })) || []
        );
        // Remove current_user_id handling from WebSocket - we get it from API
        if (msg.payload.host_id) {
          setHostId(msg.payload.host_id);
        }
        break;

      case "update_players":
        setPlayers(
          msg.payload.players?.map((p, i) => ({
            ...p,
            // Use modulo to cycle through available avatars for unlimited players
          })) || []
        );
        // Remove current_user_id handling from WebSocket - we get it from API
        if (msg.payload.host_id) {
          setHostId(msg.payload.host_id); // Store host ID from payload
        }
        console.log(`Updated players count: ${msg.payload.players?.length || 0}`);
        break;

      case "question":
        // If we are holding leaderboard visible or in the initial delay, queue the question
        if (leaderboardHoldRef.current || leaderboardInitialDelayActiveRef.current) {
          pendingQuestionRef.current = msg;
          console.log("Question queued until leaderboard hold ends");
          return;
        }
        // Otherwise process immediately
        setQuestion(msg.payload.question);
        setScreen("quiz");
        setCorrectId(null);
        setAnswerFeedback(null);
        setCurrentQuestionNumber(prev => {
          const newNumber = prev + 1;
          // Show x2 animation for question 10
          if (newNumber === 10) {
            setShowX2Animation(true);
            // Hide animation after 1.5 seconds
            setTimeout(() => {
              setShowX2Animation(false);
            }, 1500);
          }
          return newNumber;
        });
        break;

      case "answer_feedback":
        setAnswerFeedback(msg.payload.correct);
        break;

      case "results":
        console.log("Results payload:", msg.payload);
        
        // Use the up-to-date leaderboard from the ref, not a possibly stale state closure
        const previous = [...leaderboardRef.current];

        const newLeaderboard = calculateScores(msg.payload.leaderboard || []);
        
        console.log("Current leaderboard for comparison:", previous);
        console.log("New leaderboard:", newLeaderboard);
        const animations = calculateScoreAnimations(previous, newLeaderboard);
        
        setPreviousLeaderboard(previous);

        // Update state and the ref so subsequent messages see the new leaderboard
        setLeaderboard(newLeaderboard);
        leaderboardRef.current = newLeaderboard;

        setScoreAnimations(animations);
        setCorrectId(msg.payload.correct_id);

        // Enhanced timing for final question (question 10)
        const isFinalQuestion = currentQuestionNumber === 10;
        const initialDelay = isFinalQuestion ? 8000 : 1800; // Longer delay for final question to see correct answer
        const holdTime = isFinalQuestion ? 15000 : 4000; // Longer hold time for final leaderboard

        console.log(`Question ${currentQuestionNumber} - Using delays: initial=${initialDelay}ms, hold=${holdTime}ms`);

        // Clear any existing timeouts
        if (leaderboardTimeoutRef.current) {
          clearTimeout(leaderboardTimeoutRef.current);
          leaderboardTimeoutRef.current = null;
        }
        if (leaderboardInitialDelayRef.current) {
          clearTimeout(leaderboardInitialDelayRef.current);
          leaderboardInitialDelayRef.current = null;
        }

        // Start initial delay (during which incoming questions are queued)
        leaderboardInitialDelayActiveRef.current = true;
        leaderboardInitialDelayRef.current = setTimeout(() => {
          leaderboardInitialDelayActiveRef.current = false;

          // Show leaderboard after the delay
          setScreen("leaderboard");
          setCorrectId(null);
          setAnswerFeedback(null);

          // Activate hold period so leaderboard remains visible
          leaderboardHoldRef.current = true;
          leaderboardTimeoutRef.current = setTimeout(() => {
            leaderboardHoldRef.current = false;
            leaderboardTimeoutRef.current = null;
            // Clear score animations when leaderboard closes
            setScoreAnimations([]);
            // If a question arrived while leaderboard was held, process it now
            if (pendingQuestionRef.current) {
              const queuedMsg = pendingQuestionRef.current;
              pendingQuestionRef.current = null;
              // process queued question just like normal
              setQuestion(queuedMsg.payload.question);
              setScreen("quiz");
              setCorrectId(null);
              setAnswerFeedback(null);
              setCurrentQuestionNumber(prev => {
                const newNumber = prev + 1;
                if (newNumber === 10) {
                  setShowX2Animation(true);
                  setTimeout(() => setShowX2Animation(false), 1500);
                }
                return newNumber;
              });
            }
          }, holdTime);
        }, initialDelay);
        break;

      case "game_over":
        console.log("Game over payload:", msg.payload);
        
        // Calculate final leaderboard
        const finalLeaderboard = calculateScores(msg.payload.leaderboard || []);
        
        console.log("Current leaderboard for final comparison:", leaderboardRef.current);
        console.log("Final leaderboard:", finalLeaderboard);
        
        // Calculate final animations using the latest leaderboard from the ref
        const finalAnimations = calculateScoreAnimations(leaderboardRef.current, finalLeaderboard);
        
        setPreviousLeaderboard([...leaderboardRef.current]);
        setLeaderboard(finalLeaderboard);
        leaderboardRef.current = finalLeaderboard;
        setScoreAnimations(finalAnimations);
        setCorrectId(msg.payload.correct_id);
        
        // Add delay before showing final leaderboard to see the correct answer
        setTimeout(() => {
          setScreen("leaderboard");
        }, 3000); // 3 second delay to see final answer
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

  // Cleanup leaderboard timeout on unmount
  useEffect(() => {
    return () => {
      if (leaderboardTimeoutRef.current) {
        clearTimeout(leaderboardTimeoutRef.current);
        leaderboardTimeoutRef.current = null;
      }
      if (leaderboardInitialDelayRef.current) {
        clearTimeout(leaderboardInitialDelayRef.current);
        leaderboardInitialDelayRef.current = null;
        leaderboardInitialDelayActiveRef.current = false;
      }
    };
  }, []);

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
        navigate("/");

      }, 2000);
    }

    if (error.message.includes("đã bắt đầu") || error.message.includes("already started")) {
      alert("Phòng đã bắt đầu game. Không thể tham gia vào lúc này.");
      setTimeout(() => {
        navigate("/");
      }, 2000);
      return;
    }

    if (error.message.includes("đã kết thúc") || error.message.includes("finished")) {
      alert("Game đã kết thúc. Vui lòng tham gia phòng khác.");
      setTimeout(() => {
        navigate("/");
      }, 2000);
      return;
    }

    if (error.message.includes("đã đầy") || error.message.includes("full")) {
      alert("Phòng đã đầy. Vui lòng thử phòng khác.");
      setTimeout(() => {
        navigate("/");

      }, 2000);
      return;
    }

    // Handle message too big error specifically
    if (error.message.includes("quá nhiều người chơi") || error.message.includes("Message too big")) {
      alert("Phòng có quá nhiều người chơi và không thể tải được. Vui lòng thử:\n\n1. Tạo phòng mới\n2. Tham gia phòng khác có ít người hơn\n\nBạn sẽ được chuyển về trang chủ.");
      setTimeout(() => {
        navigate("/");
      }, 3000);
      return;
    }

    if (retryCountRef.current < maxRetries && !error.message.includes("quá nhiều người chơi")) {
      retryCountRef.current += 1;
      console.log(`Retrying connection... Attempt ${retryCountRef.current}/${maxRetries}`);

      setTimeout(() => {
        if (isComponentMounted.current) {
          setConnectionStatus("reconnecting");
          initializeRoom();
        }
      }, 2000 * retryCountRef.current);
    } else {
      console.error("Max retries exceeded or non-retryable error");
      
      // Show different message based on error type
      if (error.message.includes("quá nhiều người chơi")) {
        // Already handled above
        return;
      } else {
        alert("Không thể kết nối sau nhiều lần thử. Vui lòng kiểm tra kết nối mạng và thử lại.");
      }
    }
  };

  // Initialize room connection
  const initializeRoom = async () => {
    // Prevent duplicate initialization
    if (hasInitialized.current) {
      console.log("Already initialized, skipping...");
      return;
    }

    console.log("=== Starting Room Initialization ===");
    console.log("joinedRoomID:", joinedRoomID);
    console.log("isHost:", isHost);
    console.log("category:", category);

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

    // Fetch current user ID from player stats API
    try {
      const statsResult = await loadPlayerStats();
      console.log('Player stats result:', statsResult);
      if (statsResult.success && statsResult.stats) {
        const userId = statsResult.stats.user_id || statsResult.stats.id || statsResult.stats.player_id;
        if (userId) {
          setCurrentUserId(userId);
          console.log('Set current user ID from stats:', userId);
        } else {
          console.warn('No user ID found in stats response:', statsResult.stats);
        }
      } else {
        console.warn('Failed to load player stats:', statsResult.error);
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }

    // Try to get fresh token from login result if current token is fallback
    if (userToken.startsWith('fallback_') && loginResult.success) {
      const freshToken = loginResult.token ||
        loginResult.user?.token ||
        loginResult.access_token;

      if (freshToken) {
        console.log('Replacing fallback token with fresh token');
        userToken = freshToken;
        localStorage.setItem('userToken', freshToken);
        sessionStorage.setItem('userToken', freshToken);
      }
    }

    // Enhanced token validation
    console.log('Final token validation:');
    console.log('- Token exists:', !!userToken);
    console.log('- Token type:', typeof userToken);
    console.log('- Token length:', userToken?.length);
    console.log('- Is fallback:', userToken?.startsWith('fallback_'));
    
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
    }

    hasInitialized.current = true;

    // Reset question number when starting new game
    setCurrentQuestionNumber(0);
    // Reset score tracking for new game
    setPreviousLeaderboard([]);
    setScoreAnimations([]);

    try {
      setConnectionStatus("connecting");
      console.log("Setting connection status to connecting...");

      if (joinedRoomID) {
        console.log("=== JOINING EXISTING ROOM ===");
        console.log("Room ID:", joinedRoomID);
        const res = await joinRoom(joinedRoomID, userToken, handleMessage, handleWebSocketError);
        console.log("Join room response:", res);
      } else {
        console.log("=== CREATING NEW ROOM ===");
        console.log("Category:", category);
        const res = await createRoom(userToken, category, handleMessage, handleWebSocketError);
        console.log("Create room response:", res);
        if (res.room_id) {
          setRoomID(res.room_id);
          console.log("Room ID set to:", res.room_id);
        }
      }

      // Reset retry count on successful connection
      retryCountRef.current = 0;
      console.log("=== Room Initialization Complete ===");

    } catch (err) {
      console.error("=== Room Initialization Failed ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
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
      } else if (err.message.includes("Token không hợp lệ") || err.message.includes("Xác thực thất bại")) {
        alert(err.message + "\n\nBạn sẽ được chuyển đến trang đăng nhập.");
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
          navigate("/");
        }, 2000);
      } else if (err.message.includes("đã bắt đầu") || err.message.includes("already started")) {
        alert("Phòng đã bắt đầu game. Không thể tham gia vào lúc này.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else if (err.message.includes("đã kết thúc") || err.message.includes("finished")) {
        alert("Game đã kết thúc. Vui lòng tham gia phòng khác.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else if (err.message.includes("đã đầy") || err.message.includes("full")) {
        alert("Phòng đã đầy. Vui lòng thử phòng khác.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else if (err.message.includes("WebSocket") || err.message.includes("Connection") || err.message.includes("timeout")) {
        console.log("WebSocket/Connection error, delegating to error handler");
        handleWebSocketError(err);
      } else if (err.message.includes("Server đang bảo trì") || err.message.includes("503")) {
        alert("Server đang bảo trì. Vui lòng thử lại sau ít phút.");
      } else if (err.message.includes("Server quá tải") || err.message.includes("429")) {
        alert("Server đang quá tải. Vui lòng đợi một chút rồi thử lại.");
      } else {
        alert("Không thể kết nối phòng: " + err.message + "\n\nVui lòng thử lại hoặc tải lại trang.");
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
      // Ensure global loading overlay is cleared when leaving gameplay
      setLoading(false);
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
  const backToHome = () => {
    navigate("//");
  };

  
  return (
    <div className="gameplay">
      <header className="header">
        <div className="header-left">
          <img
            src={`${import.meta.env.BASE_URL}logo/logo.png`}
            alt="Logo"
            className="logo"
            onClick={backToHome}
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
              ? "Đã thử kết nối nhiều lần nhưng không thành công. Server có thể đang bảo trì hoặc phòng có quá nhiều người chơi."
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
              onClick={() => navigate("/")}
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
          hostId={hostId} // Pass hostId to RoomCreate
        />
      )}

      {connectionStatus === "connected" && screen === "quiz" && question && (
        <>
          {showX2Animation && (
            <div className="x2-animation-overlay">
              <div className="x2-animation-container">
                <div className="x2-text">
                  <span className="x2-multiplier">x2</span>
                  <span className="x2-points">ĐIỂM</span>
                </div>
                <div className="x2-particles">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="x2-particle"
                      style={{
                        '--delay': `${i * 0.1}s`,
                        '--angle': `${(i * 18)}deg`
                      }}
                    ></div>
                  ))}
                </div>
                <div className="x2-glow"></div>
                <div className="x2-ring"></div>
              </div>
            </div>
          )}
          <QuizItemGameplay
            question={question.text}
            answers={question.options}
            image={question.image}
            correctIndex={correctId}
            answerFeedback={answerFeedback}
            onSelectAnswer={handleAnswer}
            type={question.type}
          />
        </>
      )}

      {connectionStatus === "connected" && screen === "leaderboard" && (
        <LeaderBoardGamePlay 
          leaderboard={leaderboard} 
          scoreAnimations={scoreAnimations}
          currentUserId={currentUserId}
          isFinalLeaderboard={currentQuestionNumber === 10}
        />
      )}
    </div>
  );
}

// Function to calculate score animations
function calculateScoreAnimations(previousLeaderboard, currentLeaderboard) {
  const animations = [];

  console.log("=== Animation Calculation ===");
  console.log("Previous leaderboard length:", previousLeaderboard.length);
  console.log("Previous leaderboard:", JSON.stringify(previousLeaderboard, null, 2));
  console.log("Current leaderboard length:", currentLeaderboard.length);
  console.log("Current leaderboard:", JSON.stringify(currentLeaderboard, null, 2));

  // Only calculate animations if we have a previous leaderboard to compare with
  if (previousLeaderboard.length === 0) {
    console.log("No previous leaderboard, skipping score animations");
    return animations;
  }

  currentLeaderboard.forEach((currentPlayer, index) => {
    console.log(`Processing player ${index}:`, currentPlayer);
    const previousPlayer = previousLeaderboard.find(p => p.id === currentPlayer.id);
    console.log(`Found previous player:`, previousPlayer);

    if (previousPlayer) {
      const scoreIncrease = currentPlayer.score - previousPlayer.score;
      console.log(`Score change: ${previousPlayer.score} -> ${currentPlayer.score} = +${scoreIncrease}`);

      if (scoreIncrease > 0) {
        animations.push({
          playerId: currentPlayer.id,
          scoreIncrease: scoreIncrease,
          previousScore: previousPlayer.score,
          currentScore: currentPlayer.score
        });
        console.log(`✓ Animation added for player ${currentPlayer.id}: +${scoreIncrease}`);
      }
    } else {
      // New player appeared in leaderboard - show their current score as increase
      animations.push({
        playerId: currentPlayer.id,
        scoreIncrease: currentPlayer.score,
        previousScore: 0,
        currentScore: currentPlayer.score
      });
      console.log(`✓ New player animation added for ${currentPlayer.id}: +${currentPlayer.score}`);
    }
  });

  console.log("Final animations array:", animations);
  console.log("=== End Animation Calculation ===");
  return animations;
}

function calculateScores(players) {
  console.log("Raw players data:", players);
  if (!Array.isArray(players)) {
    console.warn("Players is not an array:", players);
    return [];
  }
  // Sort and return top 10 players
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 10);
  console.log("Sorted players:", sorted);
  return sorted;
}
