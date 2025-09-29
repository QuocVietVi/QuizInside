// src/services/gameService.js

let ws = null;
let isHost = false;
let questionTimer = null;
let leaderboardTimer = null;
let isConnecting = false;
let connectionAttempts = 0;
let maxConnectionAttempts = 3;

const baseUrl = "https://game1-wss-mcp.gamota.net:8843/api";
const wsBaseUrl = "wss://game1-wss-mcp.gamota.net:8843/ws";

// ================== API ==================
export async function createRoom(token, category, onMessage, onError) {
  if (!token) throw new Error("Vui lòng nhập token.");
  if (!category) throw new Error("Vui lòng chọn một chủ đề.");

  try {
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
    
    // Connect to WebSocket với error handling
    await connectToRoom(data.room_id, token, onMessage, onError);
    return data;
  } catch (error) {
    console.error("Create room error:", error);
    throw error;
  }
}

export async function joinRoom(roomID, token, onMessage, onError) {
  if (!roomID || !token) throw new Error("Vui lòng nhập đủ mã phòng và token.");
  
  // Validate roomID format
  if (roomID.length !== 6 || !/^\d+$/.test(roomID)) {
    throw new Error("Mã phòng phải có 6 chữ số.");
  }

  console.log("Joining room with token:", token.substring(0, 10) + "...");

  try {
    // First, try to connect to WebSocket directly without API call
    // Some servers handle room joining through WebSocket connection
    console.log("Attempting to join room via WebSocket:", roomID);
    isHost = false; // Make sure this is set to false for joiners
    await connectToRoom(roomID, token, onMessage, onError);
    
    // Return success response
    return { room_id: roomID };
    
  } catch (wsError) {
    console.log("WebSocket direct join failed, trying API approach:", wsError.message);
    
    // If WebSocket direct join fails, try API approach
    try {
      const response = await fetch(`${baseUrl}/rooms/${roomID}/join`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API join error:", errorText);
        
        // Handle specific error messages
        if (errorText.includes("already in room") || errorText.includes("đã ở trong phòng")) {
          throw new Error("Bạn đã tham gia phòng này rồi. Vui lòng tải lại trang và thử lại.");
        } else if (errorText.includes("not found") || errorText.includes("không tồn tại")) {
          throw new Error("Phòng không tồn tại. Vui lòng kiểm tra lại mã PIN.");
        } else {
          throw new Error(errorText || "Không thể tham gia phòng.");
        }
      }
      
      const data = await response.json();
      isHost = false; // Make sure this is set to false for joiners
      
      // Connect to WebSocket after successful API join
      await connectToRoom(data.room_id, token, onMessage, onError);
      return data;
      
    } catch (apiError) {
      console.error("Both WebSocket and API join failed:", apiError);
      throw apiError;
    }
  }
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
export function connectToRoom(roomID, token, onMessage, onError) {
  return new Promise((resolve, reject) => {
    // Prevent duplicate connections
    if (isConnecting) {
      console.log("Already connecting, skipping...");
      return resolve();
    }

    // Check if already connected to the same room
    if (ws && ws.readyState === WebSocket.OPEN && ws.url.includes(roomID)) {
      console.log("Already connected to this room");
      return resolve();
    }

    isConnecting = true;

    // Close existing connection if any
    if (ws) {
      console.log("Closing existing WebSocket connection");
      ws.close();
      ws = null;
    }

    const wsUrl = `${wsBaseUrl}/${roomID}?token=${token}`;
    console.log("Attempting WebSocket connection to:", wsUrl);
    console.log("User is host:", isHost);

    try {
      ws = new WebSocket(wsUrl);

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          console.error("WebSocket connection timeout");
          isConnecting = false;
          ws.close();
          const error = new Error("Kết nối WebSocket timeout. Vui lòng thử lại.");
          if (onError) onError(error);
          reject(error);
        }
      }, 15000); // Increase timeout to 15 seconds

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        isConnecting = false;
        connectionAttempts = 0;
        console.log("✅ WebSocket connected successfully");
        console.log("Token:", token.substring(0, 10) + "...");
        console.log("Is Host:", isHost);
        
        // Send appropriate message based on user type
        if (!isHost) {
          try {
            const joinMessage = {
              type: "join_room",
              payload: { 
                room_id: roomID,
                user_token: token // Include token in payload
              }
            };
            ws.send(JSON.stringify(joinMessage));
            console.log("📤 Sent join room message:", joinMessage);
          } catch (sendError) {
            console.error("Failed to send join message:", sendError);
          }
        } else {
          try {
            const createMessage = {
              type: "create_room",
              payload: { 
                room_id: roomID,
                user_token: token // Include token in payload
              }
            };
            ws.send(JSON.stringify(createMessage));
            console.log("📤 Sent create room message:", createMessage);
          } catch (sendError) {
            console.error("Failed to send create message:", sendError);
          }
        }
        
        if (onMessage) {
          onMessage({ type: "connected", message: "WebSocket connected successfully" });
        }
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("📨 Received:", message);
          
          // Handle specific error messages from server
          if (message.type === "error") {
            console.error("Server error:", message);
            if (message.message && message.message.includes("already in room")) {
              const error = new Error("Bạn đã tham gia phòng này. Vui lòng tải lại trang và thử lại.");
              if (onError) onError(error);
              return;
            }
          }
          
          if (onMessage) onMessage(message);
        } catch (parseError) {
          console.error("Error parsing message:", parseError);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        isConnecting = false;
        console.log("❌ WebSocket closed:", event.code, event.reason);
        
        if (onMessage) {
          onMessage({ 
            type: "disconnected", 
            message: "WebSocket disconnected",
            code: event.code,
            reason: event.reason
          });
        }

        // Don't retry if it was intentional closure or specific error codes
        if (event.code === 1000 || event.code === 4004 || connectionAttempts >= maxConnectionAttempts) {
          return;
        }

        // Attempt reconnection with exponential backoff for network issues
        if (event.code !== 4000 && connectionAttempts < maxConnectionAttempts) {
          connectionAttempts++;
          console.log(`Retrying connection... (${connectionAttempts}/${maxConnectionAttempts})`);
          
          setTimeout(() => {
            connectToRoom(roomID, token, onMessage, onError)
              .catch(err => {
                if (onError) onError(err);
              });
          }, 2000 * connectionAttempts);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        isConnecting = false;
        console.error("⚠️ WebSocket error:", error);
        
        const wsError = new Error("Không thể kết nối WebSocket. Kiểm tra kết nối mạng và thử lại.");
        if (onError) onError(wsError);
        reject(wsError);
      };

    } catch (error) {
      isConnecting = false;
      console.error("Failed to create WebSocket:", error);
      const createError = new Error("Không thể tạo kết nối WebSocket");
      if (onError) onError(createError);
      reject(createError);
    }
  });
}

export function sendAnswer(answer) {
  if (ws?.readyState === WebSocket.OPEN) {
    const message = { type: "answer", payload: answer };
    ws.send(JSON.stringify(message));
    console.log("📤 Sent answer:", message);
  } else {
    throw new Error("WebSocket is not connected");
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
    ws.close(1000, "User left room");
    ws = null;
  }
  isHost = false;
  isConnecting = false;
  connectionAttempts = 0;
}

export function getConnectionStatus() {
  if (!ws) return "disconnected";
  
  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return "connecting";
    case WebSocket.OPEN:
      return "connected";
    case WebSocket.CLOSING:
      return "closing";
    case WebSocket.CLOSED:
      return "disconnected";
    default:
      return "unknown";
  }
}
