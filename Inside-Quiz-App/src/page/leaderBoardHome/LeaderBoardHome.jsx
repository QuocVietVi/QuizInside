import React, { useEffect, useState } from "react";
import "./LeaderBoardHome.css";
import "../../component/leaderBoardGamePlay/LeaderBoardGamePlay.css"; // reuse styles
import { loadGlobalLeaderboard, getCurrentUser } from "../../services/gameService";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';

export default function LeaderBoardHome() {
    const [board, setBoard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myRankInfo, setMyRankInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        async function fetchAll() {
            try {
                const res = await loadGlobalLeaderboard();
                if (!mounted) return;
                if (res.success && Array.isArray(res.leaderboard)) {
                    const list = res.leaderboard.map((p, i) => ({ ...p, rank: i + 1 }));
                    setBoard(list);
                    // determine current user rank
                    const me = getCurrentUser();
                    if (me) {
                        const found = list.find(item => {
                            // try multiple id fields
                            return item.id === me.id || item.user_id === me.id || item.userId === me.id || item.nickname === me.nickname || item.username === me.username;
                        });
                        if (found) setMyRankInfo(found);
                        else setMyRankInfo({ nickname: me.nickname || me.username || "You", score: 0, rank: null });
                    } else {
                        setMyRankInfo(null);
                    }
                } else {
                    setBoard([]);
                    setMyRankInfo(null);
                }
            } catch (e) {
                console.error("Load leaderboard failed:", e);
                setBoard([]);
                setMyRankInfo(null);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchAll();
        return () => { mounted = false; };
    }, []);
    const isMobile = window.innerWidth <= 768;

    return (
        <div className="leaderboard-page">
            <button
                type="button"
                className="homeBtn"
                aria-label="Về trang chủ"
                onClick={() => navigate("/")}
            >
                <HomeIcon className="homeBtn-icon" />
            </button>
            <div className="leaderboard-page-header">
                <h1>Leaderboard</h1>
            </div>

            <div className="leaderboard-table-wrapper">
                {loading ? (
                    <div className="leaderboard-loading">Đang tải bảng xếp hạng...</div>
                ) : (
                    <div className="leaderboard-table">
                        {board.map((p, idx) => (
                            <div
                                key={p.id || p.nickname || idx}
                                className="leaderboard-item"
                            >
                                <div className="lb-left">
                                    <span className="lb-rank">{p.rank}</span>
                                    <div className="leaderboard-ava-gameplay">
                                        <img
                                            src={p.avatar || `${import.meta.env.BASE_URL}image/author.png`}
                                            alt={p.nickname || p.username}
                                            className="lb-avatar"
                                        />
                                    </div>
                                    <span className="lb-name">{p.nickname}</span>
                                </div>
                                <div className="lb-right">
                                    <span className="lb-score">{p.total_score ?? 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="leaderboard-bottom">
                {/* {myRankInfo ? (
                    <div className="my-rank-row">
                        <div className="my-rank-left">
                            <div className="leaderboard-ava-gameplay">
                                <img
                                    src={(myRankInfo.avatar) || `${import.meta.env.BASE_URL}image/author.png`}
                                    alt={myRankInfo.nickname || "You"}
                                    className="lb-avatar"
                                />
                            </div>
                            <div className="my-info">
                                <div className="lb-name">{myRankInfo.nickname || "You"}</div>
                                <div className="lb-rank">Hạng #{myRankInfo.rank ?? "-"}</div>
                            </div>
                        </div>
                        <div className="my-score">
                            <div className="lb-score">{myRankInfo.score ?? 0}</div>
                        </div>
                    </div>
                ) : (
                    <div className="my-rank-row">
                        <div style={{ color: "#fff" }}>Không có thông tin người chơi. Vui lòng đăng nhập.</div>
                    </div>
                )} */}
            </div>
        </div>
    );
}

