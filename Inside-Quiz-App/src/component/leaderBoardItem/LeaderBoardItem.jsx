import React from "react";
import "./LeaderBoardItem.css"; // CSS riêng cho component

const LeaderBoardItem = ({ avatar, icon, name, rank, isTop3, className }) => {
    return (
        <div className={`leaderboard-top3 ${className || ""}`}>
            {isTop3 ? (
                <img className="leaderboard-icon" src={icon} alt="" />
            ) : (
                <span className="leaderboard-rank">{rank}</span>
            )}
            <div className="leaderboard-ava">
                <img src={avatar} alt="" />
            </div>
            <span className="leaderboard-name">{name}</span>
        </div>
    );
};

export default LeaderBoardItem;
