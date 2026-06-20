import { Component, Input, Output, EventEmitter } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Package } from '../../../core/models/package.model';

@Component({
  selector: 'app-package-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card package-card">
      <div class="card-image">
        <img
          [src]="pkg.imageUrl || fallbackImage"
          [alt]="pkg.name"
          loading="lazy"
          />
          <span class="dish-count-badge label-caps">עד {{ totalDishes }} מנות</span>
        </div>
        <div class="card-body">
          <h3>{{ pkg.name }}</h3>
          <p class="description">{{ pkg.description }}</p>
          <p class="price gold-text">₪{{ pkg.pricePerPerson }} <span class="per-person">לאדם</span></p>
          <p class="min-guests">מינימום {{ pkg.minGuests }} אורחים</p>
          <div class="card-actions">
            <a class="btn-secondary btn-sm" [routerLink]="['/packages', pkg.id]">פרטים</a>
            @if (isAdmin) {
              <button class="btn-secondary btn-sm" (click)="edited.emit(pkg)">עריכה</button>
              <button class="btn-delete btn-sm" (click)="deleted.emit(pkg.id)">מחיקה</button>
            }
          </div>
        </div>
      </article>
    `,
  styleUrl: './package-card.component.scss',
})
export class PackageCardComponent {
  @Input({ required: true }) pkg!: Package;
  @Input() isAdmin = false;
  @Output() edited = new EventEmitter<Package>();
  @Output() deleted = new EventEmitter<string>();

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800';

  get totalDishes(): number {
    const l = this.pkg?.limits;
    if (!l) return 0;
    return (
      (l.starters || 0) +
      (l.mainCourses || 0) +
      (l.salads || 0) +
      (l.desserts || 0) +
      (l.breads || 0) +
      (l.drinks || 0)
    );
  }
}
