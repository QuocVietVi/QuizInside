// src/hooks/useGameLogic.js
import { useState, useRef, useEffect } from "react";

export default function useGameLogic(baseUrl) {
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [screen, setScreen] = useState("main"); // main | waiting | question | leaderboard
  const wsRef = useRef(null);
  const timers = useRef({});

  // hiển thị thông báo
  const showAlert = (msg) => {
    alert(msg);
  };

  const connectToRoom = (roomID, token) => {
    setRoomId(roomID);
    setScreen("waiting");
    if (wsRef.current) wsRef.current.close();

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/${roomID}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket connected");
    ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
    ws.onclose = () => {
      showAlert("❌ Mất kết nối với phòng.");
      setScreen("main");
    };
    ws.onerror = (err) => console.error("WebSocket Error:", err);
  };

  const createRoom = async (token, category) => {
    if (!token || !category) {
      showAlert("Vui lòng nhập token và chọn chủ đề.");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category_name: category }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setIsHost(true);
      connectToRoom(data.room_id, token);
    } catch (err) {
      showAlert(err.message);
    }
  };

  const joinRoom = async (roomID, token) => {
    if (!roomID || !token) {
      showAlert("Vui lòng nhập đủ mã phòng và token.");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/rooms/${roomID}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setIsHost(false);
      connectToRoom(data.room_id, token);
    } catch (err) {
      showAlert(err.message);
    }
  };

  const startGame = async (token) => {
    try {
      const res = await fetch(`${baseUrl}/rooms/${roomId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      showAlert(err.message);
    }
  };

  const sendAnswer = (answer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "answer", payload: answer }));
    }
  };

  const handleMessage = (msg) => {
    switch (msg.type) {
      case "update_players":
        setPlayers(msg.payload.players);
        break;
      case "question":
        setQuestion(msg.payload);
        setResults(null);
        setScreen("question");
        break;
      case "results":
        setResults(msg.payload);
        setLeaderboard(msg.payload.leaderboard);
        setTimeout(() => setScreen("leaderboard"), 3000);
        break;
      case "game_over":
        setLeaderboard(msg.payload.leaderboard);
        setScreen("leaderboard");
        break;
      default:
        console.log("Unknown msg:", msg);
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return {
    roomId,
    isHost,
    players,
    question,
    results,
    leaderboard,
    screen,
    createRoom,
    joinRoom,
    startGame,
    sendAnswer,
  };
}
