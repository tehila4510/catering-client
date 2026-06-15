import { Component, OnInit, signal, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Dish } from '../../../core/models/dish.model';
import { DishService } from '../dish.service';
import { AuthService } from '../../../core/services/auth.service';
import { DishCardComponent } from '../../../shared/components/dish-card/dish-card.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { DishFormComponent } from '../dish-form/dish-form.component';

@Component({
  selector: 'app-dish-list',
  standalone: true,
  imports: [FormsModule, DishCardComponent, LoaderComponent, DishFormComponent],
  template: `
    <section class="dishes-page">
      <div class="page-header">
        <h1>המנות שלנו</h1>
        <p class="label-caps">בחר את המנות האהובות עליך</p>
      </div>
    
      <div class="toolbar">
        <input
          class="search-input"
          type="text"
          placeholder="חיפוש לפי שם או קטגוריה..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearch()"
          />
          @if (authService.isAdmin()) {
            <button
              class="btn-primary"
              (click)="openCreateForm()"
            >+ הוספת מנה</button>
          }
        </div>
    
        @if (loading()) {
          <app-loader />
        }
    
        @if (!loading() && filtered().length === 0) {
          <div class="empty-state">
            <p>לא נמצאו מנות</p>
          </div>
        }
    
        @if (!loading()) {
          <div class="grid-3">
            @for (dish of filtered(); track dish) {
              <app-dish-card
                [dish]="dish"
                [isAdmin]="authService.isAdmin()"
                (edited)="openEditForm($event)"
                (deleted)="deleteDish($event)"
                />
            }
          </div>
        }
    
        @if (showForm()) {
          <div class="modal-overlay" role="button" tabindex="0" (click)="closeForm()" (keydown.escape)="closeForm()">
            <div class="modal-box" role="presentation" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
              <app-dish-form
                [dish]="editingDish()"
                (saved)="onDishSaved()"
                (cancelled)="closeForm()"
                />
              </div>
            </div>
          }
        </section>
    `,
  styleUrl: './dish-list.component.scss',
})
export class DishListComponent implements OnInit {
  private dishService = inject(DishService);
  authService = inject(AuthService);

  dishes = signal<Dish[]>([]);
  filtered = signal<Dish[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingDish = signal<Dish | null>(null);
  searchTerm = '';

  ngOnInit(): void {
    this.loadDishes();
  }

  loadDishes(): void {
    this.loading.set(true);
    this.dishService.getAll().subscribe({
      next: (data) => {
        this.dishes.set(data);
        this.filtered.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered.set(
      this.dishes().filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.category.toLowerCase().includes(term),
      ),
    );
  }

  openCreateForm(): void {
    this.editingDish.set(null);
    this.showForm.set(true);
  }

  openEditForm(dish: Dish): void {
    this.editingDish.set(dish);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingDish.set(null);
  }

  onDishSaved(): void {
    this.closeForm();
    this.loadDishes();
  }

  deleteDish(id: string): void {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המנה?')) return;
    this.dishService.delete(id).subscribe(() => this.loadDishes());
  }
}
