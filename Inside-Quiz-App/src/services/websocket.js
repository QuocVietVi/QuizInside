class WebSocketService {
    constructor() {
        this.ws = null;
        this.listeners = {};
    }

    connect(roomId, token) {
        if (this.ws) {
            this.ws.close();
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/${roomId}?token=${token}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log("WebSocket connection opened");
            this.emit('connected');
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.emit(message.type, message.payload);
        };
        
        this.ws.onclose = () => {
            this.emit('disconnected');
        };
        
        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.emit('error', error);
        };
    }

    send(type, payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    sendAnswer(answer) {
        this.send('answer', answer);
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners = {};
    }
}

export default new WebSocketService();
