import { Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div
      class="stars"
      [class.interactive]="!readonly()"
      role="img"
      [attr.aria-label]="value() + ' מתוך 5 כוכבים'"
      dir="ltr"
    >
      @for (star of stars; track star) {
        <button
          type="button"
          class="star"
          [class.filled]="star <= displayValue()"
          [disabled]="readonly()"
          (click)="select(star)"
          (mouseenter)="hover(star)"
          (mouseleave)="hover(0)"
          [attr.aria-label]="star + ' כוכבים'"
        >
          ★
        </button>
      }
    </div>
  `,
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  readonly value = input(0);
  readonly readonly = input(false);
  readonly changed = output<number>();

  protected readonly stars = [1, 2, 3, 4, 5];
  private readonly hovered = signal(0);

  protected readonly displayValue = computed(() =>
    this.hovered() > 0 ? this.hovered() : this.value(),
  );

  protected select(star: number): void {
    if (this.readonly()) return;
    this.changed.emit(star);
  }

  protected hover(star: number): void {
    if (this.readonly()) return;
    this.hovered.set(star);
  }
}
