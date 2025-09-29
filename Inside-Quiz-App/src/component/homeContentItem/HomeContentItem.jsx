import { useState, useRef, useEffect } from "react";
import "./HomeContentItem.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

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

function HomeContentItem({ quizList, title }) {
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

  // ✅ Navigate sang gameplay, truyền title làm category và đánh dấu là host
  const handleGoToGameplay = (category) => {
    navigate("/gameplay", {
      state: {
        category: category,
        isHost: true, // đánh dấu là host khi tạo room từ home
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
