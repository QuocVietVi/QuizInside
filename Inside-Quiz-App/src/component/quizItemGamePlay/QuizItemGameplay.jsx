import { useEffect, useRef, useState } from "react";
import "./QuizItemGameplay.css";
import Button from "@mui/material/Button";

const BASE_URL = "/assets/"; // đổi path này theo project của bạn

export default function QuizItemGameplay({
    question = "What is the capital of France?",
    answers = ["Paris", "London", "Berlin", "Madrid"],
    image = `${import.meta.env.BASE_URL}image/quiz1.png`,
}) {
    const [displayedText, setDisplayedText] = useState("");
    const [visibleCount, setVisibleCount] = useState(0); // số button đã hiện
    const [showProgress, setShowProgress] = useState(false);
    const [progress, setProgress] = useState(100); // %
    const [score, setScore] = useState(1000);
    const [canClick, setCanClick] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const timersRef = useRef([]); // lưu các timeout để clear khi unmount / rerun
    const progressIntervalRef = useRef(null);

    // typing effect -> sau đó show button lần lượt -> sau khi hết chờ 1s -> show progress & allow click
    useEffect(() => {
        // reset states & clear previous timers/intervals
        setDisplayedText("");
        setVisibleCount(0);
        setShowProgress(false);
        setProgress(100);
        setScore(1000);
        setCanClick(false);
        setActiveIndex(-1);
        timersRef.current.forEach((t) => clearTimeout(t));
        timersRef.current = [];
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < question.length) {
                setDisplayedText((prev) => prev + question.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);

                // Show buttons sequentially using setTimeout (an toàn, không off-by-one)
                const perBtnDelay = 250; // thời gian giữa mỗi button (ms) — bạn chỉnh được
                for (let k = 0; k < answers.length; k++) {
                    const t = setTimeout(() => {
                        // đặt visibleCount = k+1 (bảo đảm tăng dần và có đủ nút)
                        setVisibleCount((prev) => Math.max(prev, k + 1));
                    }, (k + 1) * perBtnDelay);
                    timersRef.current.push(t);
                }

                // Sau khi hiện hết button -> chờ 1s -> show progress & allow click
                const afterButtons = answers.length * perBtnDelay + 1000;
                const t2 = setTimeout(() => {
                    setShowProgress(true);
                    setCanClick(true); // theo yêu cầu: khi progress hiện thì button có thể bấm được
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

    // Khi progress hiện -> chờ 0.5s -> start chạy progress
    useEffect(() => {
        if (!showProgress) return;

        const startDelay = setTimeout(() => {
            const duration = 10000; // 10s tổng
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
        }, 500); // 0.5s chờ trước khi bắt đầu chạy

        timersRef.current.push(startDelay);
        return () => {
            clearTimeout(startDelay);
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, [showProgress]);

    const [zoom, setZoom] = useState(false);

    useEffect(() => {
        // Delay 100ms để đảm bảo transition hoạt động
        const timer = setTimeout(() => setZoom(true), 100);
        return () => clearTimeout(timer);
    }, []);
    return (
        <div className="quiz-container">
            {/* Bên trái */}
            <div className="quiz-left">
                <div className="quiz-question">{displayedText}</div>

                <div className="quiz-answers">
                    {answers.map((ans, idx) => (
                        <Button
                            key={idx}
                            className={`quiz-btn btn-${idx} ${visibleCount > idx ? "show" : ""} ${activeIndex === idx ? "active" : ""
                                }`}
                            disabled={!canClick}
                            onClick={() => setActiveIndex(idx)}
                        >
                            {ans}
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

            {/* Bên phải */}
            <div className="quiz-right">
                <img src={image} alt="quiz" className={`quiz-image ${zoom ? "zoom" : ""}`} />
            </div>
        </div>
    );
}
