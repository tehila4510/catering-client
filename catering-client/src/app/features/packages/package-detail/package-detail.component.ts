import { Component, OnInit, computed, signal, input, inject } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { Package } from '../../../core/models/package.model';
import { PackageService } from '../package.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { CATEGORY_LABELS } from '../../../core/constants/categories';
import { Review, ReviewStats } from '../../../core/models/review.model';
import { ReviewService } from '../../reviews/review.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { ReviewListComponent } from '../../../shared/components/review-list/review-list.component';

interface LimitRow {
  key: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-package-detail',
  standalone: true,
  imports: [RouterLink, LoaderComponent, StarRatingComponent, ReviewListComponent],
  template: `
    <section class="detail-page">
      @if (loading()) {
        <app-loader />
      }
    
      @if (!loading() && !pkg()) {
        <div class="not-found">
          <p>החבילה לא נמצאה</p>
          <a routerLink="/packages" class="btn-secondary">חזרה לחבילות</a>
        </div>
      }
    
      @if (!loading() && pkg(); as p) {
        <div class="detail-image">
          <img [src]="p.imageUrl || fallbackImage" [alt]="p.name" />
        </div>
        <div class="detail-content">
          <h1>{{ p.name }}</h1>
          <p class="description">{{ p.description }}</p>
          <div class="dishes-list">
            <h2>מה כולל ההרכב</h2>
            <ul>
              @for (row of limitRows(); track row.key) {
                <li>
                  <span class="dish-name">{{ row.label }}</span>
                  <span class="dish-price gold-text">{{ row.count }} מנות</span>
                </li>
              } @empty {
                <li><span class="dish-name">ההרכב ייקבע בהתאמה אישית</span></li>
              }
            </ul>
            <p class="dishes-total label-caps">סה״כ עד {{ totalDishes() }} מנות לבחירה</p>
          </div>
          <p class="total-price">
            <span class="label-caps">מחיר לאדם</span>
            <span class="price gold-text">₪{{ p.pricePerPerson }}</span>
          </p>
          <p class="min-guests label-caps">מינימום {{ p.minGuests }} אורחים</p>

          <div class="order-actions">
            <button type="button" class="btn-primary" (click)="onOrder(p.id)">
              להזמנה
            </button>
            <a routerLink="/packages" class="btn-secondary">← חזרה לחבילות</a>
          </div>

          @if (showLoginPrompt()) {
            <div class="login-prompt">
              <p>עליך להתחבר כדי לבצע הזמנה</p>
              <button type="button" class="btn-primary" (click)="goToLogin()">
                התחברות
              </button>
            </div>
          }
        </div>

        <section class="reviews-section">
          <div class="reviews-head">
            <h2>חוות דעת על החבילה</h2>
            @if (reviewStats().count > 0) {
              <div class="reviews-summary">
                <span class="avg gold-text">{{ reviewStats().averageRating }}</span>
                <app-star-rating [value]="roundedAverage()" [readonly]="true" />
                <span class="count">({{ reviewStats().count }})</span>
              </div>
            }
          </div>

          @if (reviewsLoading()) {
            <p class="reviews-loading">טוען חוות דעת...</p>
          } @else {
            <app-review-list [reviews]="reviews()" />
          }
        </section>
      }
    </section>
    `,
  styleUrl: './package-detail.component.scss',
})
export class PackageDetailComponent implements OnInit {
  private packageService = inject(PackageService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private reviewService = inject(ReviewService);

  readonly id = input<string>('');

  pkg = signal<Package | null>(null);
  loading = signal(true);
  showLoginPrompt = signal(false);

  reviews = signal<Review[]>([]);
  reviewStats = signal<ReviewStats>({ averageRating: 0, count: 0 });
  reviewsLoading = signal(true);

  readonly roundedAverage = computed(() =>
    Math.round(this.reviewStats().averageRating),
  );

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800';

  limitRows(): LimitRow[] {
    const p = this.pkg();
    if (!p?.limits) return [];
    return Object.entries(p.limits)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([key, count]) => ({
        key,
        label: CATEGORY_LABELS[key] ?? key,
        count: count ?? 0,
      }));
  }

  totalDishes(): number {
    return this.limitRows().reduce((sum, row) => sum + row.count, 0);
  }

  ngOnInit(): void {
    this.packageService.getAll().subscribe({
      next: (packages) => {
        this.pkg.set(packages.find((p) => p.id === this.id()) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.loadReviews();
  }

  private loadReviews(): void {
    const packageId = this.id();
    if (!packageId) {
      this.reviewsLoading.set(false);
      return;
    }

    this.reviewService.getAll(packageId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false),
    });

    this.reviewService.getStats(packageId).subscribe({
      next: (stats) => this.reviewStats.set(stats),
    });
  }

  onOrder(packageId: string): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/order', packageId]);
    } else {
      this.showLoginPrompt.set(true);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
