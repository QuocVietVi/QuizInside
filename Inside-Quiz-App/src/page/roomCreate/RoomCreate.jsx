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
    isHost: initialIsHost = true, 
    currentUserId = null,
    hostId = null
}) {
    const [copied, setCopied] = useState(false);
    const [dots, setDots] = useState("");
    
    // Debug logging
    console.log('RoomCreate Debug:', {
        currentUserId,
        hostId,
        initialIsHost,
        players: players.map(p => ({ id: p.id, nickname: p.nickname }))
    });
    
    // Determine if current user is host with multiple fallback strategies
    let isCurrentUserHost = false;
    
    if (hostId && currentUserId) {
        // Try direct ID comparison first
        isCurrentUserHost = currentUserId === hostId;
        
        // If that fails, try to find the current user in players and compare their ID with hostId
        if (!isCurrentUserHost) {
            const currentUserPlayer = players.find(p => 
                p.id === currentUserId || String(p.id) === String(currentUserId)
            );
            if (currentUserPlayer) {
                isCurrentUserHost = currentUserPlayer.id === hostId || String(currentUserPlayer.id) === String(hostId);
            }
        }
        
        console.log('Host check result:', isCurrentUserHost, 'currentUserId:', currentUserId, 'hostId:', hostId);
    } else {
        // Fallback to initial isHost if no hostId or currentUserId available yet
        isCurrentUserHost = initialIsHost;
        console.log('Using fallback isHost:', initialIsHost);
    }

    // Animation cho loading dots
    useEffect(() => {
        if (!isCurrentUserHost) {
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev === "...") return "";
                    return prev + ".";
                });
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isCurrentUserHost]);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

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
                            {players.map((player) => {
                                const isCurrentUser = currentUserId && (
                                    String(player.id) === String(currentUserId)
                                );
                                const isHostPlayer = hostId ? String(player.id) === String(hostId) : false;
                                
                                return (
                                    <div key={player.id} className="player">
                                        {/* Hiển thị frame dựa trên role */}
                                        {isHostPlayer ? (
                                            <>
                                                <img 
                                                    src={`${import.meta.env.BASE_URL}image/avaFrameText.png`} 
                                                    className="avatarFrame" 
                                                />
                                                <span className="frame-text">HOST</span>
                                            </>
                                        ) : isCurrentUser ? (
                                            <>
                                                <img 
                                                    src={`${import.meta.env.BASE_URL}image/avaFrameText.png`} 
                                                    className="avatarFrame" 
                                                />
                                                <span className="frame-text">ME</span>
                                            </>
                                        ) : (
                                            <img 
                                                src={`${import.meta.env.BASE_URL}image/avaFrame.png`} 
                                                className="avatarFrame" 
                                            />
                                        )}
                                        
                                        <img src={player.avatar} alt={player.nickname} className="avatar" />
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
                                color: isCurrentUserHost ? "black" : "#666",
                                backgroundColor: isCurrentUserHost ? "#91d9bf" : "#ccc",
                                "&:hover": { 
                                    backgroundColor: isCurrentUserHost ? "#81c8af" : "#ccc"
                                },
                                "&.Mui-focusVisible": { outline: "none" },
                                "&:focus": { outline: "none" },
                                cursor: isCurrentUserHost ? "pointer" : "not-allowed"
                            }}
                            onClick={isCurrentUserHost ? onStart : undefined}
                            disabled={!isCurrentUserHost}
                        >
                            {isCurrentUserHost ? "Start Game" : `Đợi chủ phòng${dots}`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

