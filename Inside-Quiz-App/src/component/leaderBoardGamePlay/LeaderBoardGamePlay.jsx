import { useState, useEffect } from "react";
import "./LeaderBoardGamePlay.css";

export default function LeaderBoardGamePlay({ leaderboard = [], scoreAnimations = [], currentUserId, isFinalLeaderboard = false }) {
    const [animatedPlayers, setAnimatedPlayers] = useState([]);
    const [twoColumn, setTwoColumn] = useState(false);
    const [animatingScores, setAnimatingScores] = useState({});
    const [revealedTopThree, setRevealedTopThree] = useState([]);
    const [showDramaticReveal, setShowDramaticReveal] = useState(false);

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

    // Dramatic top 3 reveal for final leaderboard
    useEffect(() => {
        if (isFinalLeaderboard && animatedPlayers.length >= 3) { // Only show if at least 3 players
            setShowDramaticReveal(true);
            setRevealedTopThree([]);
            
            // Reveal in reverse order for dramatic effect: 3rd, 2nd, 1st
            const topThree = animatedPlayers.slice(0, 3);
            
            // Show 3rd place first
            setTimeout(() => {
                if (topThree[2]) setRevealedTopThree([topThree[2]]);
            }, 1000);
            
            // Show 2nd place
            setTimeout(() => {
                if (topThree[1]) setRevealedTopThree(prev => [...prev, topThree[1]]);
            }, 3000);
            
            // Show 1st place with extra fanfare
            setTimeout(() => {
                if (topThree[0]) setRevealedTopThree(prev => [...prev, topThree[0]]);
            }, 5000);
            
            // Show remaining players
            setTimeout(() => {
                setShowDramaticReveal(false);
            }, 590000);
        } else if (isFinalLeaderboard && animatedPlayers.length < 3) {
            // If less than 3 players, don't show dramatic reveal
            setShowDramaticReveal(false);
        }
    }, [isFinalLeaderboard, animatedPlayers]);

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

    // Dramatic reveal rendering - only if we have at least 3 players
    if (showDramaticReveal && isFinalLeaderboard && animatedPlayers.length >= 3) {
        return (
            <div className="leaderboard-container dramatic-reveal">
                <div className="dramatic-title">
                    <h1 className="final-results-title">🏆 KẾT QUẢ CUỐI CÙNG 🏆</h1>
                </div>
                
                <div className="podium-container">
                    {/* 3rd Place */}
                    {revealedTopThree.length >= 1 && revealedTopThree.find(p => p.rank === 3) && (
                        <div className="podium-item third-place animate-reveal">
                            <div className="podium-player">
                                <img 
                                    src={revealedTopThree.find(p => p.rank === 3).avatar || `${import.meta.env.BASE_URL}avatar/avatar3.png`} 
                                    alt="3rd place" 
                                    className="podium-avatar"
                                />
                                <div className="podium-name">{revealedTopThree.find(p => p.rank === 3).nickname}</div>
                                <div className="podium-score">{revealedTopThree.find(p => p.rank === 3).score} điểm</div>
                            </div>
                            <div className="podium-base third">
                                <div className="podium-medal">🥉</div>
                                <div className="podium-rank">3</div>
                            </div>
                        </div>
                    )}
                    
                    {/* 1st Place */}
                    {revealedTopThree.length >= 3 && revealedTopThree.find(p => p.rank === 1) && (
                        <div className="podium-item first-place animate-reveal-winner">
                            <div className="winner-crown">👑</div>
                            <div className="podium-player winner">
                                <img 
                                    src={revealedTopThree.find(p => p.rank === 1).avatar || `${import.meta.env.BASE_URL}avatar/avatar1.png`} 
                                    alt="1st place" 
                                    className="podium-avatar winner-avatar"
                                />
                                <div className="podium-name winner-name">{revealedTopThree.find(p => p.rank === 1).nickname}</div>
                                <div className="podium-score winner-score">{revealedTopThree.find(p => p.rank === 1).score} điểm</div>
                            </div>
                            <div className="podium-base first">
                                <div className="podium-medal">🏆</div>
                                <div className="podium-rank">1</div>
                            </div>
                            <div className="winner-particles">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="particle" style={{ '--delay': `${i * 0.2}s` }}></div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* 2nd Place */}
                    {revealedTopThree.length >= 2 && revealedTopThree.find(p => p.rank === 2) && (
                        <div className="podium-item second-place animate-reveal">
                            <div className="podium-player">
                                <img 
                                    src={revealedTopThree.find(p => p.rank === 2).avatar || `${import.meta.env.BASE_URL}avatar/avatar2.png`} 
                                    alt="2nd place" 
                                    className="podium-avatar"
                                />
                                <div className="podium-name">{revealedTopThree.find(p => p.rank === 2).nickname}</div>
                                <div className="podium-score">{revealedTopThree.find(p => p.rank === 2).score} điểm</div>
                            </div>
                            <div className="podium-base second">
                                <div className="podium-medal">🥈</div>
                                <div className="podium-rank">2</div>
                            </div>
                        </div>
                    )}
                </div>
                
                {revealedTopThree.length >= 3 && (
                    <div className="dramatic-congratulations">
                        <div className="congrats-text">🎉 Chúc mừng {revealedTopThree.find(p => p.rank === 1)?.nickname}! 🎉</div>
                    </div>
                )}
            </div>
        );
    }

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

