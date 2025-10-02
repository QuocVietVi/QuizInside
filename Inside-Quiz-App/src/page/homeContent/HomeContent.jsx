import React, { useEffect, useState, useRef } from "react";
import "./HomeContent.css";
import Button from "@mui/material/Button";
import HomeContentItem from "../../component/homeContentItem/HomeContentItem";
import LeaderBoardItem from "../../component/leaderBoardItem/LeaderBoardItem";
import { loadGlobalLeaderboard } from "../../services/gameService"; // <-- added import


export default function HomeContent({ isLoggedIn, userToken }) {
    const quizzes = [
        { name: "Meo Meo", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz1.png` },
        { name: "Hamster Cute", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz5.png` },
        { name: "Bird Stork", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz6.png` },
        { name: "Hamster Dumb", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz9.png` },
        { name: "Pig Cute", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz10.png` },
        { name: "Lion Fam", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz3.png` },
        { name: "Orange Beetle", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz2.png` },
        { name: "Pink Crane", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz4.png` },
        { name: "Kungfu Panda", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz7.png` },
        { name: "Penguin", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz8.png` },
        { name: "Turtle Swim Swim", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz11.png` },
        { name: "Deer Fam", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz12.png` },
    ];

    const quizzes2 = [
        { name: "Turtle Swim Swim", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz11.png` },
        { name: "Pink Crane", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz4.png` },
        { name: "Kungfu Panda", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz7.png` },
        { name: "Penguin", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz8.png` },
        { name: "Lion Fam", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz3.png` },
        { name: "Hamster Dumb", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz9.png` },
        { name: "Orange Beetle", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz2.png` },
        { name: "Pig Cute", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz10.png` },
        { name: "Meo Meo", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz1.png` },
        { name: "Bird Stork", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz6.png` },
        { name: "Hamster Cute", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz5.png` },
        { name: "Deer Fam", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz12.png` },
    ];

    const quizzes3 = [
        { name: "Hamster Dumb", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz9.png` },
        { name: "Deer Fam", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz12.png` },
        { name: "Lion Fam", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz3.png` },
        { name: "Pig Cute", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz10.png` },
        { name: "Hamster Cute", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz5.png` },
        { name: "Meo Meo", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz1.png` },
        { name: "Bird Stork", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz6.png` },
        { name: "Kungfu Panda", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz7.png` },
        { name: "Orange Beetle", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz2.png` },
        { name: "Pink Crane", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz4.png` },
        { name: "Penguin", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz8.png` },
        { name: "Turtle Swim Swim", author: "Quoc Viet Vi", img: `${import.meta.env.BASE_URL}image/quiz11.png` },
    ];

    const leftTextRef = useRef(null);
    const leftBoxRef = useRef(null);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [isBouncing, setIsBouncing] = useState(false);

    // New state for top players
    const [topPlayers, setTopPlayers] = useState([]);
    const [loadingTopPlayers, setLoadingTopPlayers] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsBouncing(true);
            setTimeout(() => setIsBouncing(false), 3000);
        }, 5000);

        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch top leaderboard on mount
    useEffect(() => {
        let mounted = true;
        async function fetchTop() {
            try {
                const res = await loadGlobalLeaderboard();
                if (!mounted) return;
                if (res.success && Array.isArray(res.leaderboard) && res.leaderboard.length > 0) {
                    setTopPlayers(res.leaderboard.slice(0, 4));
                } else {
                    setTopPlayers([]); // will fall back to static UI below
                }
            } catch (e) {
                console.error("Load top leaderboard failed:", e);
                setTopPlayers([]);
            } finally {
                if (mounted) setLoadingTopPlayers(false);
            }
        }
        fetchTop();
        return () => { mounted = false; };
    }, []);

    return (
        <div>
            <div className="home-content">
                {/* Bên trái */}
                <div className="left-box" ref={leftBoxRef}>
                    <img
                        src={`${import.meta.env.BASE_URL}image/appotaCharacter4.png`}
                        alt="Appota Character"
                        className="appota-character"
                    />
                    <div className="left-text" ref={leftTextRef}>

                        <h1>Leaderboard</h1>
                        <div className="leaderboard-top4">
                            { /* If we have fetched top players, render them; otherwise keep the original static items */}
                            {topPlayers.length > 0 ? (
                                topPlayers.map((p, idx) => {
                                    const icon = idx === 0
                                        ? `${import.meta.env.BASE_URL}image/top1.png`
                                        : idx === 1
                                            ? `${import.meta.env.BASE_URL}image/top2.png`
                                            : idx === 2
                                                ? `${import.meta.env.BASE_URL}image/top3.png`
                                                : `${import.meta.env.BASE_URL}image/top1.png`;
                                    const avatar = p.avatar || `${import.meta.env.BASE_URL}image/author.png`;
                                    const name = p.nickname || p.username || p.display_name || `Player ${idx + 1}`;
                                    return (
                                        <LeaderBoardItem
                                            key={idx}
                                            avatar={avatar}
                                            icon={icon}
                                            name={name}
                                            rank={idx + 1}
                                            isTop3={idx < 3}
                                            className={idx === 3 ? "l4" : "" }
                                        />
                                    );
                                })
                            ) : (
                                // ...existing static fallback items...
                                <>
                                    <LeaderBoardItem avatar={`${import.meta.env.BASE_URL}image/author.png`} icon={`${import.meta.env.BASE_URL}image/top1.png`} name={"Quoc Viet Vi"} isTop3={true} />
                                    <LeaderBoardItem avatar={`${import.meta.env.BASE_URL}image/author2.png`} icon={`${import.meta.env.BASE_URL}image/top2.png`} name={"Quoc Viet Vi"} isTop3={true} />
                                    <LeaderBoardItem className="l3" avatar={`${import.meta.env.BASE_URL}image/author3.png`} icon={`${import.meta.env.BASE_URL}image/top3.png`} name={"Quoc Viet Vi"} isTop3={true} />
                                    <LeaderBoardItem className="l4" avatar={`${import.meta.env.BASE_URL}image/author4.png`} icon={`${import.meta.env.BASE_URL}image/top1.png`} name={"Quoc Viet Vi"} rank={4} isTop3={false} />
                                </>
                            )}
                        </div>

                        <Button
                            variant="contained"
                            className={isBouncing ? "bounce-button" : ""}
                            sx={{
                                borderRadius: "25px",
                                display: "block",
                                margin: "30px auto 0 auto",
                                marginBottom: "0px",
                                fontWeight: 700,
                                fontSize: "17px",
                                textTransform: "none",
                                backgroundColor: "#3bbd8dff",
                                color: "black",
                                width: "170px",
                                height: "50px",
                                "&:hover": { backgroundColor: "#6eba9fff" },
                                "&.Mui-focusVisible": {
                                    outline: "none",
                                },
                                "&:focus": {
                                    outline: "none",
                                },
                                "@media (max-width: 648px)": {
                                    marginTop: "5px",
                                },
                            }}>
                            View All
                        </Button>
                    </div>
                </div>

                {/* Bên phải */}
                <div className="right-box">
                    <img
                        src={`${import.meta.env.BASE_URL}image/appotaCharacter.png`}
                        alt="Appota Character"
                        className="appota-character2"
                    />
                    <div className="right-text">
                        <h1>Shop tích lũy</h1>
                        <div className="right-text-des">
                            <p>Dùng số điểm tích lũy được và đổi những phần quà hấp dẫn</p>
                            <p>(Điểm của bạn: 100)</p>
                        </div>

                        <Button
                            variant="contained"
                            className={isBouncing ? "bounce-button" : ""}
                            sx={{
                                borderRadius: "25px",
                                display: "block",
                                margin: "30px auto 0 auto",
                                fontWeight: 700,
                                fontSize: "17px",
                                textTransform: "none",
                                backgroundColor: "#308290ff",
                                color: "white",
                                width: "170px",
                                height: "50px",
                                "&:hover": { backgroundColor: "#368e9dff" },
                                "&.Mui-focusVisible": {
                                    outline: "none",
                                },
                                "&:focus": {
                                    outline: "none",
                                },
                                "@media (max-width: 648px)": {
                                    marginTop: "5px",
                                },
                            }}>
                            View all
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                <HomeContentItem quizList={quizzes} title="Công nghệ" isLoggedIn={isLoggedIn} userToken={userToken} />
            </div>
        </div>
    );
}
