import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StarRatingComponent } from '../star-rating/star-rating.component';

export interface ReviewFormValue {
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [FormsModule, StarRatingComponent],
  template: `
    <form class="review-form" dir="rtl" (ngSubmit)="onSubmit()">
      <div class="field">
        <label class="field-label">הדירוג שלך</label>
        <app-star-rating [value]="rating()" (changed)="setRating($event)" />
      </div>

      <div class="field">
        <label class="field-label" for="review-comment">חוות הדעת שלך</label>
        <textarea
          id="review-comment"
          rows="4"
          [ngModel]="comment()"
          (ngModelChange)="comment.set($event)"
          name="comment"
          maxlength="1000"
          placeholder="ספרו לנו על החוויה, השירות, האוכל..."
        ></textarea>
        <span class="char-count">{{ comment().length }}/1000</span>
      </div>

      @if (error()) {
        <p class="form-error">{{ error() }}</p>
      }

      <div class="form-actions">
        <button type="submit" class="btn-primary" [disabled]="saving()">
          {{ saving() ? 'שולח...' : submitLabel() }}
        </button>
        <button type="button" class="btn-secondary" (click)="cancelled.emit()" [disabled]="saving()">
          ביטול
        </button>
      </div>
    </form>
  `,
  styleUrl: './review-form.component.scss',
})
export class ReviewFormComponent implements OnInit {
  readonly initialRating = input(0);
  readonly initialComment = input('');
  readonly saving = input(false);
  readonly submitLabel = input('שליחת חוות דעת');

  readonly submitted = output<ReviewFormValue>();
  readonly cancelled = output<void>();

  protected readonly rating = signal(0);
  protected readonly comment = signal('');
  protected readonly error = signal('');

  ngOnInit(): void {
    this.rating.set(this.initialRating());
    this.comment.set(this.initialComment());
  }

  protected setRating(value: number): void {
    this.rating.set(value);
    this.error.set('');
  }

  protected onSubmit(): void {
    if (this.rating() < 1) {
      this.error.set('יש לבחור דירוג בכוכבים');
      return;
    }
    if (!this.comment().trim()) {
      this.error.set('יש לכתוב חוות דעת');
      return;
    }
    this.error.set('');
    this.submitted.emit({ rating: this.rating(), comment: this.comment().trim() });
  }
}
