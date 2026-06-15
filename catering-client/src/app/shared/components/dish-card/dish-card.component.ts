import { Component, Input, Output, EventEmitter } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Dish } from '../../../core/models/dish.model';
import { categoryLabel } from '../../../core/constants/categories';

@Component({
  selector: 'app-dish-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card dish-card">
      <div class="card-image">
        <img
          [src]="dish.imageUrl || fallbackImage"
          [alt]="dish.name"
          loading="lazy"
          />
          <span class="badge label-caps">{{ categoryLabel(dish.category) }}</span>
        </div>
        <div class="card-body">
          <h3>{{ dish.name }}</h3>
          <p class="description">{{ dish.description }}</p>
          <div class="card-actions">
            <a class="btn-secondary btn-sm" [routerLink]="['/dishes', dish.id]">פרטים</a>
            @if (isAdmin) {
              <button class="btn-secondary btn-sm" (click)="edited.emit(dish)">עריכה</button>
              <button class="btn-delete btn-sm" (click)="deleted.emit(dish.id)">מחיקה</button>
            }
          </div>
        </div>
      </article>
    `,
  styleUrl: './dish-card.component.scss',
})
export class DishCardComponent {
  @Input({ required: true }) dish!: Dish;
  @Input() isAdmin = false;
  @Output() edited = new EventEmitter<Dish>();
  @Output() deleted = new EventEmitter<string>();

  readonly categoryLabel = categoryLabel;

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800';
}
