// src/services/gameService.js

let ws = null;
let isHost = false;
let questionTimer = null;
let leaderboardTimer = null;

const baseUrl = "https://game1-wss-mcp.gamota.net:8843/api"; // API server của bạn
const wsBaseUrl = "wss://game1-wss-mcp.gamota.net:8843/ws"; // WebSocket server URL của bạn (chắc chắn đây là đúng)

// ================== API ==================
export async function createRoom(token, category, onConnect) {
  if (!token) throw new Error("Vui lòng nhập token.");
  if (!category) throw new Error("Vui lòng chọn một chủ đề.");

  const response = await fetch(`${baseUrl}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category_name: category }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Không thể tạo phòng.");
  }
  const data = await response.json();
  isHost = true;
  connectToRoom(data.room_id, token, onConnect);
  return data;
}

export async function joinRoom(roomID, token, onConnect) {
  if (!roomID || !token) throw new Error("Vui lòng nhập đủ mã phòng và token.");

  const response = await fetch(`${baseUrl}/rooms/${roomID}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Không thể tham gia phòng.");
  }
  const data = await response.json();
  connectToRoom(data.room_id, token, onConnect);
  return data;
}

export async function startGame(roomID, token) {
  const response = await fetch(`${baseUrl}/rooms/${roomID}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Không thể bắt đầu trò chơi.");
  }
}

// ================== WebSocket ==================
export function connectToRoom(roomID, token, onMessage) {
  if (ws) ws.close(); // Nếu WebSocket đã tồn tại thì đóng kết nối cũ

  // Sử dụng đúng WebSocket server URL
  const wsUrl = `${wsBaseUrl}/${roomID}?token=${token}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("✅ WebSocket connected");
    if (onMessage) {
      // Gửi thông tin kết nối thành công qua callback
      onMessage({ type: "connected", message: "WebSocket connected successfully" });
    }
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (onMessage) onMessage(message); // callback vào React
  };

  ws.onclose = () => {
    console.log("❌ WebSocket closed");
    if (onMessage) {
      onMessage({ type: "disconnected", message: "WebSocket disconnected" });
    }
  };

  ws.onerror = (error) => {
    console.error("⚠️ WebSocket error:", error);
    if (onMessage) {
      onMessage({ type: "error", message: "WebSocket encountered an error" });
    }
  };
}

export function sendAnswer(answer) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "answer", payload: answer }));
  }
}

// ================== Timer Helpers ==================
export function startQuestionTimer(seconds, onTick, onEnd) {
  let timeLeft = seconds;
  if (questionTimer) clearInterval(questionTimer);
  onTick(timeLeft);
  questionTimer = setInterval(() => {
    timeLeft--;
    onTick(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      if (onEnd) onEnd();
    }
  }, 1000);
}

export function clearTimers() {
  clearInterval(questionTimer);
  clearTimeout(leaderboardTimer);
}

// ================== Utility ==================
export function leaveRoom() {
  if (ws) {
    ws.close();
    ws = null;
  }
  isHost = false;
}
