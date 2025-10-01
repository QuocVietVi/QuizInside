// src/services/gameService.js

let ws = null;
let isHost = false;
let questionTimer = null;
let leaderboardTimer = null;
let isConnecting = false;
let connectionAttempts = 0;
let maxConnectionAttempts = 3;

// Use the correct API base URL
const baseUrl = "https://game1-wss-mcp.gamota.net:8843/api";
const wsBaseUrl = "wss://game1-wss-mcp.gamota.net:8843/ws";

// ================== Authentication ==================
let currentUser = null;
let isLoggedIn = false;

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const defaultOptions = {
    timeout: 30000, // 30 second timeout
    ...options
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        if (error.name === 'AbortError') {
          throw new Error('Kết nối timeout. Vui lòng kiểm tra mạng và thử lại.');
        } else if (error.message.includes('fetch')) {
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        }
        throw error;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export async function checkSession() {
  try {
    const accessToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    
    console.log('Checking session with accessToken:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header with access token
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      console.warn('No accessToken found for session check');
    }
    
    const response = await fetchWithRetry(`${baseUrl}/auth/me`, {
      headers: headers
    });
    
    console.log('Session check response status:', response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('Session check response data:', responseData);
      
      // Extract user data from response
      let userData = responseData;
      if (responseData.user) {
        userData = responseData.user;
      } else if (responseData.data?.user) {
        userData = responseData.data.user;
      } else if (responseData.data) {
        userData = responseData.data;
      }
      
      currentUser = userData;
      isLoggedIn = true;
      
      // Update localStorage with success marker
      try {
        localStorage.setItem('quiz_user', JSON.stringify(userData));
        localStorage.setItem('quiz_login_time', Date.now().toString());
        localStorage.setItem('quiz_session_valid', 'true');
        localStorage.setItem('quiz_last_check', Date.now().toString());
        
        // Keep the existing access token
        if (!accessToken && (responseData.accessToken || responseData.access_token)) {
          const newAccessToken = responseData.accessToken || responseData.access_token;
          localStorage.setItem('userToken', newAccessToken);
          sessionStorage.setItem('userToken', newAccessToken);
          console.log('Updated accessToken from session response:', newAccessToken);
        }
      } catch (e) {
        console.warn('Cannot save to localStorage:', e);
      }
      
      return { 
        success: true, 
        user: userData, 
        token: accessToken || responseData.accessToken || responseData.access_token
      };
    } else {
      const errorText = await response.text();
      console.error('Session check failed:', response.status, errorText);
      throw new Error(`Session check failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('Session check failed:', error.message);
    
    // Always try localStorage recovery first
    try {
      const savedUser = localStorage.getItem('quiz_user');
      const loginTime = localStorage.getItem('quiz_login_time');
      const sessionValid = localStorage.getItem('quiz_session_valid');
      const lastCheck = localStorage.getItem('quiz_last_check');
      const savedToken = localStorage.getItem('userToken');
      
      if (savedUser && loginTime && sessionValid === 'true') {
        const timeDiff = Date.now() - parseInt(loginTime);
        const lastCheckDiff = lastCheck ? Date.now() - parseInt(lastCheck) : Infinity;
        
        // Use cached session if:
        // 1. Login was within 24 hours
        // 2. Last successful check was within 1 hour OR this is a network error
        const isWithinTimeLimit = timeDiff < 24 * 60 * 60 * 1000;
        const isRecentCheck = lastCheckDiff < 60 * 60 * 1000;
        const isNetworkError = error.message.includes('fetch') || 
                              error.message.includes('network') || 
                              error.message.includes('timeout');
        
        // Don't use cache for 401 errors - these indicate invalid/expired tokens
        const is401Error = error.message.includes('401') || error.message.includes('Unauthorized');
        
        if (isWithinTimeLimit && (isRecentCheck || isNetworkError) && !is401Error) {
          currentUser = JSON.parse(savedUser);
          isLoggedIn = true;
          console.log('Using cached session - Network:', isNetworkError, 'Recent:', isRecentCheck);
          
          // Try to refresh in background only if it's been a while
          if (!isRecentCheck) {
            setTimeout(() => {
              checkSessionBackground();
            }, 5000);
          }
          
          return { 
            success: true, 
            user: currentUser, 
            token: savedToken 
          };
        } else if (is401Error) {
          console.log('Token appears to be invalid (401), clearing cache');
        }
      }
    } catch (e) {
      console.warn('Cannot recover from localStorage:', e);
    }
    
    // Clear invalid session data
    try {
      localStorage.removeItem('quiz_user');
      localStorage.removeItem('quiz_login_time');
      localStorage.removeItem('quiz_session_valid');
      localStorage.removeItem('quiz_last_check');
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
    } catch (e) {
      console.warn('Cannot clear localStorage:', e);
    }
    
    currentUser = null;
    isLoggedIn = false;
    return { success: false, error: error.message };
  }
}

// Background session check with better error handling
async function checkSessionBackground() {
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseUrl}/auth/me`, {
      // Remove credentials: 'include' to avoid CORS issues
      headers: headers
    });
    
    if (response.ok) {
      const userData = await response.json();
      currentUser = userData;
      isLoggedIn = true;
      
      // Update localStorage with success
      try {
        localStorage.setItem('quiz_user', JSON.stringify(userData));
        localStorage.setItem('quiz_login_time', Date.now().toString());
        localStorage.setItem('quiz_session_valid', 'true');
        localStorage.setItem('quiz_last_check', Date.now().toString());
      } catch (e) {
        console.warn('Cannot update localStorage:', e);
      }
      
      console.log('Background session refresh successful');
    } else {
      // Only clear if it's a definitive auth failure, not network error
      if (response.status === 401 || response.status === 403) {
        console.log('Session expired on server, clearing cache');
        currentUser = null;
        isLoggedIn = false;
        
        try {
          localStorage.removeItem('quiz_user');
          localStorage.removeItem('quiz_login_time');
          localStorage.removeItem('quiz_session_valid');
          localStorage.removeItem('quiz_last_check');
          localStorage.removeItem('userToken');
          sessionStorage.removeItem('userToken');
        } catch (e) {
          console.warn('Cannot clear localStorage:', e);
        }
      } else {
        console.log('Network error in background check, keeping cache');
      }
    }
  } catch (error) {
    console.log('Background session check failed:', error.message);
    // Don't clear cache on network errors during background check
  }
}

export async function initiateLogin() {
  try {
    // Step 1: Get login code and generate login URL
    // For redirect URL, always use the current protocol and redirect to home
    const redirectUrl = `${window.location.protocol}//${window.location.host}/`;
    
    console.log('Sending login request with redirectUrl:', redirectUrl);
    
    const response = await fetchWithRetry(`${baseUrl}/auth/oauth/login-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Remove credentials: 'include' for this request to avoid CORS issue
      body: JSON.stringify({
        redirectUrl: redirectUrl
      })
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login API error:', errorText);
      
      if (response.status === 0 || !response.status) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      }
      
      throw new Error(`Lỗi đăng nhập: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Login response data:', data);
    
    // Step 2: Check for the actual response structure
    let loginUrl = null;
    
    // Handle nested response structure
    if (data.data) {
      loginUrl = data.data.login_web || data.data.loginUrl || data.data.login_url || data.data.url;
    } else {
      // Fallback to direct fields
      loginUrl = data.login_web || data.loginUrl || data.login_url || data.url || data.authUrl;
    }
    
    if (loginUrl) {
      console.log('Redirecting to login URL:', loginUrl);
      window.location.href = loginUrl;
    } else {
      console.error('No login URL found in response:', data);
      throw new Error(`No login URL received. Response: ${JSON.stringify(data)}`);
    }
    
  } catch (error) {
    console.error('Login initiation error:', error);
    
    let errorMessage = 'Không thể khởi tạo đăng nhập';
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Kết nối timeout. Vui lòng thử lại.';
    } else {
      errorMessage = error.message;
    }
    
    alert(errorMessage);
    throw error;
  }
}

export async function handleLoginCallback(token) {
  try {
    console.log('Handling login callback with OAuth token:', token);
    
    // Step 3: Use the OAuth token to get access token
    const response = await fetchWithRetry(`${baseUrl}/auth/oauth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Don't send OAuth token in Authorization header, send it in body
      body: JSON.stringify({
        token: token
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login callback error:', errorText);
      
      if (response.status === 0 || !response.status) {
        throw new Error('Không thể kết nối đến server đăng nhập');
      }
      
      throw new Error(`Đăng nhập thất bại: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Login callback response:', responseData);
    
    // Extract access token and user data from response
    let userData = responseData;
    let accessToken = null;
    
    // The key change: look for accessToken specifically
    if (responseData.accessToken) {
      accessToken = responseData.accessToken;
      console.log('Found accessToken in response:', accessToken);
    } else if (responseData.access_token) {
      accessToken = responseData.access_token;
      console.log('Found access_token in response:', accessToken);
    } else if (responseData.data?.accessToken) {
      accessToken = responseData.data.accessToken;
      console.log('Found accessToken in response.data:', accessToken);
    } else if (responseData.data?.access_token) {
      accessToken = responseData.data.access_token;
      console.log('Found access_token in response.data:', accessToken);
    } else {
      console.error('No accessToken found in response:', responseData);
      throw new Error('Không nhận được access token từ server');
    }
    
    // Extract user data if it's nested
    if (responseData.user) {
      userData = responseData.user;
    } else if (responseData.data?.user) {
      userData = responseData.data.user;
    } else if (responseData.data && !responseData.user && !responseData.accessToken && !responseData.access_token) {
      userData = responseData.data;
    }
    
    currentUser = userData;
    isLoggedIn = true;
    
    console.log('Storing user data:', userData);
    console.log('Storing accessToken:', accessToken);
    
    // Store the ACCESS TOKEN, not the OAuth token
    try {
      const currentTime = Date.now().toString();
      localStorage.setItem('quiz_user', JSON.stringify(userData));
      localStorage.setItem('quiz_login_time', currentTime);
      localStorage.setItem('quiz_session_valid', 'true');
      localStorage.setItem('quiz_last_check', currentTime);
      localStorage.setItem('userToken', accessToken); // Store access token
      sessionStorage.setItem('userToken', accessToken);
    } catch (e) {
      console.warn('Cannot save to localStorage:', e);
    }
    
    return { 
      success: true, 
      user: userData, 
      token: accessToken // Return access token
    };
    
  } catch (error) {
    console.error('Login callback error:', error);
    
    let errorMessage = 'Đăng nhập thất bại';
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage = 'Lỗi kết nối mạng khi đăng nhập. Vui lòng thử lại.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Kết nối đăng nhập timeout. Vui lòng thử lại.';
    } else {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}

export function getCurrentUser() {
  return currentUser;
}

export function getLoginStatus() {
  return isLoggedIn;
}

export async function loadPlayerStats() {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Not logged in' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = {
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${baseUrl}/player/stats`, { 
      headers: headers
    });
    
    if (!response.ok) throw new Error('Cannot load player stats');
    
    const stats = await response.json();
    return { success: true, stats };
  } catch (error) {
    console.error('Load stats error:', error.message);
    return { success: false, error: error.message };
  }
}

// ================== Shop & Inventory ==================
export async function loadShopItems() {
  try {
    const response = await fetchWithRetry(`${baseUrl}/shop/items`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Cannot load shop items');
    
    const items = await response.json();
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loadPlayerInventory() {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Not logged in' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${baseUrl}/inventory`, { 
      headers: headers
    });
    
    if (!response.ok) throw new Error('Cannot load inventory');
    
    const items = await response.json();
    return { success: true, items };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function purchaseItem(itemId) {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Please login to purchase items' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetchWithRetry(`${baseUrl}/shop/purchase`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ item_id: itemId })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Purchase failed');
    }
    
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message.replace(/"/g, '') };
  }
}

// ================== Categories & Leaderboard ==================
export async function loadCategories() {
  try {
    const response = await fetch(`${baseUrl}/cms/categories`);
    if (!response.ok) throw new Error('Cannot load categories');
    
    const categories = await response.json();
    return { success: true, categories };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loadGlobalLeaderboard() {
  try {
    const response = await fetch(`${baseUrl}/leaderboard`);
    if (!response.ok) throw new Error('Cannot load leaderboard');
    
    const leaderboard = await response.json();
    return { success: true, leaderboard };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ================== CMS Functions ==================
export async function createShopItem(itemData) {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Admin login required' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseUrl}/cms/shop/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(itemData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create item');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message.replace(/"/g, '') };
  }
}

export async function updateShopItem(itemId, itemData) {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Admin login required' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseUrl}/cms/shop/items/${itemId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(itemData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update item');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message.replace(/"/g, '') };
  }
}

export async function deleteShopItem(itemId) {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Admin login required' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseUrl}/cms/shop/items/${itemId}`, { 
      method: 'DELETE',
      headers: headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete item');
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message.replace(/"/g, '') };
  }
}

export async function importQuizzes(formData) {
  if (!isLoggedIn || !currentUser) {
    return { success: false, error: 'Admin login required' };
  }
  
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseUrl}/cms/quizzes/import`, { 
      method: 'POST', 
      headers: headers,
      body: formData 
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Import failed');
    }
    
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: error.message.replace(/"/g, '') };
  }
}

// ================== Room Management ==================
export async function createRoom(token, category, onMessage, onError) {
  if (!token) throw new Error("Vui lòng nhập token.");
  if (!category) throw new Error("Vui lòng chọn một chủ đề.");

  // Check if user is logged in for web version
  if (!isLoggedIn || !currentUser) {
    throw new Error("Vui lòng đăng nhập để tạo phòng.");
  }

  try {
    const response = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Remove credentials: 'include' to avoid CORS issues
      body: JSON.stringify({ category_name: category }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create room API error:', errorText, 'Status:', response.status);
      
      if (response.status === 401) {
        throw new Error("Token không hợp lệ. Vui lòng đăng nhập lại.");
      } else if (response.status === 403) {
        throw new Error("Không có quyền tạo phòng. Vui lòng đăng nhập lại.");
      }
      
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
  
  // Check if user is logged in for web version
  if (!isLoggedIn || !currentUser) {
    throw new Error("Vui lòng đăng nhập để tham gia phòng.");
  }

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
        // Remove credentials: 'include' to avoid CORS issues
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API join error:", errorText);
        
        if (response.status === 401) {
          throw new Error("Token không hợp lệ. Vui lòng đăng nhập lại.");
        } else if (response.status === 403) {
          throw new Error("Không có quyền tham gia phòng. Vui lòng đăng nhập lại.");
        }
        
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
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    // Remove credentials: 'include' to avoid CORS issues
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    if (response.status === 401) {
      throw new Error("Token không hợp lệ. Vui lòng đăng nhập lại.");
    } else if (response.status === 403) {
      throw new Error("Không có quyền bắt đầu game. Vui lòng đăng nhập lại.");
    }
    
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

// Add logout function to clear session
export async function logout() {
  try {
    const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try to logout from server
    await fetchWithRetry(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: headers
      // Remove credentials: 'include' to avoid CORS issues
    });
  } catch (error) {
    console.log('Logout API call failed:', error.message);
  } finally {
    // Clear local state regardless of API call result
    currentUser = null;
    isLoggedIn = false;
    
    // Clear all session-related localStorage items
    try {
      localStorage.removeItem('quiz_user');
      localStorage.removeItem('quiz_login_time');
      localStorage.removeItem('quiz_session_valid');
      localStorage.removeItem('quiz_last_check');
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
    } catch (e) {
      console.warn('Cannot clear localStorage:', e);
    }
  }
}

// Enhanced session validation on page events
if (typeof window !== 'undefined') {
  let isCheckingSession = false;
  
  const checkSessionIfNeeded = () => {
    if (isCheckingSession || !isLoggedIn) return;
    
    const lastCheck = localStorage.getItem('quiz_last_check');
    if (!lastCheck || Date.now() - parseInt(lastCheck) > 5 * 60 * 1000) { // 5 minutes
      isCheckingSession = true;
      checkSessionBackground().finally(() => {
        isCheckingSession = false;
      });
    }
  };
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(checkSessionIfNeeded, 1000);
    }
  });
  
  window.addEventListener('focus', () => {
    setTimeout(checkSessionIfNeeded, 1000);
  });
  
  // Periodic check every 10 minutes if page is active
  setInterval(() => {
    if (!document.hidden) {
      checkSessionIfNeeded();
    }
  }, 10 * 60 * 1000);
}
