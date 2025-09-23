import { useState } from "react";
import "./RoomCreate.css";
import Link from '@mui/material/Link';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";

const CustomerLink = styled(Link)(({ theme }) => ({
    color: "rgb(255, 235, 216)",
    '&:hover': {
        color: "rgb(255, 153, 57)",
        textDecoration: "underline",
    },
}));

export default function RoomCreate({ roomCode, players }) {
    const [copied, setCopied] = useState(false);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // Reset sau 1.5s
    };

    return (
            <div className="main-content">
                {/* BOX GAMEPLAY */}
                <div className="gameplay-box">
                    <div className="gameplay-header">
                        {/* Left: Logo */}
                        <div className="header-left">
                            <img
                                src={`${import.meta.env.BASE_URL}logo/logo2.png`}
                                alt="Logo"
                                className="logo"
                            />
                            <img
                                src={`${import.meta.env.BASE_URL}logo/logo.png`}
                                alt="Logo"
                                className="logo2"
                            />
                        </div>

                        {/* Center: Room code + Copy button */}
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

                        {/* Right: Info */}
                        <div className="header-right">
                            <div className="info-box">
                                <img
                                    src={`${import.meta.env.BASE_URL}image/quiz1.png`}
                                    alt="Quiz"
                                    className="quiz-img"
                                />
                                <div className="quiz-text">
                                    <h2 className="quiz-name">Lịch sử Meo Meo</h2>
                                    <p className="quiz-questions">Số lượng câu hỏi: 20</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="box-content">
                        <p>{players.length} trên 100 người:</p>
                        <div className="players-container">
                            <div className="players-list">
                                {players.map(player => (
                                    <div key={player.id} className="player">
                                        <img src={player.avatar} alt={player.name} className="avatar" />
                                        <span className="player-name">{player.name}</span>
                                    </div>
                                ))}
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
                                    color: "black",
                                    backgroundColor: "#91d9bf",
                                    "&:hover": {
                                        backgroundColor: "#81c8af",
                                    },
                                    "&.Mui-focusVisible": {
                                        outline: "none",
                                    },
                                    "&:focus": {
                                        outline: "none",
                                    },
                                }}
                            >
                                Start Game
                            </Button>
                        </div>
                    </div>


                </div>

                {/* BOX INFO */}

            </div>
    );
}
