import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Review } from '../../../core/models/review.model';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [DatePipe, StarRatingComponent],
  template: `
    <div class="review-list" dir="rtl">
      @for (review of reviews(); track review.id) {
        <article class="review-card">
          <header class="review-head">
            <div class="reviewer">
              <span class="avatar">{{ initial(review.userName) }}</span>
              <div class="reviewer-meta">
                <span class="name">{{ review.userName || 'לקוח' }}</span>
                @if (review.packageName) {
                  <span class="package-tag">{{ review.packageName }}</span>
                }
              </div>
            </div>
            <app-star-rating [value]="review.rating" [readonly]="true" />
          </header>

          <p class="comment">{{ review.comment }}</p>

          <footer class="review-foot">
            <span class="date">{{ review.createdAt | date: 'dd/MM/yyyy' }}</span>
            @if (canManage(review)) {
              <span class="actions">
                <button type="button" class="link-btn" (click)="edit.emit(review)">עריכה</button>
                <button type="button" class="link-btn danger" (click)="remove.emit(review)">מחיקה</button>
              </span>
            }
          </footer>
        </article>
      } @empty {
        <p class="empty">עדיין אין חוות דעת. היו הראשונים לשתף!</p>
      }
    </div>
  `,
  styleUrl: './review-list.component.scss',
})
export class ReviewListComponent {
  readonly reviews = input<Review[]>([]);
  // IDs of reviews the current user owns — edit/delete controls show only for these.
  readonly ownedIds = input<string[]>([]);
  // Admins may manage every review.
  readonly canManageAll = input(false);

  readonly edit = output<Review>();
  readonly remove = output<Review>();

  protected initial(name: string): string {
    return (name || 'ל').trim().charAt(0).toUpperCase();
  }

  protected canManage(review: Review): boolean {
    if (this.canManageAll()) return true;
    return this.ownedIds().includes(review.id);
  }
}
