const baseUrl = '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('userToken') || '';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('userToken', token);
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    async request(endpoint, options = {}) {
        const url = `${baseUrl}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(error.message.replace(/"/g, ''));
        }
    }

    // Player stats
    async getPlayerStats() {
        return this.request('/player/stats');
    }

    // Categories
    async getCategories() {
        return this.request('/cms/categories');
    }

    // Rooms
    async createRoom(categoryName) {
        return this.request('/rooms', {
            method: 'POST',
            body: JSON.stringify({ category_name: categoryName })
        });
    }

    async joinRoom(roomId) {
        return this.request(`/rooms/${roomId}/join`, {
            method: 'POST'
        });
    }

    async startGame(roomId) {
        return this.request(`/rooms/${roomId}/start`, {
            method: 'POST'
        });
    }

    // Shop
    async getShopItems() {
        return this.request('/shop/items');
    }

    async purchaseItem(itemId) {
        return this.request('/shop/purchase', {
            method: 'POST',
            body: JSON.stringify({ item_id: itemId })
        });
    }

    // Inventory
    async getInventory() {
        return this.request('/inventory');
    }

    // Leaderboard
    async getLeaderboard() {
        return this.request('/leaderboard');
    }

    // CMS - Shop Items
    async createShopItem(itemData) {
        return this.request('/cms/shop/items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    async updateShopItem(itemId, itemData) {
        return this.request(`/cms/shop/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
    }

    async deleteShopItem(itemId) {
        return this.request(`/cms/shop/items/${itemId}`, {
            method: 'DELETE'
        });
    }

    // CMS - Quiz Import
    async importQuiz(formData) {
        return this.request('/cms/quizzes/import', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.token}` },
            body: formData
        });
    }
}

export default new ApiService();
