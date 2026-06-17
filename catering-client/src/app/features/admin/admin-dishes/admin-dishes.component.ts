import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Dish } from '../../../core/models/dish.model';
import { DishService } from '../../dishes/dish.service';
import { DishFormComponent } from '../../dishes/dish-form/dish-form.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../core/services/toast.service';
import { categoryLabel, DISH_CATEGORIES } from '../../../core/constants/categories';

@Component({
  selector: 'app-admin-dishes',
  standalone: true,
  imports: [FormsModule, DishFormComponent, LoaderComponent],
  template: `
    <div class="admin-section">
      <div class="section-header">
        <h1>ניהול מנות</h1>
        <button class="btn-primary" (click)="openCreateForm()">+ הוספת מנה</button>
      </div>

      <div class="toolbar">
        <input
          class="search-input"
          type="text"
          placeholder="חפש לפי שם מנה או קטגוריה..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="applyFilters()"
        />
        <select
          class="category-select"
          [(ngModel)]="selectedCategory"
          (ngModelChange)="applyFilters()"
          aria-label="סינון לפי קטגוריה"
        >
          <option value="">כל הקטגוריות</option>
          @for (cat of categories; track cat.value) {
            <option [value]="cat.value">{{ cat.label }}</option>
          }
        </select>
        @if (searchTerm || selectedCategory) {
          <button class="btn-secondary" (click)="clearFilters()">נקה סינון</button>
        }
      </div>

      @if (loading()) {
        <app-loader />
      }

      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">לא נמצאו מנות</div>
      }

      @if (!loading() && filtered().length > 0) {
        <div class="admin-table">
          <div class="table-head">
            <span class="col-name">שם המנה</span>
            <span class="col-cat">קטגוריה</span>
            <span class="col-actions">פעולות</span>
          </div>
          @for (dish of filtered(); track dish.id) {
            <div class="table-row">
              <span class="col-name">{{ dish.name }}</span>
              <span class="col-cat">{{ categoryLabel(dish.category) }}</span>
              <span class="col-actions">
                <button class="btn-edit" (click)="openEditForm(dish)">עריכה</button>
                <button class="btn-delete" (click)="deleteDish(dish)">מחיקה</button>
              </span>
            </div>
          }
        </div>
      }

      @if (showForm()) {
        <div
          class="modal-overlay"
          role="button"
          tabindex="0"
          (click)="closeForm()"
          (keydown.escape)="closeForm()"
        >
          <div
            class="modal-box"
            role="presentation"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <app-dish-form
              [dish]="editingDish()"
              (saved)="onSaved()"
              (cancelled)="closeForm()"
            />
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-dishes.component.scss',
})
export class AdminDishesComponent implements OnInit {
  private dishService = inject(DishService);
  private toast = inject(ToastService);

  readonly categoryLabel = categoryLabel;
  readonly categories = DISH_CATEGORIES;

  dishes = signal<Dish[]>([]);
  filtered = signal<Dish[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingDish = signal<Dish | null>(null);
  searchTerm = '';
  selectedCategory = '';

  ngOnInit(): void {
    this.loadDishes();
  }

  loadDishes(): void {
    this.loading.set(true);
    this.dishService.getAll().subscribe({
      next: (data) => {
        this.dishes.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const category = this.selectedCategory;
    this.filtered.set(
      this.dishes().filter((d) => {
        const matchesTerm =
          !term ||
          d.name.toLowerCase().includes(term) ||
          categoryLabel(d.category).toLowerCase().includes(term);
        const matchesCategory = !category || d.category === category;
        return matchesTerm && matchesCategory;
      }),
    );
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.applyFilters();
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

  onSaved(): void {
    this.closeForm();
    this.loadDishes();
  }

  deleteDish(dish: Dish): void {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המנה "${dish.name}"?`)) return;
    this.dishService.delete(dish.id).subscribe(() => {
      this.toast.show('המנה נמחקה בהצלחה', 'success');
      this.loadDishes();
    });
  }
}
