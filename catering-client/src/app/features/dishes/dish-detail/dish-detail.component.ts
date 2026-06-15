import { Component, OnInit, signal, input, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Dish } from '../../../core/models/dish.model';
import { DishService } from '../dish.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { categoryLabel } from '../../../core/constants/categories';

@Component({
  selector: 'app-dish-detail',
  standalone: true,
  imports: [RouterLink, LoaderComponent],
  template: `
    <section class="detail-page">
      @if (loading()) {
        <app-loader />
      }
    
      @if (!loading() && !dish()) {
        <div class="not-found">
          <p>המנה לא נמצאה</p>
          <a routerLink="/dishes" class="btn-secondary">חזרה למנות</a>
        </div>
      }
    
      @if (!loading() && dish(); as d) {
        <div class="detail-image">
          <img [src]="d.imageUrl || fallbackImage" [alt]="d.name" />
        </div>
        <div class="detail-content">
          <span class="badge label-caps">{{ categoryLabel(d.category) }}</span>
          <h1>{{ d.name }}</h1>
          <p class="description">{{ d.description }}</p>
          <a routerLink="/dishes" class="btn-secondary">← חזרה למנות</a>
        </div>
      }
    </section>
    `,
  styleUrl: './dish-detail.component.scss',
})
export class DishDetailComponent implements OnInit {
  private dishService = inject(DishService);

  readonly id = input<string>('');

  dish = signal<Dish | null>(null);
  loading = signal(true);

  readonly categoryLabel = categoryLabel;

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800';

  ngOnInit(): void {
    this.dishService.getAll().subscribe({
      next: (dishes) => {
        this.dish.set(dishes.find((d) => d.id === this.id()) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
