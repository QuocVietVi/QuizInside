import React, { useEffect, useRef } from "react";

export default function LeaderBoardRow({ children, delay = 0, speed = 4 }) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    let pos = 0;
    let req;

    const animate = () => {
      if (!track) return;
      pos += speed; // px/frame
      if (pos >= track.scrollWidth / 2) pos = 0; // reset khi đi hết 1 bản copy
      track.style.transform = `translateX(${pos}px)`; // chạy sang phải
      req = requestAnimationFrame(animate);
    };

    const timer = setTimeout(() => {
      req = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(req);
    };
  }, [delay, speed]);

  return <div className="leaderboard-track" ref={trackRef}>{children}</div>;
}
