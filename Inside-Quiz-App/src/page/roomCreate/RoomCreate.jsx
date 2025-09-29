import { useState, useEffect } from "react";
import "./RoomCreate.css";
import Link from '@mui/material/Link';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from '@mui/icons-material/Link';
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";

const CustomerLink = styled(Link)(({ theme }) => ({
    color: "rgb(255, 235, 216)",
    '&:hover': {
        color: "rgb(255, 153, 57)",
        textDecoration: "underline",
    },
}));

export default function RoomCreate({ 
    roomCode, 
    players, 
    onStart, 
    category = "Công nghệ", 
    isHost = true, 
    currentUserId = null 
}) {
    const [copied, setCopied] = useState(false);
    const [dots, setDots] = useState("");

    // Animation cho loading dots
    useEffect(() => {
        if (!isHost) {
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev === "...") return "";
                    return prev + ".";
                });
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isHost]);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // Tìm host (player đầu tiên trong danh sách thường là host)
    const hostPlayer = players[0];

    return (
        <div className="main-content">
            <div className="gameplay-box">
                <div className="gameplay-header">
                    <div className="header-left">
                        <img src={`${import.meta.env.BASE_URL}logo/logo2.png`} alt="Logo" className="logo" />
                        <img src={`${import.meta.env.BASE_URL}logo/logo.png`} alt="Logo" className="logo2" />
                    </div>

                    <div className="header-center">
                        <span className="room-code">{roomCode}</span>
                        <div className="copy-content">
                            <div onClick={copyRoomCode} className="copy-btn" >
                                <ContentCopyIcon style={{ fontSize: "18px", marginRight: "5px" }} />
                                <CustomerLink href="#" underline="hover">
                                    {copied ? "Pin copied" : "Copy Pin"}
                                </CustomerLink>
                            </div>
                            <div onClick={copyRoomCode} className="copy-btn" >
                                <LinkIcon style={{ fontSize: "18px", marginRight: "5px" }} />
                                <CustomerLink href="#" underline="hover">
                                    {'Copy Link'}
                                </CustomerLink>
                            </div>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="info-box">
                            <div className="quiz-text">
                                <div className="category-container">
                                    <h2 className="quiz-name">{category}</h2>
                                </div>
                                <p className="quiz-questions">Số lượng câu hỏi: 10</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="box-content">
                    <p>{players.length} trên 100 người:</p>
                    <div className="players-container">
                        <div className="players-list">
                            {players.map((player, index) => {
                                const isCurrentUser = currentUserId && player.id === currentUserId;
                                const isHostPlayer = index === 0; // Giả sử player đầu tiên là host
                                
                                return (
                                    <div key={player.id} className="player">
                                        {/* Hiển thị frame dựa trên role */}
                                        {(isHostPlayer || isCurrentUser) ? (
                                            <>
                                                <img 
                                                    src={`${import.meta.env.BASE_URL}image/avaFrameText.png`} 
                                                    className="avatarFrame" 
                                                />
                                                <span className="frame-text">
                                                    {isHostPlayer ? "HOST" : "ME"}
                                                </span>
                                            </>
                                        ) : (
                                            <img 
                                                src={`${import.meta.env.BASE_URL}image/avaFrame.png`} 
                                                className="avatarFrame" 
                                            />
                                        )}
                                        
                                        <img src={player.avatar} alt={player.name} className="avatar" />
                                        <span className="player-name">{player.nickname}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="start-btn-container">
                        <Button
                            variant="contained"
                            sx={{
                                borderRadius: "20px",
                                fontWeight: 700,
                                fontSize: "16px",
                                width: "290px",
                                textTransform: "none",
                                color: isHost ? "black" : "#666",
                                backgroundColor: isHost ? "#91d9bf" : "#ccc",
                                "&:hover": { 
                                    backgroundColor: isHost ? "#81c8af" : "#ccc"
                                },
                                "&.Mui-focusVisible": { outline: "none" },
                                "&:focus": { outline: "none" },
                                cursor: isHost ? "pointer" : "not-allowed"
                            }}
                            onClick={isHost ? onStart : undefined}
                            disabled={!isHost}
                        >
                            {isHost ? "Start Game" : `Đợi chủ phòng${dots}`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
