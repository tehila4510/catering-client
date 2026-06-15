import { Component, OnInit, signal, input, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Package } from '../../../core/models/package.model';
import { PackageService } from '../package.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-package-detail',
  standalone: true,
  imports: [RouterLink, LoaderComponent],
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
            <h2>מנות בחבילה</h2>
            <ul>
              @for (dish of p.dishes; track dish) {
                <li>
                  <span class="dish-name">{{ dish.name }}</span>
                  <span class="dish-price gold-text">₪{{ dish.price }}</span>
                </li>
              }
            </ul>
          </div>
          <p class="total-price">
            <span class="label-caps">מחיר כולל</span>
            <span class="price gold-text">₪{{ p.price }}</span>
          </p>
          <a routerLink="/packages" class="btn-secondary">← חזרה לחבילות</a>
        </div>
      }
    </section>
    `,
  styleUrl: './package-detail.component.scss',
})
export class PackageDetailComponent implements OnInit {
  private packageService = inject(PackageService);

  readonly id = input<string>('');

  pkg = signal<Package | null>(null);
  loading = signal(true);

  readonly fallbackImage =
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800';

  ngOnInit(): void {
    this.packageService.getAll().subscribe({
      next: (packages) => {
        this.pkg.set(packages.find((p) => p.id === this.id()) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
