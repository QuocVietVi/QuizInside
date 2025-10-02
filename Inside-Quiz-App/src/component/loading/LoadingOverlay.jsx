import React, { useState, useEffect } from "react";
import { subscribe, getLoading } from "../../services/loadingService";
import "./Loading.css";
import ClimbingBoxLoader from "react-spinners/ClimbingBoxLoader";

export default function LoadingOverlay() {
    const [visible, setVisible] = useState(getLoading());

    useEffect(() => {
        const unsubscribe = subscribe(setVisible);
        return unsubscribe;
    }, []);

    if (!visible) return null;

    return (
        <div className="app-loading-overlay">
            <div className="app-loading-card">
                <ClimbingBoxLoader color="#50c6f1" size={30} loading={true} />
                <div className="app-loading-text">Loading...</div>
                <div className="app-loading-subtext">Vui lòng chờ trong giây lát</div>
            </div>
        </div>
    );
}
