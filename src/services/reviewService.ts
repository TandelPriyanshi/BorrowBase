import ApiService from "./apiService";

interface SubmitReviewParams {
    userId: string;
    rating: number;
    message: string;
    borrowRequestId?: number;
    reviewType?: string;
}

export const submitReview = async ({
    userId,
    rating,
    message,
    borrowRequestId,
    reviewType = "borrower_to_owner",
}: SubmitReviewParams) => {
    try {
        const response = await ApiService.createReview({
            reviewee_id: parseInt(userId),
            rating,
            comment: message,
            borrow_request_id: borrowRequestId,
            review_type: reviewType,
        });
        return response;
    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
};

export const getUserReviews = async (
    userId: string
): Promise<
    Array<{
        id: number;
        stars: number;
        message: string;
        created_at: string;
        reviewer_name: string;
        profile_pic_url: string;
        reviewer_id: number;
        user_id: number;
    }>
> => {
    try {
        const response = await ApiService.getUserReviews(parseInt(userId));
        const data = response.data || response;
        return data.reviews || data;
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        throw error;
    }
};
