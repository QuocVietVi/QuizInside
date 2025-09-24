import { useEffect, useRef, useState } from "react";
import "./QuizItemGameplay.css";
import Button from "@mui/material/Button";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function QuizItemGameplay({
    question = "What is the capital of France?",
    answers = ["Paris", "London", "Berlin", "Madrid"],
    image = `${import.meta.env.BASE_URL}image/quiz1.png`,
    correctIndex = 0,
    selectedAnswer = null, // từ localStorage/props
    onSelectAnswer,
}) {
    const [displayedText, setDisplayedText] = useState("");
    const [visibleCount, setVisibleCount] = useState(0);
    const [showProgress, setShowProgress] = useState(false);
    const [progress, setProgress] = useState(100);
    const [score, setScore] = useState(1000);
    const [canClick, setCanClick] = useState(false);
    const [activeIndex, setActiveIndex] = useState(selectedAnswer ?? -1);
    const [disabledAll, setDisabledAll] = useState(selectedAnswer !== null);

    const timersRef = useRef([]);
    const progressIntervalRef = useRef(null);

    useEffect(() => {
        setDisplayedText("");
        setVisibleCount(0);
        setShowProgress(false);
        setProgress(100);
        setScore(1000);
        setCanClick(selectedAnswer === null);
        setActiveIndex(selectedAnswer ?? -1);
        setDisabledAll(selectedAnswer !== null);

        timersRef.current.forEach((t) => clearTimeout(t));
        timersRef.current = [];
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        let i = -1;
        const typingInterval = setInterval(() => {
            if (i < question.length) {
                setDisplayedText((prev) => prev + question.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);

                const perBtnDelay = 250;
                for (let k = 0; k < answers.length; k++) {
                    const t = setTimeout(() => {
                        setVisibleCount((prev) => Math.max(prev, k + 1));
                    }, (k + 1) * perBtnDelay);
                    timersRef.current.push(t);
                }

                const afterButtons = answers.length * perBtnDelay + 1000;
                const t2 = setTimeout(() => {
                    setShowProgress(true);
                    if (selectedAnswer === null) setCanClick(true);
                }, afterButtons);
                timersRef.current.push(t2);
            }
        }, 50);

        return () => {
            clearInterval(typingInterval);
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, [question, answers.length]);

    useEffect(() => {
        if (!showProgress) return;

        const startDelay = setTimeout(() => {
            const duration = 10000;
            const steps = 100;
            let current = 0;
            progressIntervalRef.current = setInterval(() => {
                current++;
                const newProgress = 100 - (current / steps) * 100;
                setProgress(newProgress);
                setScore(Math.max(0, 1000 - Math.floor((current / steps) * 1000)));
                if (current >= steps) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                }
            }, duration / steps);
        }, 500);

        timersRef.current.push(startDelay);
        return () => {
            clearTimeout(startDelay);
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, [showProgress]);

    const handleSelect = (idx) => {
        if (!canClick || disabledAll) return;
        setActiveIndex(idx);
        setDisabledAll(true);
        setCanClick(false);
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        onSelectAnswer && onSelectAnswer(idx);
    };

    const [zoom, setZoom] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setZoom(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="quiz-container">
            <div className="quiz-left">
                <div className="quiz-question">{displayedText}</div>

                <div className="quiz-answers">
                    {answers.map((ans, idx) => (
                        <Button
                            key={idx}
                            className={`quiz-btn btn-${idx} 
                                ${visibleCount > idx ? "show" : ""} 
                                ${activeIndex === idx ? "active" : ""} 
                                ${disabledAll && activeIndex !== idx ? "dim" : ""}`}
                            disabled={!canClick || disabledAll}
                            onClick={() => handleSelect(idx)}
                        >
                            {ans}
                            {disabledAll && idx === correctIndex && (
                                <CheckCircleIcon style={{ marginLeft: 8, color: "white", backgroundColor: "black", borderRadius: "50%", position: "absolute", right: "-9px" }} />
                            )}
                        </Button>
                    ))}
                </div>

                {showProgress && (
                    <div className="quiz-progress">
                        <div
                            className="quiz-progress-bar"
                            style={{ width: `${progress}%` }}
                        ></div>
                        <span className="quiz-score">{score}</span>
                    </div>
                )}
            </div>

            <div className="quiz-right">
                <img src={image} alt="quiz" className={`quiz-image ${zoom ? "zoom" : ""}`} />
            </div>
        </div>
    );
}
