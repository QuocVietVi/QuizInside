import { useState, useRef, useEffect } from "react";
import "./HomeContentItem.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { getLoginStatus, initiateLogin, checkSession } from "../../services/gameService";

const CustomCardActionArea4 = styled(CardActionArea)(({ theme }) => ({
  height: "150px",
  "&.Mui-focusVisible": {
    outline: "none",
  },
  "&:focus": {
    outline: "none",
  },
  "@media (max-width: 648px)": {
    height: "100px",
  },
}));

function HomeContentItem({ quizList, title, isLoggedIn, userToken }) {
  const BASE_URL = import.meta.env.BASE_URL;
  const quizzes = quizList || [];
  const containerRef = useRef(null);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [page, setPage] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const navigate = useNavigate();

  const MIN_ITEMS = 3;

  useEffect(() => {
    const updateItems = () => {
      if (containerRef.current) {
        const cw = containerRef.current.offsetWidth;
        setContainerWidth(cw);
        const containerPadding = 40;
        const usableWidth = cw - containerPadding;
        const count = Math.max(MIN_ITEMS, Math.floor(usableWidth / 250));

        setItemsPerPage(count);
        setItemWidth(usableWidth / count);
        setPage(0);
      }
    };
    updateItems();
    window.addEventListener("resize", updateItems);
    return () => window.removeEventListener("resize", updateItems);
  }, []);

  const totalWidth = quizzes.length * itemWidth;
  const wrapperWidth = Math.max(totalWidth, containerWidth);
  const maxPage = Math.max(0, Math.ceil(quizzes.length / itemsPerPage) - 1);

  const handleNext = () => setPage((prev) => Math.min(prev + 1, maxPage));
  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));

  // ✅ Check login before navigating to gameplay
  const handleGoToGameplay = async (category) => {
    console.log('=== handleGoToGameplay Debug ===');
    console.log('Input params:', { category, isLoggedIn, userToken });
    
    // Check login first
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập trước khi tạo phòng");
      try {
        await initiateLogin();
      } catch (error) {
        console.error('Login initiation failed:', error);
      }
      return;
    }

    // Enhanced token retrieval with comprehensive checking
    let finalToken = userToken;
    
    console.log('Initial userToken from props:', finalToken);
    
    if (!finalToken) {
      console.warn('No userToken prop, trying fallback sources...');
      
      // Try localStorage
      finalToken = localStorage.getItem('userToken');
      console.log('localStorage token:', finalToken);
      
      // Try sessionStorage
      if (!finalToken) {
        finalToken = sessionStorage.getItem('userToken');
        console.log('sessionStorage token:', finalToken);
      }
      
      // Try cookies with multiple possible cookie names
      if (!finalToken) {
        const cookies = document.cookie.split('; ');
        console.log('All cookies:', cookies);
        
        // Try different possible cookie names
        const possibleCookieNames = ['token', 'access_token', 'auth_token', 'jwt'];
        for (const cookieName of possibleCookieNames) {
          const cookieToken = cookies.find(row => row.startsWith(`${cookieName}=`))?.split('=')[1];
          if (cookieToken) {
            finalToken = cookieToken;
            console.log(`Found token in cookie '${cookieName}':`, cookieToken);
            break;
          }
        }
      }
      
      // Try to get fresh session data
      if (!finalToken) {
        console.log('No token found, checking fresh session...');
        try {
          const sessionResult = await checkSession();
          console.log('Fresh session check result:', sessionResult);
          
          if (sessionResult.success) {
            finalToken = sessionResult.token || 
                        sessionResult.user?.token || 
                        sessionResult.access_token;
            
            if (finalToken) {
              console.log('Token retrieved from fresh session:', finalToken);
              // Store it for future use
              localStorage.setItem('userToken', finalToken);
              sessionStorage.setItem('userToken', finalToken);
            }
          }
        } catch (error) {
          console.error('Fresh session check failed:', error);
        }
      }
    }

    console.log('Final token to use:', finalToken);
    console.log('=================================');

    if (!finalToken) {
      console.error('No token found in any source');
      alert("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
      
      // Clear login state and force re-authentication
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
      
      try {
        await initiateLogin();
      } catch (error) {
        console.error('Login initiation failed:', error);
      }
      return;
    }

    console.log('Navigating to gameplay with token:', finalToken);
    
    navigate("/gameplay", {
      state: {
        category: category,
        isHost: true,
        token: finalToken,
      },
    });
  };

  const translateX = (() => {
    if (!containerRef.current) return 0;
    const maxTranslate = totalWidth - containerWidth + 15;
    let tx = page * itemsPerPage * itemWidth;
    return Math.min(tx, Math.max(0, maxTranslate));
  })();

  return (
    <div className="quiz-container-home" ref={containerRef}>
      <span className="quiz-container-home-title">{title}</span>

      <div
        className="quiz-wrapper"
        style={{
          width: `${wrapperWidth}px`,
          transform: `translateX(-${translateX}px)`,
          justifyContent:
            totalWidth < containerWidth ? "center" : "flex-start",
        }}
      >
        {quizzes.map((quiz, index) => (
          <div
            className="quiz-item"
            key={index}
            style={{ flex: `0 0 ${itemWidth}px` }}
          >
            <Card>
              <CustomCardActionArea4
                style={{ display: "flex", flexDirection: "column" }}
                onClick={() => handleGoToGameplay(title)}
              >
                <img src={quiz.img} alt={quiz.name} className="quiz-card-img" />
                <CardContent style={{ alignSelf: "flex-start" }}>
                  <h3>{quiz.name}</h3>
                </CardContent>
              </CustomCardActionArea4>

              <div className="quiz-other-info">
                <div className="quiz-author">
                  <img src={`${BASE_URL}image/author.png`} alt="author" />
                  <p>{quiz.author}</p>
                </div>
                <div className="quiz-star">
                  <p>5</p>
                  <img src={`${BASE_URL}image/starIcon.png`} alt="star" />
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {page > 0 && (
        <button className="nav-btn left" onClick={handlePrev}>
          <img src={`${BASE_URL}image/arrowLeft.png`} alt="Prev" />
        </button>
      )}
      {page < maxPage && (
        <button className="nav-btn right" onClick={handleNext}>
          <img src={`${BASE_URL}image/arrowRight.png`} alt="Next" />
        </button>
      )}
    </div>
  );
}

export default HomeContentItem;
