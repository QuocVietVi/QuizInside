import React, { useState, useEffect } from 'react';
import { Button, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import ApiService from '../../services/api';
import WebSocketService from '../../services/websocket';
import './QuizGame.css';

const QuizGame = () => {
    const [screen, setScreen] = useState('main'); // main, waiting, question, leaderboard
    const [token, setToken] = useState(localStorage.getItem('userToken') || '');
    const [playerStats, setPlayerStats] = useState({ total_score: 0, is_admin: false });
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [roomId, setRoomId] = useState('');
    const [players, setPlayers] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'error' });

    useEffect(() => {
        if (token) {
            ApiService.setToken(token);
            loadInitialData();
        }
    }, [token]);

    useEffect(() => {
        // WebSocket event listeners
        WebSocketService.on('update_players', handleUpdatePlayers);
        WebSocketService.on('question', handleNewQuestion);
        WebSocketService.on('results', handleResults);
        WebSocketService.on('game_over', handleGameOver);
        WebSocketService.on('answer_feedback', handleAnswerFeedback);
        WebSocketService.on('disconnected', handleDisconnected);

        return () => {
            WebSocketService.off('update_players', handleUpdatePlayers);
            WebSocketService.off('question', handleNewQuestion);
            WebSocketService.off('results', handleResults);
            WebSocketService.off('game_over', handleGameOver);
            WebSocketService.off('answer_feedback', handleAnswerFeedback);
            WebSocketService.off('disconnected', handleDisconnected);
        };
    }, []);

    const loadInitialData = async () => {
        try {
            const [stats, cats] = await Promise.all([
                ApiService.getPlayerStats(),
                ApiService.getCategories()
            ]);
            setPlayerStats(stats);
            setCategories(cats);
        } catch (error) {
            showAlert(error.message);
        }
    };

    const showAlert = (message, type = 'error') => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: 'error' }), 3000);
    };

    const handleCreateRoom = async () => {
        if (!selectedCategory) {
            showAlert('Vui lòng chọn một chủ đề');
            return;
        }
        
        setLoading(true);
        try {
            const response = await ApiService.createRoom(selectedCategory);
            setIsHost(true);
            setRoomId(response.room_id);
            WebSocketService.connect(response.room_id, token);
            setScreen('waiting');
        } catch (error) {
            showAlert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomId) {
            showAlert('Vui lòng nhập mã phòng');
            return;
        }
        
        setLoading(true);
        try {
            const response = await ApiService.joinRoom(roomId);
            WebSocketService.connect(response.room_id, token);
            setScreen('waiting');
        } catch (error) {
            showAlert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartGame = async () => {
        setLoading(true);
        try {
            await ApiService.startGame(roomId);
        } catch (error) {
            showAlert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // WebSocket event handlers
    const handleUpdatePlayers = (payload) => {
        setPlayers(payload.players);
    };

    const handleNewQuestion = (payload) => {
        setCurrentQuestion(payload.question);
        setQuestionIndex(payload.current_q);
        setTotalQuestions(payload.total_q);
        setTimeLeft(10);
        setScreen('question');
        
        // Start countdown
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResults = (results) => {
        setLeaderboard(results.leaderboard);
        setTimeout(() => setScreen('leaderboard'), 3000);
    };

    const handleGameOver = (payload) => {
        setLeaderboard(payload.leaderboard);
        setScreen('leaderboard');
    };

    const handleAnswerFeedback = (payload) => {
        if (payload.correct) {
            showAlert('Chính xác!', 'success');
        } else {
            showAlert('Sai rồi, thử lại nhé!');
        }
    };

    const handleDisconnected = () => {
        if (screen !== 'leaderboard') {
            showAlert('Mất kết nối với phòng');
            setScreen('main');
        }
    };

    const handleAnswer = (answer) => {
        WebSocketService.sendAnswer(answer);
    };

    const renderMainScreen = () => (
        <div className="quiz-main-screen">
            <h1>Quiz Game Vui Vẻ</h1>
            <p>Điểm của bạn: {playerStats.total_score}</p>
            
            <TextField
                label="Token của bạn"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                fullWidth
                margin="normal"
            />
            
            <TextField
                select
                label="Chọn chủ đề"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                fullWidth
                margin="normal"
            >
                {categories.map((cat) => (
                    <MenuItem key={cat.name} value={cat.name}>
                        {cat.name}
                    </MenuItem>
                ))}
            </TextField>
            
            <Button 
                variant="contained" 
                onClick={handleCreateRoom}
                disabled={loading || !token}
                fullWidth
                sx={{ mt: 2 }}
            >
                Tạo phòng mới
            </Button>
            
            <TextField
                label="Mã phòng"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                fullWidth
                margin="normal"
            />
            
            <Button 
                variant="outlined" 
                onClick={handleJoinRoom}
                disabled={loading || !token}
                fullWidth
                sx={{ mt: 1 }}
            >
                Tham gia phòng
            </Button>
        </div>
    );

    const renderWaitingScreen = () => (
        <div className="quiz-waiting-screen">
            <h2>Mã phòng: {roomId}</h2>
            <p>Số người chơi: {players.length}</p>
            <div className="players-list">
                {players.map(player => (
                    <div key={player.id} className="player-item">
                        {player.nickname}
                    </div>
                ))}
            </div>
            {isHost && (
                <Button 
                    variant="contained" 
                    onClick={handleStartGame}
                    disabled={loading || players.length < 1}
                    sx={{ mt: 2 }}
                >
                    Bắt đầu trò chơi
                </Button>
            )}
        </div>
    );

    const renderQuestionScreen = () => (
        <div className="quiz-question-screen">
            <div className="question-header">
                <span>Câu {questionIndex + 1} / {totalQuestions}</span>
                <span>Thời gian: {timeLeft}s</span>
            </div>
            
            <h2>{currentQuestion?.text}</h2>
            
            {currentQuestion?.image && (
                <img src={currentQuestion.image} alt="Question" className="question-image" />
            )}
            
            <div className="options-container">
                {currentQuestion?.type === 'multiple_choice' && 
                    currentQuestion.options.map((option, index) => (
                        <Button
                            key={index}
                            variant="outlined"
                            onClick={() => handleAnswer({ answer_id: index })}
                            className="option-button"
                        >
                            {option}
                        </Button>
                    ))
                }
                
                {currentQuestion?.type === 'fill_in_the_blank' && (
                    <div className="fill-blank-container">
                        <TextField
                            placeholder="Nhập câu trả lời..."
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAnswer({ answer_text: e.target.value });
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={(e) => {
                                const input = e.target.parentElement.querySelector('input');
                                handleAnswer({ answer_text: input.value });
                            }}
                        >
                            Gửi câu trả lời
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderLeaderboardScreen = () => (
        <div className="quiz-leaderboard-screen">
            <h2>Bảng xếp hạng</h2>
            <div className="leaderboard-list">
                {leaderboard.map((player, index) => (
                    <div key={index} className="leaderboard-item">
                        <span>#{index + 1} {player.nickname}</span>
                        <span>{player.score} điểm</span>
                    </div>
                ))}
            </div>
            <Button 
                variant="contained" 
                onClick={() => setScreen('main')}
                sx={{ mt: 2 }}
            >
                Về màn hình chính
            </Button>
        </div>
    );

    return (
        <div className="quiz-game">
            {loading && <CircularProgress className="loading-spinner" />}
            
            {alert.show && (
                <Alert severity={alert.type} className="alert-message">
                    {alert.message}
                </Alert>
            )}
            
            {screen === 'main' && renderMainScreen()}
            {screen === 'waiting' && renderWaitingScreen()}
            {screen === 'question' && renderQuestionScreen()}
            {screen === 'leaderboard' && renderLeaderboardScreen()}
        </div>
    );
};

export default QuizGame;
