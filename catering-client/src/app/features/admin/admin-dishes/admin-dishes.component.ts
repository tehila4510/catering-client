import { Component, OnInit, signal, inject } from '@angular/core';

import { Dish } from '../../../core/models/dish.model';
import { DishService } from '../../dishes/dish.service';
import { DishFormComponent } from '../../dishes/dish-form/dish-form.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../core/services/toast.service';
import { categoryLabel } from '../../../core/constants/categories';

@Component({
  selector: 'app-admin-dishes',
  standalone: true,
  imports: [DishFormComponent, LoaderComponent],
  template: `
    <div class="admin-section">
      <div class="section-header">
        <h1>ניהול מנות</h1>
        <button class="btn-primary" (click)="openCreateForm()">+ הוספת מנה</button>
      </div>

      @if (loading()) {
        <app-loader />
      }

      @if (!loading() && dishes().length === 0) {
        <div class="empty-state">לא נמצאו מנות</div>
      }

      @if (!loading() && dishes().length > 0) {
        <div class="admin-table">
          <div class="table-head">
            <span class="col-name">שם המנה</span>
            <span class="col-cat">קטגוריה</span>
            <span class="col-actions">פעולות</span>
          </div>
          @for (dish of dishes(); track dish.id) {
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

  dishes = signal<Dish[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingDish = signal<Dish | null>(null);

  ngOnInit(): void {
    this.loadDishes();
  }

  loadDishes(): void {
    this.loading.set(true);
    this.dishService.getAll().subscribe({
      next: (data) => {
        this.dishes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
