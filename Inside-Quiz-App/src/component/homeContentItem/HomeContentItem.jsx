import { useState, useRef, useEffect } from "react";
import "./HomeContentItem.css";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";

const CustomCardActionArea4 = styled(CardActionArea)(({ theme }) => ({
    height: "150px",
    "&.Mui-focusVisible": {
        outline: "none",
    },
    "&:focus": {
        outline: "none",
    },
    "@media (max-width: 648px)": {
        height: "100px", // mobile
    },
}));

function HomeContentItem({ quizList, title }) {
    const BASE_URL = import.meta.env.BASE_URL; // dùng BASE_URL để deploy GitHub Pages
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
                const containerPadding = 40;
                const usableWidth = containerWidth - containerPadding;
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

    const maxPage = Math.ceil(quizzes.length / itemsPerPage) - 1;

    const handleNext = () => setPage((prev) => Math.min(prev + 1, maxPage));
    const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));

    const translateX = (() => {
        const remainingItems = quizzes.length - page * itemsPerPage;
        if (remainingItems >= itemsPerPage) {
            return page * itemsPerPage * itemWidth;
        } else {
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
                            <CustomCardActionArea4
                                style={{ display: "flex", flexDirection: "column" }}
                            >
                                <img
                                    src={quiz.img}
                                    alt={quiz.name}
                                    className="quiz-card-img"
                                />
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
