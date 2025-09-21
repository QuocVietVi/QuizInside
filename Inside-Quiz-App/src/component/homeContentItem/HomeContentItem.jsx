import { useState, useRef, useEffect } from "react";
import "./HomeContentItem.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import { CardActionArea, ListItem } from '@mui/material';
import { styled } from '@mui/material/styles';
const CustomCardActionArea4 = styled(CardActionArea)(({ theme }) => ({
    height: "150px",
    "&.Mui-focusVisible": {
        outline: "none",
    },
    "&:focus": {
        outline: "none",
    },
    '@media (max-width: 648px)': {
        height: "160px",
    },
    '@media (max-width: 648px)': {
    height: "100px", // mobile cũng auto
  },
}));
function HomeContentItem({ quizList, title }) {
    const quizzes = quizList || [];
    const containerRef = useRef(null);
    const [itemsPerPage, setItemsPerPage] = useState(3);
    const [page, setPage] = useState(0);
    const [itemWidth, setItemWidth] = useState(0);

    const MIN_ITEMS = 3;

    useEffect(() => {
        const updateItems = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const containerPadding = 40; // 10px left + 10px right
                const usableWidth = containerRef.current.offsetWidth - containerPadding;
                const count = Math.max(MIN_ITEMS, Math.floor(usableWidth / 250));
                setItemsPerPage(count);
                setItemWidth(usableWidth / count); // width mỗi item trừ padding container

                setPage(0);
            }
        };
        updateItems();
        window.addEventListener("resize", updateItems);
        return () => window.removeEventListener("resize", updateItems);
    }, []);

    const maxPage = Math.ceil(quizzes.length / itemsPerPage) - 1;

    const handleNext = () => setPage((prev) => Math.min(prev + 1, maxPage));
    const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));

    // Tính translateX, nếu page cuối chỉ scroll đủ item còn lại
    const translateX = (() => {
        const remainingItems = quizzes.length - page * itemsPerPage;
        if (remainingItems >= itemsPerPage) {
            return page * itemsPerPage * itemWidth;
        } else {
            // số item còn lại < itemsPerPage → scroll vừa đủ
            return (quizzes.length - itemsPerPage) * itemWidth;
        }
    })();

    return (
        <div className="quiz-container" ref={containerRef}>
            <span className="quiz-container-title">{title}</span>

            <div
                className="quiz-wrapper"
                style={{
                    width: `${quizzes.length * itemWidth}px`,
                    transform: `translateX(-${translateX}px)`,
                }}
            >
                {quizzes.map((quiz, index) => (
                    <div
                        className="quiz-item"
                        key={index}
                        style={{ flex: `0 0 ${itemWidth}px` }}
                    >
                        <Card>

                            <CustomCardActionArea4 style={{ display: "flex", flexDirection: "column" }}>
                                <img
                                    src={quiz.img}
                                    alt={quiz.name}
                                    className="quiz-card-img"

                                    
                                />
                                <CardContent style={{ alignSelf: 'flex-start' }}>
                                    <h3>{quiz.name}</h3>
                                </CardContent>

                            </CustomCardActionArea4>
                            <div className="quiz-other-info">
                                <div className="quiz-author">
                                    <img src="/image/author.png" alt="" />
                                    <p>{quiz.author}</p>
                                </div>
                                <div className="quiz-star">
                                        <p>5</p>
                                        <img src="/image/starIcon.png" alt="" />
                                    </div>
                            </div>

                        </Card>
                    </div>
                ))}
            </div>

            {page > 0 && (
                <button className="nav-btn left" onClick={handlePrev}>
                    <img src="/image/arrowLeft.png" alt="Prev" />
                </button>
            )}
            {page < maxPage && (
                <button className="nav-btn right" onClick={handleNext}>
                    <img src="/image/arrowRight.png" alt="Next" />
                </button>
            )}

        </div>
    );
}

export default HomeContentItem;
