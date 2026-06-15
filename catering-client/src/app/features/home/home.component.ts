import { Component, OnInit, signal, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Dish } from '../../core/models/dish.model';
import { Package } from '../../core/models/package.model';
import { DishService } from '../dishes/dish.service';
import { PackageService } from '../packages/package.service';
import { DishCardComponent } from '../../shared/components/dish-card/dish-card.component';
import { PackageCardComponent } from '../../shared/components/package-card/package-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DishCardComponent, PackageCardComponent, LoaderComponent],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>קייטרינג מרהיב,<br/>מותאם עבורך</h1>
        <p class="subtitle">מנות פרמיום וחבילות מאוצרות לכל אירוע</p>
        <div class="hero-actions">
          <a routerLink="/dishes" class="btn-primary">גלה מנות</a>
          <a routerLink="/packages" class="btn-secondary">חבילות שלנו</a>
        </div>
      </div>
      <div class="hero-overlay"></div>
    </section>
    
    <!-- Featured Dishes -->
    <section class="featured-section">
      <div class="section-header">
        <h2>המנות הנבחרות שלנו</h2>
        <p class="label-caps">טעמים שלא תשכח</p>
      </div>
    
      @if (loadingDishes()) {
        <app-loader />
      }
    
      @if (!loadingDishes()) {
        <div class="grid-3 featured-grid">
          @for (dish of featuredDishes(); track dish) {
            <app-dish-card
              [dish]="dish"
              [isAdmin]="false"
              />
          }
        </div>
      }
    
      <div class="section-footer">
        <a routerLink="/dishes" class="btn-secondary">לכל המנות</a>
      </div>
    </section>
    
    <!-- Featured Packages -->
    <section class="featured-section packages-section">
      <div class="section-header">
        <h2>חבילות מאוצרות</h2>
        <p class="label-caps">כל מה שצריך לאירוע מושלם</p>
      </div>
    
      @if (loadingPackages()) {
        <app-loader />
      }
    
      @if (!loadingPackages()) {
        <div class="grid-3 featured-grid">
          @for (pkg of featuredPackages(); track pkg) {
            <app-package-card
              [pkg]="pkg"
              [isAdmin]="false"
              />
          }
        </div>
      }
    
      <div class="section-footer">
        <a routerLink="/packages" class="btn-secondary">לכל החבילות</a>
      </div>
    </section>
    `,
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private dishService = inject(DishService);
  private packageService = inject(PackageService);

  featuredDishes = signal<Dish[]>([]);
  featuredPackages = signal<Package[]>([]);
  loadingDishes = signal(true);
  loadingPackages = signal(true);

  ngOnInit(): void {
    this.dishService.getAll().subscribe({
      next: (dishes) => {
        this.featuredDishes.set(dishes.slice(0, 3));
        this.loadingDishes.set(false);
      },
      error: () => this.loadingDishes.set(false),
    });

    this.packageService.getAll().subscribe({
      next: (packages) => {
        this.featuredPackages.set(packages.slice(0, 3));
        this.loadingPackages.set(false);
      },
      error: () => this.loadingPackages.set(false),
    });
  }
}
