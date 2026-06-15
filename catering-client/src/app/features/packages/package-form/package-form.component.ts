import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { Package } from '../../../core/models/package.model';
import { Dish } from '../../../core/models/dish.model';
import { PackageService } from '../package.service';
import { DishService } from '../../dishes/dish.service';

@Component({
  selector: 'app-package-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="package-form">
      <h2>{{ pkg ? 'עריכת חבילה' : 'הוספת חבילה חדשה' }}</h2>
    
      <form (ngSubmit)="onSubmit()" class="form-body">
        <div class="form-group">
          <label for="pkg-name">שם החבילה *</label>
          <input
            id="pkg-name"
            name="name"
            [(ngModel)]="formData.name"
            required
            placeholder="הכנס שם חבילה"
            />
          </div>
    
          <div class="form-group">
            <label for="pkg-description">תיאור *</label>
            <textarea
              id="pkg-description"
              name="description"
              [(ngModel)]="formData.description"
              required
              rows="3"
              placeholder="תיאור קצר של החבילה"
            ></textarea>
          </div>
    
          <div class="form-group">
            <label for="pkg-price">מחיר (₪) *</label>
              <input
                id="pkg-price"
                name="price"
                type="number"
                [(ngModel)]="formData.price"
                required
                min="0"
                placeholder="0"
                />
            </div>
    
            <div class="form-group">
              <label for="pkg-imageUrl">קישור לתמונה (אופציונלי)</label>
                <input
                  id="pkg-imageUrl"
                  name="imageUrl"
                  [(ngModel)]="formData.imageUrl"
                  placeholder="https://..."
                  />
              </div>
    
              <div class="form-group">
                <label for="pkg-dishes">בחר מנות *</label>
                @if (allDishes().length > 0) {
                  <div class="dishes-select">
                    @for (dish of allDishes(); track dish) {
                      <label
                        class="dish-checkbox"
                        >
                        <input
                          type="checkbox"
                          [checked]="isDishSelected(dish.id)"
                          (change)="toggleDish(dish)"
                          />
                          <span>{{ dish.name }} — ₪{{ dish.price }}</span>
                        </label>
                      }
                    </div>
                  } @else {
                    <p class="loading-text">טוען מנות...</p>
                  }
                </div>
    
                @if (error()) {
                  <p class="error-msg">{{ error() }}</p>
                }
    
                <div class="form-actions">
                  <button type="submit" class="btn-primary" [disabled]="saving()">
                    {{ saving() ? 'שומר...' : (pkg ? 'עדכן חבילה' : 'הוסף חבילה') }}
                  </button>
                  <button type="button" class="btn-secondary" (click)="cancelled.emit()">ביטול</button>
                </div>
              </form>
            </div>
    `,
  styleUrl: './package-form.component.scss',
})
export class PackageFormComponent implements OnInit {
  private packageService = inject(PackageService);
  private dishService = inject(DishService);

  @Input() pkg: Package | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  saving = signal(false);
  error = signal('');
  allDishes = signal<Dish[]>([]);

  formData: Partial<Omit<Package, 'dishes'>> & { dishes?: Dish[] } = {
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    dishes: [],
  };

  ngOnInit(): void {
    this.dishService.getAll().subscribe({
      next: (dishes) => this.allDishes.set(dishes),
    });
    if (this.pkg) {
      this.formData = { ...this.pkg, dishes: [...this.pkg.dishes] };
    }
  }

  isDishSelected(id: string): boolean {
    return (this.formData.dishes ?? []).some((d) => d.id === id);
  }

  toggleDish(dish: Dish): void {
    const current = this.formData.dishes ?? [];
    if (this.isDishSelected(dish.id)) {
      this.formData.dishes = current.filter((d) => d.id !== dish.id);
    } else {
      this.formData.dishes = [...current, dish];
    }
  }

  onSubmit(): void {
    this.error.set('');
    this.saving.set(true);

    const payload: Partial<Package> = {
      name: this.formData.name,
      description: this.formData.description,
      price: this.formData.price,
      dishes: this.formData.dishes ?? [],
    };
    if (this.formData.imageUrl) payload.imageUrl = this.formData.imageUrl;

    const request$ = this.pkg
      ? this.packageService.update(this.pkg.id, payload)
      : this.packageService.create(payload);

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
