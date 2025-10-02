import { useState, useEffect } from "react";
import "./HomeContentItem.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import { CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { getLoginStatus, initiateLogin, checkSession, loadCategories } from "../../services/gameService";
import { setLoading } from "../../services/loadingService";

const CustomCardActionArea4 = styled(CardActionArea)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  "&.Mui-focusVisible": {
    outline: "none",
  },
  "&:focus": {
    outline: "none",
  },
}));

function HomeContentItem({ title, isLoggedIn, userToken }) {
  const BASE_URL = import.meta.env.BASE_URL;
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState(null);

  // Fetch categories using gameService
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingState(true);
        setError(null);
        
        const result = await loadCategories();
        
        if (result.success) {
          setCategories(result.categories);
        } else {
          console.error('Failed to fetch categories:', result.error);
          // Fallback data if API fails
          setCategories([
            { id: 1, name: "Công nghệ", image: `${BASE_URL}image/quiz1.png` },
            { id: 2, name: "Thể thao", image: `${BASE_URL}image/quiz2.png` },
            { id: 3, name: "Âm nhạc", image: `${BASE_URL}image/quiz3.png` },
            { id: 4, name: "Lịch sử", image: `${BASE_URL}image/quiz4.png` },
            { id: 5, name: "Địa lý", image: `${BASE_URL}image/quiz5.png` },
            { id: 6, name: "Khoa học", image: `${BASE_URL}image/quiz6.png` },
            { id: 7, name: "Văn học", image: `${BASE_URL}image/quiz7.png` },
            { id: 8, name: "Điện ảnh", image: `${BASE_URL}image/quiz8.png` },
          ]);
          setError("Không thể tải danh mục từ server, sử dụng dữ liệu mặc định");
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError("Lỗi kết nối mạng");
        // Use fallback data
        setCategories([
          { id: 1, name: "Công nghệ", image: `${BASE_URL}image/quiz1.png` },
          { id: 2, name: "Thể thao", image: `${BASE_URL}image/quiz2.png` },
          { id: 3, name: "Âm nhạc", image: `${BASE_URL}image/quiz3.png` },
          { id: 4, name: "Lịch sử", image: `${BASE_URL}image/quiz4.png` },
          { id: 5, name: "Địa lý", image: `${BASE_URL}image/quiz5.png` },
          { id: 6, name: "Khoa học", image: `${BASE_URL}image/quiz6.png` },
        ]);
      } finally {
        setLoadingState(false);
      }
    };

    fetchCategories();
  }, [BASE_URL]);

  // ✅ Check login before navigating to gameplay
  const handleGoToGameplay = async (category) => {
    console.log('=== handleGoToGameplay Debug ===');
    console.log('Input params:', { category, isLoggedIn, userToken });
    
    // Check login first
    if (!isLoggedIn) {
      setLoading(true);
      try {
        await initiateLogin();
      } catch (error) {
        console.error('Login initiation failed:', error);
        setLoading(false);
      }
      return;
    }

    // Enhanced token retrieval with comprehensive checking
    let finalToken = userToken;
    
    if (!finalToken) {
      finalToken = localStorage.getItem('userToken');
      
      if (!finalToken) {
        finalToken = sessionStorage.getItem('userToken');
      }
      
      if (!finalToken) {
        const cookies = document.cookie.split('; ');
        const possibleCookieNames = ['token', 'access_token', 'auth_token', 'jwt'];
        for (const cookieName of possibleCookieNames) {
          const cookieToken = cookies.find(row => row.startsWith(`${cookieName}=`))?.split('=')[1];
          if (cookieToken) {
            finalToken = cookieToken;
            break;
          }
        }
      }
      
      if (!finalToken) {
        try {
          const sessionResult = await checkSession();
          if (sessionResult.success) {
            finalToken = sessionResult.token || 
                        sessionResult.user?.token || 
                        sessionResult.access_token;
            
            if (finalToken) {
              localStorage.setItem('userToken', finalToken);
              sessionStorage.setItem('userToken', finalToken);
            }
          }
        } catch (error) {
          console.error('Fresh session check failed:', error);
        }
      }
    }

    if (!finalToken) {
      console.error('No token found in any source');
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
      
      setLoading(true);
      try {
        await initiateLogin();
      } catch (error) {
        console.error('Login initiation failed:', error);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    navigate("/gameplay", {
      state: {
        category: category,
        isHost: true,
        token: finalToken,
      },
    });
  };

  if (loading) {
    return (
      <div className="quiz-container-home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container-home">
      <div className="quiz-header">
        {error && <p className="error-message">{error}</p>}
      </div>
      
      <div className="quiz-grid">
        {categories.map((category, index) => (
          <div className="quiz-item" key={category.id || index}>
            <Card className="quiz-card">
              <CustomCardActionArea4  onClick={(e) => {
                      e.stopPropagation();
                      handleGoToGameplay(category.name);
                    }}>
                <div className="quiz-image-container">
                  <img 
                    src={category.image || `${BASE_URL}gif/quiz${(index % 12) + 1}.gif`} 
                    alt={category.name} 
                    className="quiz-card-img" 
                  />
                  <div className="quiz-image-overlay"></div>
                </div>
                
                <CardContent className="quiz-card-content">
                  <h3 className="quiz-title">{category.name}</h3>
                  <p className="quiz-description">
                    Khám phá kiến thức về {category.name.toLowerCase()} với những câu hỏi thú vị
                  </p>
                  
                  <Button
                    variant="contained"
                    className="create-room-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToGameplay(category.name);
                    }}
                    sx={{
                      borderRadius: "25px",
                      fontWeight: 700,
                      fontSize: "15px",
                      textTransform: "none",
                      backgroundColor: "#3bbd8dff",
                      color: "white",
                      width: "100%",
                      height: "45px",
                      marginTop: "15px",
                      boxShadow: "0 4px 12px rgba(59, 189, 141, 0.3)",
                      "&:hover": { 
                        backgroundColor: "#2da874",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 16px rgba(59, 189, 141, 0.4)"
                      },
                      "&.Mui-focusVisible": {
                        outline: "none",
                      },
                      "&:focus": {
                        outline: "none",
                      },
                    }}
                  >
                    🎮 Tạo phòng
                  </Button>
                </CardContent>
              </CustomCardActionArea4>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomeContentItem;
