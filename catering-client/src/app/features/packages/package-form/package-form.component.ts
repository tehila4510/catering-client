import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { Package, PackageLimits } from '../../../core/models/package.model';
import { PackageService } from '../package.service';
import { DISH_CATEGORIES, PACKAGE_LIMIT_MAX } from '../../../core/constants/categories';
import { ToastService } from '../../../core/services/toast.service';

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
            <label for="pkg-price">מחיר לאדם (₪) *</label>
              <input
                id="pkg-price"
                name="pricePerPerson"
                type="number"
                [(ngModel)]="formData.pricePerPerson"
                required
                min="1"
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
                <label>כמות מנות לכל קטגוריה</label>
                <div class="limits-grid">
                  @for (cat of categories; track cat.value) {
                    <div class="limit-item">
                      <label [for]="'limit-' + cat.value">{{ cat.label }}</label>
                      <input
                        [id]="'limit-' + cat.value"
                        [name]="'limit-' + cat.value"
                        type="number"
                        min="0"
                        [max]="limitMax(cat.value)"
                        [(ngModel)]="formData.limits[cat.value]"
                        placeholder="0"
                        />
                      <span class="limit-hint">עד {{ limitMax(cat.value) }}</span>
                    </div>
                  }
                </div>
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
  private toast = inject(ToastService);

  @Input() pkg: Package | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  saving = signal(false);
  error = signal('');

  readonly categories: { value: keyof PackageLimits; label: string }[] =
    DISH_CATEGORIES.map((c) => ({
      value: c.value as keyof PackageLimits,
      label: c.label,
    }));

  formData: {
    name: string;
    description: string;
    pricePerPerson: number;
    imageUrl: string;
    limits: PackageLimits;
  } = {
    name: '',
    description: '',
    pricePerPerson: 0,
    imageUrl: '',
    limits: this.emptyLimits(),
  };

  ngOnInit(): void {
    if (this.pkg) {
      this.formData = {
        name: this.pkg.name,
        description: this.pkg.description,
        pricePerPerson: this.pkg.pricePerPerson,
        imageUrl: this.pkg.imageUrl ?? '',
        limits: { ...this.emptyLimits(), ...this.pkg.limits },
      };
    }
  }

  private emptyLimits(): PackageLimits {
    return {
      starters: 0,
      mainCourses: 0,
      salads: 0,
      desserts: 0,
      breads: 0,
      drinks: 0,
    };
  }

  onSubmit(): void {
    this.error.set('');
    this.saving.set(true);

    const payload: Partial<Package> = {
      name: this.formData.name,
      description: this.formData.description,
      pricePerPerson: Number(this.formData.pricePerPerson),
      limits: this.normalizeLimits(this.formData.limits),
    };
    if (this.formData.imageUrl) payload.imageUrl = this.formData.imageUrl;

    const request$ = this.pkg
      ? this.packageService.update(this.pkg.id, payload)
      : this.packageService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show(
          this.pkg ? 'החבילה עודכנה בהצלחה' : 'החבילה נוספה בהצלחה',
          'success',
        );
        this.saved.emit();
      },
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message || 'שגיאה בשמירה, נסה שוב');
        this.saving.set(false);
      },
    });
  }

  limitMax(category: keyof PackageLimits): number {
    return PACKAGE_LIMIT_MAX[category] ?? 15;
  }

  private normalizeLimits(limits: PackageLimits): PackageLimits {
    return {
      starters: Number(limits.starters) || 0,
      mainCourses: Number(limits.mainCourses) || 0,
      salads: Number(limits.salads) || 0,
      desserts: Number(limits.desserts) || 0,
      breads: Number(limits.breads) || 0,
      drinks: Number(limits.drinks) || 0,
    };
  }
}
