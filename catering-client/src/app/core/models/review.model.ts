export interface CreateReviewDto {
  rating: number;
  comment: string;
  // Required: reviews can only be written for an order the customer placed.
  orderId: string;
  packageId?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  orderId: string | null;
  packageId: string | null;
  packageName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewStats {
  averageRating: number;
  count: number;
}
