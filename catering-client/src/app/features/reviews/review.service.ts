import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  CreateReviewDto,
  Review,
  ReviewStats,
  UpdateReviewDto,
} from '../../core/models/review.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PopulatedUser {
  _id?: string;
  name?: string;
}

interface PopulatedPackage {
  _id?: string;
  packageName?: string;
}

interface ReviewApi {
  _id?: string;
  id?: string;
  userId?: string | PopulatedUser;
  orderId?: string | null;
  packageId?: string | PopulatedPackage | null;
  rating?: number;
  comment?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/reviews`;

  // Public: all reviews, optionally filtered by package.
  getAll(packageId?: string): Observable<Review[]> {
    let params = new HttpParams();
    if (packageId) params = params.set('packageId', packageId);
    return this.http
      .get<ApiResponse<ReviewApi[]>>(this.apiUrl, { params })
      .pipe(map((res) => (res.data ?? []).map((r) => this.toModel(r))));
  }

  // Public: aggregate average + count, optionally per package.
  getStats(packageId?: string): Observable<ReviewStats> {
    let params = new HttpParams();
    if (packageId) params = params.set('packageId', packageId);
    return this.http
      .get<ApiResponse<ReviewStats>>(`${this.apiUrl}/stats`, { params })
      .pipe(
        map((res) => ({
          averageRating: res.data?.averageRating ?? 0,
          count: res.data?.count ?? 0,
        })),
      );
  }

  // Reviews written by the logged-in user.
  getMyReviews(): Observable<Review[]> {
    return this.http
      .get<ApiResponse<ReviewApi[]>>(`${this.apiUrl}/user`)
      .pipe(map((res) => (res.data ?? []).map((r) => this.toModel(r))));
  }

  create(dto: CreateReviewDto): Observable<Review> {
    return this.http
      .post<ApiResponse<ReviewApi>>(this.apiUrl, dto)
      .pipe(map((res) => this.toModel(res.data)));
  }

  update(id: string, dto: UpdateReviewDto): Observable<Review> {
    return this.http
      .put<ApiResponse<ReviewApi>>(`${this.apiUrl}/${id}`, dto)
      .pipe(map((res) => this.toModel(res.data)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  private toModel(r: ReviewApi): Review {
    const usr = r.userId;
    const userId = typeof usr === 'string' ? usr : (usr?._id ?? '');
    const userName = typeof usr === 'string' ? '' : (usr?.name ?? '');

    const pkg = r.packageId;
    const packageId =
      pkg == null ? null : typeof pkg === 'string' ? pkg : (pkg._id ?? null);
    const packageName =
      pkg == null || typeof pkg === 'string' ? '' : (pkg.packageName ?? '');

    return {
      id: r._id ?? r.id ?? '',
      userId,
      userName,
      orderId: r.orderId ?? null,
      packageId,
      packageName,
      rating: r.rating ?? 0,
      comment: r.comment ?? '',
      createdAt: r.createdAt ?? '',
    };
  }
}
