import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Review, ReviewStats } from '../../../core/models/review.model';
import { ReviewService } from '../review.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { ReviewListComponent } from '../../../shared/components/review-list/review-list.component';
import {
  ReviewFormComponent,
  ReviewFormValue,
} from '../../../shared/components/review-form/review-form.component';

@Component({
  selector: 'app-review-page',
  standalone: true,
  imports: [
    RouterLink,
    LoaderComponent,
    StarRatingComponent,
    ReviewListComponent,
    ReviewFormComponent,
  ],
  templateUrl: './review-page.component.html',
  styleUrl: './review-page.component.scss',
})
export class ReviewPageComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly stats = signal<ReviewStats>({ averageRating: 0, count: 0 });
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly showForm = signal(false);
  protected readonly editing = signal<Review | null>(null);
  protected readonly ownedIds = signal<string[]>([]);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly roundedAverage = computed(() =>
    Math.round(this.stats().averageRating),
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.reviewService.getAll().subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.reviewService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
    });

    if (this.auth.isLoggedIn()) {
      this.reviewService.getMyReviews().subscribe({
        next: (mine) => this.ownedIds.set(mine.map((r) => r.id)),
      });
    }
  }

  protected openEdit(review: Review): void {
    this.editing.set(review);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  // New reviews are written from the profile, tied to a specific order. This page
  // only edits an existing review the user owns.
  protected submit(value: ReviewFormValue): void {
    const current = this.editing();
    if (!current) return;

    this.saving.set(true);
    this.reviewService.update(current.id, value).subscribe({
      next: (updated) => {
        this.reviews.update((list) =>
          list.map((r) => (r.id === updated.id ? updated : r)),
        );
        this.afterSave('חוות הדעת עודכנה בהצלחה');
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.toast.show(e.error?.message || 'עדכון נכשל, נסה שוב', 'error');
      },
    });
  }

  private afterSave(message: string): void {
    this.saving.set(false);
    this.closeForm();
    this.toast.show(message, 'success');
    this.reviewService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
    });
  }

  protected remove(review: Review): void {
    if (!confirm('האם למחוק את חוות הדעת?')) return;
    this.reviewService.delete(review.id).subscribe({
      next: () => {
        this.reviews.update((list) => list.filter((r) => r.id !== review.id));
        this.ownedIds.update((ids) => ids.filter((id) => id !== review.id));
        this.toast.show('חוות הדעת נמחקה', 'success');
        this.reviewService.getStats().subscribe({
          next: (stats) => this.stats.set(stats),
        });
      },
      error: (e: { error?: { message?: string } }) => {
        this.toast.show(e.error?.message || 'מחיקה נכשלה', 'error');
      },
    });
  }
}
