import { useState } from "react";
import "./LeaderBoardGamePlay.css";

export default function LeaderBoardGamePlay({ leaderboard = [] }) {
    // Remove the demo players state and use the leaderboard prop instead
    const playersWithScore = leaderboard.map((player, index) => ({
        ...player,
        avatar: `https://i.pravatar.cc/50?img=${index + 1}`,
        rank: index + 1,
    }));

    const topPlayers = playersWithScore.slice(0, 10);
    // Current player is assumed to be the first player (you can modify this logic as needed)
    const currentPlayer = playersWithScore[0] || { name: "Unknown", score: 0, rank: 1 };

    return (
        <div>
            <div className="leaderboard-container">
                {/* Góc phải trên */}

                {/* Rank bar */}
                <div className="leaderboard-list">
                    {topPlayers.map((p) => (
                        <div className="leaderboard-item" key={p.id || p.nickname}>
                            <div className="lb-left">
                                <span className="lb-rank">#{p.rank}</span>
                                <img src={p.avatar} alt={p.name} className="lb-avatar" />
                                <span className="lb-name">{p.nickname}</span>
                            </div>
                            <div className="lb-right">
                                <span className="lb-score">{p.score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

