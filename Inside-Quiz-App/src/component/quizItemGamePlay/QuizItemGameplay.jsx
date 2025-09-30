import { useEffect, useState, useRef } from "react";
import "./QuizItemGameplay.css";
import Button from "@mui/material/Button";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function QuizItemGameplay({
  question = "What is the capital of France?",
  answers = ["Paris", "London", "Berlin", "Madrid"],
  image = `${import.meta.env.BASE_URL}image/quiz1.png`,
  correctIndex = 0,
  onSelectAnswer,
  type = "multiple_choice",
  answerFeedback = null, // true/false cho fill_in_the_blank
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(100);
  const [score, setScore] = useState(1000);
  const [canClick, setCanClick] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [disabledAll, setDisabledAll] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const timersRef = useRef([]);
  const progressIntervalRef = useRef(null);
  const hasAnsweredRef = useRef(false);

  // --- Hiển thị từng chữ của câu hỏi
  useEffect(() => {
    setDisplayedText("");
    setVisibleCount(0);
    setShowProgress(false);
    setProgress(100);
    setScore(1000);
    setCanClick(false);
    setActiveIndex(-1);
    setDisabledAll(false);
    setInputValue("");
    setInputDisabled(false);
    setIncorrectAnswers([]);
    setShowFeedback(false);
    hasAnsweredRef.current = false;

    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    for (let i = 0; i < question.length; i++) {
      const t = setTimeout(() => {
        setDisplayedText((prev) => prev + question.charAt(i));
      }, i * 50);
      timersRef.current.push(t);
    }

    // Hiển thị buttons
    const buttonsDelay = question.length * 50;
    if (type === "multiple_choice") {
      for (let k = 0; k < answers.length; k++) {
        const t = setTimeout(() => {
          setVisibleCount((prev) => Math.max(prev, k + 1));
        }, buttonsDelay + (k + 1) * 250);
        timersRef.current.push(t);
      }
    }

    // Show progress sau cùng
    const progressDelay = buttonsDelay + (type === "multiple_choice" ? answers.length * 250 : 0) + 500;
    const t2 = setTimeout(() => {
      setShowProgress(true);
      setCanClick(true);
    }, progressDelay);
    timersRef.current.push(t2);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [question, answers.length, type]);

  // --- Progress bar
  useEffect(() => {
    if (!showProgress) return;
    if (hasAnsweredRef.current) return;

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
        setCanClick(false);
        setDisabledAll(true);
      }
    }, duration / steps);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [showProgress]);

  // --- Chọn đáp án
  const handleSelect = (idx) => {
    if (!canClick || disabledAll) return;
    hasAnsweredRef.current = true;
    setActiveIndex(idx);
    setDisabledAll(true);
    setCanClick(false);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    onSelectAnswer && onSelectAnswer(idx);
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim() || !showProgress || inputDisabled) return;
    
    // Only show feedback state, don't add to incorrect answers yet
    setShowFeedback(true);
    onSelectAnswer && onSelectAnswer(inputValue.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setZoom(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // --- Cập nhật feedback cho fill_in_the_blank
  useEffect(() => {
    if (type === "fill_in_the_blank" && answerFeedback !== null && showFeedback) {
      if (answerFeedback === true) {
        setInputDisabled(true);
        hasAnsweredRef.current = true;
        // Dừng progress khi đúng
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else if (answerFeedback === false) {
        // Add incorrect answer to list only when we get feedback
        if (inputValue.trim() && !incorrectAnswers.includes(inputValue.trim())) {
          setIncorrectAnswers(prev => [...prev, inputValue.trim()]);
        }
        setInputDisabled(false);
        setInputValue(""); // Clear input for retry
        // Không dừng progress khi sai
      }
      
      // Auto hide feedback after animation
      setTimeout(() => {
        setShowFeedback(false);
      }, 500);
    }
  }, [answerFeedback, type, showFeedback]);

  return (
    <div className="quiz-container">
      <div className="quiz-left">
        <div className="quiz-question">{displayedText}</div>

        {type === "multiple_choice" ? (
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
                  <CheckCircleIcon
                    style={{
                      marginLeft: 8,
                      color: "white",
                      backgroundColor: "black",
                      borderRadius: "50%",
                      position: "absolute",
                      right: "-9px",
                    }}
                  />
                )}
              </Button>
            ))}
          </div>
        ) : (
          <div className="fill-blank-container">
            <div className={`input-wrapper ${answerFeedback === true ? 'correct' : answerFeedback === false ? 'incorrect' : ''}`}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={inputDisabled || !showProgress}
                placeholder="Nhập câu trả lời của bạn..."
                className="fill-blank-input"
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
            </div>
            <Button
              variant="contained"
              onClick={handleInputSubmit}
              disabled={inputDisabled || !inputValue.trim() || !showProgress}
              className="fill-blank-submit-btn"
            >
              Gửi đáp án
            </Button>
            
            <div className="feedback-container">
              {showFeedback && answerFeedback === true && (
                <div className="feedback success animate-success">
                  <div className="feedback-icon-wrapper">
                    <span className="feedback-icon success-icon">✓</span>
                    <div className="success-particles">
                      <div className="particle"></div>
                      <div className="particle"></div>
                      <div className="particle"></div>
                      <div className="particle"></div>
                    </div>
                  </div>
                  <span className="feedback-text">Chính xác! Tuyệt vời!</span>
                </div>
              )}
              {showFeedback && answerFeedback === false && (
                <div className="feedback error animate-error">
                  <div className="feedback-icon-wrapper">
                    <span className="feedback-icon error-icon">✗</span>
                    <div className="error-shake"></div>
                  </div>
                  <span className="feedback-text">Sai rồi, thử lại nhé!</span>
                </div>
              )}
            </div>

            {/* Display incorrect answers */}
            {type === "fill_in_the_blank" && incorrectAnswers.length > 0 && (
              <div className="incorrect-answers-container">
                <div className="incorrect-answers-title">Đáp án sai:</div>
                <div className="incorrect-answers-list">
                  {incorrectAnswers.map((answer, index) => (
                    <div 
                      key={index} 
                      className="incorrect-answer-item"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <span className="incorrect-icon">✗</span>
                      <span className="incorrect-text">{answer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showProgress && (
          <div className="quiz-progress">
            <div className="quiz-progress-bar" style={{ width: `${progress}%` }}></div>
            {/* <span className="quiz-score">{score}</span> */}
          </div>
        )}
      </div>

      <div className="quiz-right">
        <img src={image} alt="quiz" className={`quiz-image ${zoom ? "zoom" : ""}`} />
      </div>
    </div>
  );
}

