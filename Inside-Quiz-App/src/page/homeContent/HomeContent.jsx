import React from "react";
import "./HomeContent.css";
import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
import HomeContentItem from '../../component/homeContentItem/HomeContentItem'


export default function HomeContent() {
    const quizzes = [
        { name: "Meo Meo", author: "Quoc Viet Vi", img: "/image/quiz1.png" },
        { name: "Hamster Cute", author: "Quoc Viet Vi", img: "/image/quiz5.png" },
        { name: "Bird Stork", author: "Quoc Viet Vi", img: "/image/quiz6.png" },
        { name: "Hamster Dumb", author: "Quoc Viet Vi", img: "/image/quiz9.png" },
        { name: "Pig Cute", author: "Quoc Viet Vi", img: "/image/quiz10.png" },
        { name: "Lion Fam", author: "Quoc Viet Vi", img: "/image/quiz3.png" },
        { name: "Orange Beetle", author: "Quoc Viet Vi", img: "/image/quiz2.png" },
        { name: "Pink Crane", author: "Quoc Viet Vi", img: "/image/quiz4.png" },
        { name: "Kungfu Panda", author: "Quoc Viet Vi", img: "/image/quiz7.png" },
        { name: "Penguin", author: "Quoc Viet Vi", img: "/image/quiz8.png" },
        { name: "Turtle Swim Swim", author: "Quoc Viet Vi", img: "/image/quiz11.png" },
        { name: "Deer Fam", author: "Quoc Viet Vi", img: "/image/quiz12.png" },
    ];
    const quizzes2 = [
        { name: "Turtle Swim Swim", author: "Quoc Viet Vi", img: "/image/quiz11.png" },
        { name: "Pink Crane", author: "Quoc Viet Vi", img: "/image/quiz4.png" },
        { name: "Kungfu Panda", author: "Quoc Viet Vi", img: "/image/quiz7.png" },
        { name: "Penguin", author: "Quoc Viet Vi", img: "/image/quiz8.png" },
        { name: "Lion Fam", author: "Quoc Viet Vi", img: "/image/quiz3.png" },
        { name: "Hamster Dumb", author: "Quoc Viet Vi", img: "/image/quiz9.png" },
        { name: "Orange Beetle", author: "Quoc Viet Vi", img: "/image/quiz2.png" },
        { name: "Pig Cute", author: "Quoc Viet Vi", img: "/image/quiz10.png" },
        { name: "Meo Meo", author: "Quoc Viet Vi", img: "/image/quiz1.png" },
        { name: "Bird Stork", author: "Quoc Viet Vi", img: "/image/quiz6.png" },
        { name: "Hamster Cute", author: "Quoc Viet Vi", img: "/image/quiz5.png" },
        { name: "Deer Fam", author: "Quoc Viet Vi", img: "/image/quiz12.png" },
    ];
    const quizzes3 = [
        { name: "Hamster Dumb", author: "Quoc Viet Vi", img: "/image/quiz9.png" },
        { name: "Deer Fam", author: "Quoc Viet Vi", img: "/image/quiz12.png" },
        { name: "Lion Fam", author: "Quoc Viet Vi", img: "/image/quiz3.png" },
        { name: "Pig Cute", author: "Quoc Viet Vi", img: "/image/quiz10.png" },
        { name: "Hamster Cute", author: "Quoc Viet Vi", img: "/image/quiz5.png" },
        { name: "Meo Meo", author: "Quoc Viet Vi", img: "/image/quiz1.png" },
        { name: "Bird Stork", author: "Quoc Viet Vi", img: "/image/quiz6.png" },
        { name: "Kungfu Panda", author: "Quoc Viet Vi", img: "/image/quiz7.png" },
        { name: "Orange Beetle", author: "Quoc Viet Vi", img: "/image/quiz2.png" },
        { name: "Pink Crane", author: "Quoc Viet Vi", img: "/image/quiz4.png" },
        { name: "Penguin", author: "Quoc Viet Vi", img: "/image/quiz8.png" },
        { name: "Turtle Swim Swim", author: "Quoc Viet Vi", img: "/image/quiz11.png" },
    ];

    const [isBouncing, setIsBouncing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsBouncing(true);
            setTimeout(() => setIsBouncing(false), 3000); // animation dài 1s
        }, 5000); // cứ 5 giây chạy 1 lần

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="home-content">
                {/* Bên trái */}
                <div className="left-box">
                    <img
                        src="/image/appotaCharacter4.png"
                        alt="Appota Character"
                        className="appota-character"
                    />
                    <div className="left-text">
                        <h1>Create a quiz</h1>
                        <p>Play with 100 participants and enjoy a great time!</p>
                        <Button
                            variant="contained"
                            className={isBouncing ? "bounce-button" : ""}
                            sx={{
                                borderRadius: "25px",
                                padding: "8px 24px",
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
                            }}>
                            Create Quiz
                        </Button>
                    </div>
                </div>

                {/* Bên phải */}
                <div className="right-box">
                    <img
                        src="/image/appotaCharacter.png"
                        alt="Appota Character"
                        className="appota-character2"
                    />
                    <div className="right-text">
                        <h1>Mini Game</h1>
                        <p>Play with 100 participants and enjoy a great time!</p>
                        <Button
                            variant="contained"
                            className={isBouncing ? "bounce-button" : ""}
                            sx={{
                                borderRadius: "25px",
                                padding: "8px 24px",
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
                            }}>
                            Play Game
                        </Button>
                    </div>
                </div>

            </div>
            <div>
                <HomeContentItem quizList={quizzes} title="Popular quizzes"/>
                <HomeContentItem quizList={quizzes2} title="Animals"/>
                <HomeContentItem quizList={quizzes3} title="Random selection"/>
                <HomeContentItem quizList={quizzes3} title="Random selection"/>
                <HomeContentItem quizList={quizzes3} title="Random selection"/>
                <HomeContentItem quizList={quizzes3} title="Random selection"/>
            </div>
        </div>


    );
}
