import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { Dish } from '../../../core/models/dish.model';
import { DishService } from '../dish.service';
import { DISH_CATEGORIES } from '../../../core/constants/categories';

@Component({
  selector: 'app-dish-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dish-form">
      <h2>{{ dish ? 'עריכת מנה' : 'הוספת מנה חדשה' }}</h2>
    
      <form (ngSubmit)="onSubmit()" #formRef="ngForm" class="form-body">
        <div class="form-group">
          <label for="dish-name">שם המנה *</label>
          <input
            id="dish-name"
            name="name"
            [(ngModel)]="formData.name"
            required
            placeholder="הכנס שם מנה"
            />
          </div>
    
          <div class="form-group">
            <label for="dish-description">תיאור *</label>
            <textarea
              id="dish-description"
              name="description"
              [(ngModel)]="formData.description"
              required
              rows="3"
              placeholder="תיאור קצר של המנה"
            ></textarea>
          </div>
    
          <div class="form-group">
            <label for="dish-category">קטגוריה *</label>
            <select
              id="dish-category"
              name="category"
              [(ngModel)]="formData.category"
              required
              >
              <option value="" disabled>בחר קטגוריה</option>
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.label }}</option>
              }
            </select>
          </div>
    
              <div class="form-group">
                <label for="dish-imageUrl">קישור לתמונה (אופציונלי)</label>
                <input
                  id="dish-imageUrl"
                  name="imageUrl"
                  [(ngModel)]="formData.imageUrl"
                  placeholder="https://..."
                  />
                </div>
    
                @if (error()) {
                  <p class="error-msg">{{ error() }}</p>
                }
    
                <div class="form-actions">
                  <button type="submit" class="btn-primary" [disabled]="saving()">
                    {{ saving() ? 'שומר...' : (dish ? 'עדכן מנה' : 'הוסף מנה') }}
                  </button>
                  <button type="button" class="btn-secondary" (click)="cancelled.emit()">ביטול</button>
                </div>
              </form>
            </div>
    `,
  styleUrl: './dish-form.component.scss',
})
export class DishFormComponent implements OnInit {
  private dishService = inject(DishService);

  @Input() dish: Dish | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  saving = signal(false);
  error = signal('');

  readonly categories = DISH_CATEGORIES;

  formData: Partial<Dish> = {
    name: '',
    description: '',
    category: '',
    imageUrl: '',
  };

  ngOnInit(): void {
    if (this.dish) {
      this.formData = { ...this.dish };
    }
  }

  onSubmit(): void {
    this.error.set('');
    this.saving.set(true);

    const payload = { ...this.formData };
    if (!payload.imageUrl) delete payload.imageUrl;

    const request$ = this.dish
      ? this.dishService.update(this.dish.id, payload)
      : this.dishService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message || 'שגיאה בשמירה, נסה שוב');
        this.saving.set(false);
      },
    });
  }
}
