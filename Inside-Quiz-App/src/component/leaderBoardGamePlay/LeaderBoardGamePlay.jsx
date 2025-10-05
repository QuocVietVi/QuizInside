import { useState, useEffect } from "react";
import "./LeaderBoardGamePlay.css";

export default function LeaderBoardGamePlay({ leaderboard = [], scoreAnimations = [], currentUserId }) {
    const [animatedPlayers, setAnimatedPlayers] = useState([]);
    const [twoColumn, setTwoColumn] = useState(false);
    const [animatingScores, setAnimatingScores] = useState({});

    // Enhanced player data with animations
    useEffect(() => {
        const playersWithEnhancedData = leaderboard.map((player, index) => ({
            ...player,
            rank: index + 1,
            animationDelay: index * 0.1,
            isTopThree: index < 3,
        }));

        setAnimatedPlayers(playersWithEnhancedData);
    }, [leaderboard]);

    // Toggle two-column layout when width <= 1300px AND there are more than 5 items
    useEffect(() => {
        function updateLayout() {
            const width = window.innerWidth;
            setTwoColumn(width <= 1300 && animatedPlayers.length > 5);
        }
        updateLayout();
        window.addEventListener("resize", updateLayout);
        return () => window.removeEventListener("resize", updateLayout);
    }, [animatedPlayers.length]);

    // Score animations effect
    useEffect(() => {
        if (scoreAnimations.length > 0) {
            // Initialize animations for players with score increases
            const newAnimatingScores = {};
            scoreAnimations.forEach(animation => {
                if (animation.scoreIncrease > 0) {
                    newAnimatingScores[animation.playerId] = {
                        startScore: animation.previousScore,
                        endScore: animation.currentScore,
                        scoreIncrease: animation.scoreIncrease,
                        isAnimating: true
                    };
                }
            });
            setAnimatingScores(newAnimatingScores);

            // Clear animations after animation completes
            const timer = setTimeout(() => {
                setAnimatingScores({});
            }, 2000); // Animation duration

            return () => clearTimeout(timer);
        }
    }, [scoreAnimations]);

    const topPlayers = animatedPlayers.slice(0, 10);
    const currentPlayer = animatedPlayers[0] || {
        nickname: "Unknown",
        score: 0,
        rank: 1,
        avatar: `${import.meta.env.BASE_URL}avatar/avatar1.png`,
    };

    const getPlayerAnimation = (playerId) => {
        return animatingScores[playerId] || null;
    };

    return (
        <div>
            <div className="leaderboard-container">
                {/* Enhanced current player info with animations */}
                <div className="leaderboard-current">
                    <div className="lb-name">🎯 {currentPlayer.nickname}</div>
                    <div className="lb-score">💰 {currentPlayer.score} điểm</div>
                    <div className="lb-rank">📊 Hạng #{currentPlayer.rank}</div>
                </div>

                {/* Enhanced leaderboard list */}
                <div className={`leaderboard-list ${twoColumn ? "two-column" : ""}`}>
                    {topPlayers.map((player, index) => {
                        const animation = getPlayerAnimation(player.id);
                        const isCurrentUser = player.id === currentUserId;
                        
                        return (
                            <div
                                className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${
                                    index === 0 ? 'first-place' : index === 1 ? 'second-place' : index === 2 ? 'third-place' : ''
                                }`}
                                key={player.id || player.nickname}
                                style={{
                                    "--index": index,
                                    animationDelay: `${0.2 + (index * 0.1)}s`,
                                }}
                            >
                                <div className="lb-left">
                                    <span className="lb-rank">{player.rank}</span>
                                    <div className="leaderboard-ava-gameplay">
                                    <img
                                        src={player.avatar || `${import.meta.env.BASE_URL}avatar/avatar${(index % 8) + 1}.png`}
                                        alt={player.nickname}
                                        className="lb-avatar"
                                    />
                                    </div>

                                    <span className="lb-name">
                                        {player.isTopThree && (
                                            <span style={{ marginRight: "8px" }}>
                                                {index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉"}
                                            </span>
                                        )}
                                        {player.nickname}
                                    </span>
                                </div>
                                <div className="lb-right">
                                    <span className="lb-score">
                                        {player.score}
                                        {player.isTopThree && (
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    marginLeft: "4px",
                                                    opacity: 0.8,
                                                }}
                                            >
                                                ✨
                                            </span>
                                        )}
                                    </span>
                                    {animation && animation.isAnimating && (
                                        <div className="score-animation-container">
                                            <span className="score-increase-animation">
                                                +{animation.scoreIncrease}
                                            </span>
                                            <span className="score-counter-animation">
                                                {animation.startScore}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

