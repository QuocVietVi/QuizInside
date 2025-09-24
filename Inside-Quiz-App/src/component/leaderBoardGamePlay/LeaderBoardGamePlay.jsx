import { useState } from "react";
import "./LeaderBoardGamePlay.css";

export default function LeaderBoardGamePlay() {
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

    // điểm random demo
    const playersWithScore = players.map((p, i) => ({
        ...p,
        score: Math.floor(Math.random() * 1000),
        rank: i + 1,
    }));
    const topPlayers = playersWithScore.slice(0, 10);
    // giả sử player hiện tại là id=1
    const currentPlayer = playersWithScore[0];

    return (
        <div>
            <div className="leaderboard-current">
                <span className="lb-name">{currentPlayer.name}</span>
                <span className="lb-score">{currentPlayer.score} pts</span>
                <span className="lb-rank">Rank #{currentPlayer.rank}</span>
            </div>
            <div className="leaderboard-container">
                {/* Góc phải trên */}


                {/* Rank bar */}
                <div className="leaderboard-list">
                    {topPlayers.map((p) => (
                        <div className="leaderboard-item" key={p.id}>
                            <div className="lb-left">
                                <span className="lb-rank">#{p.rank}</span>
                                <img src={p.avatar} alt={p.name} className="lb-avatar" />
                                <span className="lb-name">{p.name}</span>
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

