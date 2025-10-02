import React, { useState, useEffect } from "react";
import "./Home.css";
import Button from "@mui/material/Button";
import HomeContent from "../homeContent/HomeContent";
import { checkSession, initiateLogin, handleLoginCallback, logout, loadCategories } from "../../services/gameService";
import { useNavigate } from "react-router-dom";
import LoadingOverlay from "../../component/loading/LoadingOverlay";
import { setLoading } from "../../services/loadingService";

export default function Home() {
  const BASE_URL = import.meta.env.BASE_URL;
  const [navCategories, setNavCategories] = useState([]);
  const [pin, setPin] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [userToken, setUserToken] = useState(null); // Store OAuth token
  
  // Remove the generated token line
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth callback - check for token parameter
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const loginSuccess = urlParams.get('login');
    
    if (token) {
      // Step 3: Handle login callback with token
      handleOAuthCallback(token);
    } else if (loginSuccess === 'success') {
      // Legacy callback handling
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        checkLoginStatus();
      }, 500);
    } else {
      checkLoginStatus();
    }
    
    // Set up periodic session validation
    const sessionInterval = setInterval(() => {
      if (isLoggedIn && !isLoading) {
        checkLoginStatus();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(sessionInterval);
  }, []);

  // Ensure global loading overlay is cleared when Home mounts
  // and also when user navigates via browser back button (popstate).
  useEffect(() => {
    setLoading(false);
    const handlePopState = () => setLoading(false);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Add a debug function to check token status
  const debugTokenStatus = () => {
    console.log('=== Token Debug Info ===');
    console.log('Current state:', {
      isLoggedIn,
      userToken,
      currentUser: currentUser ? { id: currentUser.id, fullName: currentUser.fullName } : null,
    });
    console.log('Storage check:', {
      localStorage: localStorage.getItem('userToken'),
      sessionStorage: sessionStorage.getItem('userToken'),
      cookies: document.cookie
    });
    console.log('========================');
  };

  // Add useEffect to debug token issues
  useEffect(() => {
    if (isLoggedIn && !userToken) {
      console.warn('User is logged in but no token found');
      debugTokenStatus();
    }
  }, [isLoggedIn, userToken]);

  // Add a manual token check function for debugging
  window.debugTokenStatus = debugTokenStatus; // Make available in console

  // Add function to set token in API headers
  const setTokenInHeaders = (token) => {
    // Set token for future API requests
    if (token) {
      // If you're using axios, you can set default headers like this:
      // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // For fetch requests, store token globally
      window.authToken = token;
      
      console.log('Token set in headers:', token);
    }
  };

  const handleOAuthCallback = async (token) => {
    setIsLoading(true);
    setLoginError(null);
    setLoading(true); // show global overlay while processing callback

    try {
      console.log('Processing OAuth callback with token:', token);
      console.log('This is OAuth token, will exchange for accessToken...');
      
      const result = await handleLoginCallback(token);
      console.log('handleLoginCallback result:', result);
      
      if (result.success) {
        // Store preliminary data from callback
        const callbackUser = result.data;
        const accessToken = result.token;

        // persist token immediately
        if (accessToken) {
          setUserToken(accessToken);
          localStorage.setItem('userToken', accessToken);
          sessionStorage.setItem('userToken', accessToken);
          window.authToken = accessToken;
        }

        // Try to verify session with server to get canonical user object
        try {
          const verifyResult = await checkSession();
          console.log('Immediate session verification result:', verifyResult);

          if (verifyResult && verifyResult.success) {
            // Use verified user & token (if provided)
            setCurrentUser(verifyResult.user || callbackUser || null);
            setIsLoggedIn(true);
            const tokenFromVerify = verifyResult.token || accessToken;
            if (tokenFromVerify) {
              setUserToken(tokenFromVerify);
              localStorage.setItem('userToken', tokenFromVerify);
              sessionStorage.setItem('userToken', tokenFromVerify);
              window.authToken = tokenFromVerify;
            }
          } else {
            // Fallback to callback-provided user if verification didn't return user
            setCurrentUser(callbackUser || null);
            setIsLoggedIn(true);
          }
        } catch (verifyErr) {
          console.error('Session verification failed after callback:', verifyErr);
          // Still set user from callback as fallback
          setCurrentUser(callbackUser || null);
          setIsLoggedIn(true);
        }

        setLoginError(null);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success message briefly
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #4CAF50; color: white; padding: 12px 24px;
          border-radius: 8px; font-weight: 600;
        `;
        successMsg.textContent = '✓ Đăng nhập thành công!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
        
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setLoginError(error.message);
      setCurrentUser(null);
      setIsLoggedIn(false);
      
      // Clean up URL parameters even on error
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show error message
      alert('Đăng nhập thất bại: ' + error.message);
    } finally {
      setLoading(false); // đảm bảo hide overlay
      setIsLoading(false);
    }
  };

  const checkLoginStatus = async () => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const result = await checkSession();
      console.log('checkSession result:', result);
      
      if (result.success) {
        setCurrentUser(result.user);
        setIsLoggedIn(true);
        setLoginError(null);
        
        // The result.token should be the accessToken
        let accessToken = result.token;
        
        // Fallback to storage if no token in result
        if (!accessToken) {
          accessToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
          console.log('Using accessToken from storage:', accessToken);
        }
        
        if (accessToken) {
          setUserToken(accessToken);
          localStorage.setItem('userToken', accessToken);
          console.log('AccessToken set successfully:', accessToken);
        } else {
          console.warn('No accessToken found anywhere during session check');
        }
        
        console.log('Session check successful:', result.user);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setUserToken(null);
        localStorage.removeItem('userToken');
        sessionStorage.removeItem('userToken');
        window.authToken = null;
        console.log('No valid session found');
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      setCurrentUser(null);
      setIsLoggedIn(false);
      setUserToken(null);
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!isLoggedIn) {
      setIsLoading(true);
      setLoginError(null);
      
      try {
        setLoading(true); // show overlay while initiating login
        await initiateLogin();
        // initiateLogin will redirect, so we won't reach here normally
        setLoading(false);
      } catch (error) {
        console.error('Login error:', error);
        setLoginError(error.message);
        setIsLoading(false);
        setLoading(false);
        
        // Show detailed error message
        let errorMsg = 'Không thể đăng nhập';
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMsg = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Kết nối timeout. Vui lòng thử lại sau.';
        } else {
          errorMsg = error.message;
        }
        
        alert(errorMsg);
      }
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setCurrentUser(null);
      setIsLoggedIn(false);
      setLoginError(null);
      setUserToken(null);
      
      // Clear all token storage
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
      window.authToken = null;
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #4CAF50; color: white; padding: 12px 24px;
        border-radius: 8px; font-weight: 600;
      `;
      successMsg.textContent = '✓ Đăng xuất thành công!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
      
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    // Check login first
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập trước khi tham gia phòng");
      handleLogin();
      return;
    }

    if (!userToken) {
      alert("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      handleLogin();
      return;
    }

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
      console.log("Joining room with OAuth token:", userToken);
      setLoading(true); // show overlay while navigating
      navigate("/gameplay", {
        state: {
          roomID: roomID,
          isHost: false,
          category: "Quiz",
          token: userToken // Pass OAuth token
        }
      });
    } catch (err) {
      console.error("Navigation error:", err);
      setLoading(false);
      alert("Lỗi join room: " + err.message);
    }
  };

  // Fetch sub-navbar categories from server and ensure "Home" is first
  useEffect(() => {
    let mounted = true;
    const pickIconFor = (name, idx) => {
      if (!name) return `${BASE_URL}icon/iconGame.png`;
      const n = name.toLowerCase();
      if (n.includes("home")) return `${BASE_URL}icon/iconHome.png`;
      if (n.includes("thể thao")) return `${BASE_URL}icon/iconSport.png`;
      if (n.includes("phim ảnh")) return `${BASE_URL}icon/iconMovie.png`;
      if (n.includes("game") || n.includes("games")) return `${BASE_URL}icon/iconGame.png`;
      if (n.includes("geo") || n.includes("map") || n.includes("địa")) return `${BASE_URL}icon/iconGeography.png`;
      if (n.includes("hist") || n.includes("lịch")) return `${BASE_URL}icon/iconHistory.png`;
      if (n.includes("âm nhạc")) return `${BASE_URL}icon/iconMusic.png`;
      if (n.includes("công nghệ") || n.includes("technology")) return `${BASE_URL}icon/iconTech.png`;
      if (n.includes("khoa học") || n.includes("science")) return `${BASE_URL}icon/iconScience.png`;
      if (n.includes("văn học")) return `${BASE_URL}icon/iconLiterature.png`;
      if (n.includes("động vật")) return `${BASE_URL}icon/iconAnimal.png`;
      if (n.includes("ẩm thực")) return `${BASE_URL}icon/iconFood.png`;

      return `${BASE_URL}image/quiz${(idx % 12) + 1}.png`;
    };

    const loadNav = async () => {
      try {
        const res = await loadCategories();
        let items = [];
        if (res.success && Array.isArray(res.categories) && res.categories.length) {
          items = res.categories.map((c, i) => {
            const label = c.name || c.title || `Category ${i + 1}`;
            // If server provided an image, normalize it to a usable URL
            let iconUrl = null;
            if (c.image) {
              const img = String(c.image || "").trim();
              if (img.startsWith("http") || img.startsWith("/")) iconUrl = img;
              else iconUrl = `${BASE_URL}${img}`;
            } else {
              iconUrl = pickIconFor(label, i);
            }
            return {
              id: c.id || i,
              label,
              icon: iconUrl
            };
          });
        } else {
          // fallback minimal categories
          items = [
            { id: "tech", label: "Appota Learn", icon: `${BASE_URL}icon/iconAppota.png` },
            { id: "sport", label: "Sports", icon: `${BASE_URL}icon/iconSport.png` },
            { id: "movie", label: "Movies", icon: `${BASE_URL}icon/iconMovie.png` },
            { id: "game", label: "Games", icon: `${BASE_URL}icon/iconGame.png` },
          ];
        }

        // Ensure Home is first
        const homeItem = { id: "home", label: "Home", icon: `${BASE_URL}icon/iconHome.png` };
        const finalList = [homeItem, ...items.filter(it => it.label !== "Home")];

        if (mounted) {
          setNavCategories(finalList);
          // ensure active index exists
          setActiveIndex(prev => (prev < finalList.length ? prev : 0));
        }
      } catch (err) {
        console.error("Failed to load nav categories:", err);
      }
    };

    loadNav();
    return () => { mounted = false; };
  }, [BASE_URL]);

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="home">
      <LoadingOverlay />
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
            {isLoading ? (
              <div style={{ 
                width: "120px", 
                height: "40px", 
                backgroundColor: "#f0f0f0", 
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: "#666"
              }}>
                Loading...
              </div>
            ) : isLoggedIn && currentUser ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backgroundColor: "#f0f0f0"
                }}>
                  <img
                    src={currentUser.avatar}
                    alt="Avatar"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                  />
                  <span style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                    maxWidth: "100px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {currentUser.fullName}
                  </span>
                </div>
                <Button
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    borderRadius: "20px",
                    padding: "6px 16px",
                    fontSize: "12px",
                    textTransform: "none",
                    borderColor: "#91d9bf",
                    color: "#91d9bf",
                    "&:hover": { 
                      borderColor: "#81c8af",
                      color: "#81c8af",
                      backgroundColor: "rgba(145, 217, 191, 0.1)"
                    }
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={isLoading}
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
                  "&:disabled": { backgroundColor: "#ccc", color: "#666" }
                }}
              >
                {isLoading ? "Loading..." : "Sign in"}
              </Button>
            )}
          </div>
        </div>

        {/* Error message display */}
        {loginError && (
          <div style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "8px 16px",
            borderRadius: "4px",
            margin: "8px 16px",
            fontSize: "14px",
            border: "1px solid #ffcdd2"
          }}>
            ⚠️ {loginError}
          </div>
        )}

        {/* Navbar phụ */}
        <div className="sub-navbar">
          {navCategories.map((cat, index) => (
            <div
              key={cat.id || index}
              className={`category ${activeIndex === index ? "active" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              {/* cat.icon is already a normalized URL (absolute or starts with /) */}
              <img src={cat.icon} alt={cat.label} />
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
        <HomeContent isLoggedIn={isLoggedIn} userToken={userToken} />
      </div>
    </div>
  );
}
