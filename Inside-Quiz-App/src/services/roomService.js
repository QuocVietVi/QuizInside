// services/roomService.js
export async function createRoom(token, category) {
  const response = await fetch("https://game1-wss-mcp.gamota.net:8843/api/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token, // header Authorization
    },
    body: JSON.stringify({ category }),
  });

  if (!response.ok) {
    throw new Error("Failed to create room");
  }

  return await response.json(); 
  // ví dụ backend trả về: { roomCode: "123 456", wsUrl: "wss://demo/rooms/123" }
}
