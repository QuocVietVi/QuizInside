import { useState, useEffect } from "react";
import "./Gameplay.css";
import Link from '@mui/material/Link';
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap';
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import RoomCreate from "../roomCreate/RoomCreate";
import QuizItemGameplay from "../../component/quizItemGamePlay/QuizItemGameplay";
import LeaderBoardGamePlay from "../../component/leaderBoardGamePlay/LeaderBoardGamePlay";


const CustomerLink = styled(Link)(({ theme }) => ({
    color: "rgb(255, 235, 216)",
    '&:hover': {
        color: "rgb(255, 153, 57)",
    },
}));
export default function Gameplay() {
    const [roomCode] = useState("123 456");
    const [players] = useState([
        { id: 1, name: "Quoc Viet Vi", avatar: "https://i.pravatar.cc/50?img=1" },
        { id: 2, name: "Viet dep zai", avatar: "https://i.pravatar.cc/50?img=2" },
        { id: 3, name: "Viet Vi", avatar: "https://i.pravatar.cc/50?img=3" },
        { id: 4, name: "Quoc Viet Vi 2", avatar: "https://i.pravatar.cc/50?img=4" },
        { id: 5, name: "Vi Quoc Zit", avatar: "https://i.pravatar.cc/50?img=5" },
        { id: 6, name: "Dep Trai 102", avatar: "https://i.pravatar.cc/50?img=6" },

        { id: 7, name: "Quoc Viet Vi", avatar: "https://i.pravatar.cc/50?img=7" },
        { id: 8, name: "Viet dep zai", avatar: "https://i.pravatar.cc/50?img=8" },
        { id: 9, name: "Viet Vi", avatar: "https://i.pravatar.cc/50?img=9" },
        { id: 10, name: "Vi Quoc Zit", avatar: "https://i.pravatar.cc/50?img=10" },
        { id: 11, name: "Dep Trai 102", avatar: "https://i.pravatar.cc/50?img=11" },
        { id: 12, name: "Quoc Viet Vi 2", avatar: "https://i.pravatar.cc/50?img=12" },

        { id: 13, name: "Viet dep zai", avatar: "https://i.pravatar.cc/50?img=13" },
        { id: 14, name: "Viet Vi", avatar: "https://i.pravatar.cc/50?img=14" },
        { id: 15, name: "Quoc Viet Vi", avatar: "https://i.pravatar.cc/50?img=15" },
        { id: 16, name: "Vi Quoc Zit", avatar: "https://i.pravatar.cc/50?img=16" },
        { id: 17, name: "Dep Trai 102", avatar: "https://i.pravatar.cc/50?img=17" },
        { id: 18, name: "Quoc Viet Vi 2", avatar: "https://i.pravatar.cc/50?img=18" },

        { id: 19, name: "Viet dep zai", avatar: "https://i.pravatar.cc/50?img=19" },
        { id: 20, name: "Viet Vi", avatar: "https://i.pravatar.cc/50?img=20" },
        { id: 21, name: "Quoc Viet Vi", avatar: "https://i.pravatar.cc/50?img=21" },
        { id: 22, name: "Vi Quoc Zit", avatar: "https://i.pravatar.cc/50?img=22" },
        { id: 23, name: "Dep Trai 102", avatar: "https://i.pravatar.cc/50?img=23" },
        { id: 24, name: "Quoc Viet Vi 2", avatar: "https://i.pravatar.cc/50?img=24" },

        { id: 25, name: "Viet dep zai", avatar: "https://i.pravatar.cc/50?img=25" },
        { id: 26, name: "Viet Vi", avatar: "https://i.pravatar.cc/50?img=26" },
        { id: 27, name: "Quoc Viet Vi", avatar: "https://i.pravatar.cc/50?img=27" },
        { id: 28, name: "Vi Quoc Zit", avatar: "https://i.pravatar.cc/50?img=28" },
        { id: 29, name: "Dep Trai 102", avatar: "https://i.pravatar.cc/50?img=29" },
        { id: 30, name: "Quoc Viet Vi 2", avatar: "https://i.pravatar.cc/50?img=30" },


    ]);
    const questions = [
        {
            question: "What is the capital of France?",
            answers: ["Paris", "London", "Berlin", "Madrid"],
            correctIndex: 0,
            image: `${import.meta.env.BASE_URL}image/quiz1.png`,
        },
        {
            question: "Which planet is known as the Red Planet?",
            answers: ["Earth", "Mars", "Venus", "Jupiter"],
            correctIndex: 1,
            image: `${import.meta.env.BASE_URL}image/quiz2.png`,
        },
        {
            question: "Who painted the Mona Lisa?",
            answers: ["Da Vinci", "Picasso", "Van Gogh", "Michelangelo"],
            correctIndex: 0,
            image: `${import.meta.env.BASE_URL}image/quiz3.png`,
        },
    ];
    const [gameStarted, setGameStarted] = useState(false); // mới

    // Hàm truyền xuống RoomCreate
    const handleStartGame = () => {
        setGameStarted(true);
    };
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Lưu state quiz
    const [currentQuizIndex, setCurrentQuizIndex] = useState(
        parseInt(localStorage.getItem("currentQuizIndex")) || 0
    );
    const [selectedAnswers, setSelectedAnswers] = useState(
        JSON.parse(localStorage.getItem("selectedAnswers")) || {}
    );
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleChange);
        return () => document.removeEventListener("fullscreenchange", handleChange);
    }, []);

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Khi quiz thay đổi, lưu localStorage
    useEffect(() => {
        localStorage.setItem("currentQuizIndex", currentQuizIndex);
        localStorage.setItem("selectedAnswers", JSON.stringify(selectedAnswers));
    }, [currentQuizIndex, selectedAnswers]);

    const handleAnswer = (playerId, answerIdx) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentQuizIndex]: { ...prev[currentQuizIndex], [playerId]: answerIdx },
        }));

        // giả lập allAnswered sau 3s
        setTimeout(() => {
            const allAnswered = true;
            if (allAnswered) {
                setShowLeaderboard(true);
                setTimeout(() => {
                    setShowLeaderboard(false);
                    if (currentQuizIndex + 1 < questions.length) {
                        setCurrentQuizIndex(currentQuizIndex + 1);
                    } else {
                        // quiz cuối cùng xong
                        console.log("All quizzes done!");
                    }
                }, 3000); // hiển thị leaderboard 3s
            }
        }, 3000);
    };

    return (
        <div className="gameplay">
            {/* HEADER */}
            <header className="header">
                <div className="header-left">
                    <img src={`${import.meta.env.BASE_URL}logo/logo.png`} alt="Logo" className="logo" />
                    <span className="room-code">PIN: {roomCode}</span>
                    <img className="userIcon" src={`${import.meta.env.BASE_URL}icon/userIcon.png`} alt="" />
                    <span className="player-count">{players.length}</span>
                </div>

                <div className="header-right">
                    <button onClick={toggleFullscreen} className="zoom-btn">
                        {isFullscreen ? <ZoomInMapIcon /> : <ZoomOutMapIcon />}
                    </button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            localStorage.clear(); // hoặc localStorage.removeItem("quizState")
                            window.location.reload(); // reload để reset lại state
                        }}
                    >
                        Clear Storage
                    </Button>
                </div>
            </header>

            {!gameStarted ? (
                <RoomCreate
                    roomCode={roomCode}
                    players={players}
                    onStart={handleStartGame} // truyền hàm start
                />
            ) : !showLeaderboard ? (
                <QuizItemGameplay
                    key={currentQuizIndex}
                    question={questions[currentQuizIndex].question}
                    answers={questions[currentQuizIndex].answers}
                    image={questions[currentQuizIndex].image}
                    correctIndex={questions[currentQuizIndex].correctIndex}
                    selectedAnswer={selectedAnswers[currentQuizIndex]?.[1] ?? null}
                    onSelectAnswer={(idx) => handleAnswer(1, idx)}
                />
            ) : (
                <LeaderBoardGamePlay />
            )}
        </div>
    );
}