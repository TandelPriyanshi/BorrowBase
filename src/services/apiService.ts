import api from "../utils/api";

// API Service class to handle all API calls
export class ApiService {
    // Auth endpoints
    static async register(userData: {
        name: string;
        email: string;
        password: string;
        address?: string;
    }) {
        const response = await api.post("/api/auth/register", userData);
        return response.data;
    }

    static async login(credentials: { email: string; password: string }) {
        const response = await api.post("/api/auth/login", credentials);
        return response.data;
    }

    static async logout() {
        const response = await api.post("/api/auth/logout");
        return response.data;
    }

    static async refreshToken(refreshToken: string) {
        const response = await api.post("/api/auth/refresh", { refreshToken });
        return response.data;
    }

    // Profile endpoints
    static async getProfile() {
        const response = await api.get("/api/profile");
        return response.data;
    }

    static async getCompleteProfile() {
        const response = await api.get("/api/profile/complete");
        return response.data;
    }

    static async updateProfile(profileData: any) {
        const response = await api.put("/api/profile", profileData);
        return response.data;
    }

    static async updateLocation(locationData: {
        latitude: number;
        longitude: number;
        address: string;
    }) {
        const response = await api.post("/api/update-location", locationData);
        return response.data;
    }

    // Resources endpoints
    static async getResources(params?: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
        latitude?: number;
        longitude?: number;
        radius?: number;
    }) {
        const response = await api.get("/api/resources", { params });
        return response.data;
    }

    static async getResourceById(id: number) {
        const response = await api.get(`/api/resources/${id}`);
        return response.data;
    }

    static async createResource(resourceData: any) {
        const response = await api.post("/api/resources", resourceData);
        return response.data;
    }

    static async updateResource(id: number, resourceData: any) {
        const response = await api.put(`/api/resources/${id}`, resourceData);
        return response.data;
    }

    static async deleteResource(id: number) {
        const response = await api.delete(`/api/resources/${id}`);
        return response.data;
    }

    static async getMyResources(params?: { page?: number; limit?: number }) {
        const response = await api.get("/api/resources/my-resources", {
            params,
        });
        return response.data;
    }

    // Borrow requests endpoints
    static async createBorrowRequest(requestData: {
        resource_id: number;
        start_date: string;
        end_date: string;
        message?: string;
    }) {
        const response = await api.post("/api/borrow-requests", requestData);
        return response.data;
    }

    static async getMyRequests(params?: { page?: number; limit?: number }) {
        const response = await api.get("/api/my-requests", { params });
        return response.data;
    }

    static async cancelBorrowRequest(requestId: number) {
        const response = await api.put(
            `/api/borrow-requests/${requestId}/cancel`
        );
        return response.data;
    }

    static async getResourceRequests(params?: {
        page?: number;
        limit?: number;
    }) {
        const response = await api.get("/api/resource-requests", { params });
        return response.data;
    }

    static async updateRequestStatus(
        id: number,
        status: "approved" | "rejected",
        response_message?: string
    ) {
        const response = await api.put(`/api/borrow-requests/${id}/status`, {
            status,
            response_message,
        });
        return response.data;
    }

    // Chat endpoints
    static async getChats() {
        const response = await api.get("/api/chats");
        return response.data;
    }

    static async createChat(other_user_id: number) {
        const response = await api.post("/api/chats", { other_user_id });
        return response.data;
    }

    static async getChatMessages(chatId: number) {
        const response = await api.get(`/api/chats/${chatId}/messages`);
        return response.data;
    }

    static async sendMessage(chatId: number, content: string) {
        const response = await api.post(`/api/chats/${chatId}/messages`, {
            content,
        });
        return response.data;
    }

    // Reviews endpoints
    static async createReview(reviewData: {
        reviewee_id: number;
        rating: number;
        comment?: string;
        borrow_request_id?: number;
        review_type?: string;
    }) {
        const response = await api.post("/api/reviews", reviewData);
        return response.data;
    }

    static async getUserReviews(userId: number) {
        const response = await api.get(`/api/users/${userId}/reviews`);
        return response.data;
    }

    static async getMyReviews() {
        const response = await api.get("/api/my-reviews");
        return response.data;
    }

    // Notifications endpoints
    static async getNotifications(unread_only?: boolean) {
        const response = await api.get("/api/notifications", {
            params: { unread_only },
        });
        return response.data;
    }

    static async markNotificationAsRead(id: number) {
        const response = await api.put(`/api/notifications/${id}/read`);
        return response.data;
    }

    static async getUnreadCount() {
        const response = await api.get("/api/notifications/unread-count");
        return response.data;
    }

    // Health check
    static async healthCheck() {
        const response = await api.get("/api/health");
        return response.data;
    }
}

export default ApiService;
