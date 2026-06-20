import { Component, OnInit, input, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Package } from '../../../core/models/package.model';
import { Dish } from '../../../core/models/dish.model';
import { PackageService } from '../../packages/package.service';
import { DishService } from '../../dishes/dish.service';
import { OrderService } from '../order.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PaypalPaymentComponent } from '../../../shared/components/paypal-payment/paypal-payment.component';
import { CATEGORY_LABELS } from '../../../core/constants/categories';

interface CategoryGroup {
  key: string;
  label: string;
  limit: number;
  dishes: Dish[];
}

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [FormsModule, LoaderComponent, PaypalPaymentComponent],
  template: `
    <section class="order-page">
      @if (loading()) {
        <app-loader />
      }

      @if (!loading() && !pkg()) {
        <div class="not-found">
          <p>החבילה לא נמצאה</p>
          <button type="button" class="btn-secondary" (click)="goToPackages()">
            חזרה לחבילות
          </button>
        </div>
      }

      @if (!loading() && pkg(); as p) {
        <div class="order-card">
          <h1>הזמנת חבילה: {{ p.name }}</h1>
          <p class="price-line">
            <span class="label-caps">מחיר לאדם</span>
            <span class="gold-text">₪{{ p.pricePerPerson }}</span>
          </p>

          <ol class="steps">
            <li [class.active]="step() === 1" [class.done]="step() > 1">1. בחירת מנות</li>
            <li [class.active]="step() === 2" [class.done]="step() > 2">2. פרטי האירוע</li>
            <li [class.active]="step() === 3">3. תשלום</li>
          </ol>

          <!-- Step 1: dish selection -->
          @if (step() === 1) {
            <div class="dish-step">
              @for (cat of categories(); track cat.key) {
                <div class="category-block">
                  <div class="category-head">
                    <h2>{{ cat.label }}</h2>
                    <span
                      class="counter label-caps"
                      [class.complete]="countFor(cat.key) === cat.limit"
                    >
                      נבחרו {{ countFor(cat.key) }}/{{ cat.limit }}
                    </span>
                  </div>
                  <p class="category-hint">בחר עד {{ cat.limit }} {{ cat.label }}</p>

                  @if (cat.dishes.length === 0) {
                    <p class="empty-cat">אין מנות זמינות בקטגוריה זו</p>
                  }

                  <div class="dish-grid">
                    @for (dish of cat.dishes; track dish.id) {
                      <button
                        type="button"
                        class="dish-option"
                        [class.selected]="isSelected(cat.key, dish.id)"
                        [disabled]="
                          !isSelected(cat.key, dish.id) &&
                          countFor(cat.key) >= cat.limit
                        "
                        (click)="toggleDish(cat.key, dish.id, cat.limit)"
                      >
                        <img
                          [src]="dish.imageUrl || fallbackDishImage"
                          [alt]="dish.name"
                          loading="lazy"
                        />
                        <span class="dish-name">{{ dish.name }}</span>
                        @if (isSelected(cat.key, dish.id)) {
                          <span class="check">✓</span>
                        }
                      </button>
                    }
                  </div>
                </div>
              } @empty {
                <p class="empty-cat">בחבילה זו אין מנות לבחירה</p>
              }

              <div class="form-actions">
                @if (selectionComplete()) {
                  <button type="button" class="btn-primary" (click)="goToStep2()">
                    המשך
                  </button>
                } @else {
                  <button type="button" class="btn-primary" disabled>
                    יש להשלים את בחירת המנות
                  </button>
                }
                <button type="button" class="btn-secondary" (click)="goToPackages()">
                  ביטול
                </button>
              </div>
            </div>
          }

          <!-- Step 2: event details -->
          @if (step() === 2) {
            <form (ngSubmit)="onSubmit()" #orderForm="ngForm" class="form-body">
              <div class="form-group">
                <label for="guests">מספר אורחים *</label>
                <input
                  id="guests"
                  name="guests"
                  type="number"
                  min="1"
                  [(ngModel)]="numberOfGuests"
                  required
                  placeholder="0"
                />
              </div>

              <div class="form-group">
                <label for="eventDate">תאריך האירוע *</label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  [min]="todayDateString"
                  [(ngModel)]="eventDate"
                  (ngModelChange)="onDateChange($event)"
                  required
                />
                @if (checkingDate()) {
                  <span class="date-hint">בודק זמינות תאריך...</span>
                }
                @if (dateError()) {
                  <span class="error-msg">{{ dateError() }}</span>
                }
              </div>

              <div class="form-group">
                <label for="address">כתובת האירוע *</label>
                <input
                  id="address"
                  name="address"
                  [(ngModel)]="address"
                  required
                  placeholder="רחוב, עיר"
                />
              </div>

              <p class="total-line">
                <span class="label-caps">סה״כ משוער</span>
                <span class="gold-text">₪{{ estimatedTotal() }}</span>
              </p>

              @if (error()) {
                <p class="error-msg">{{ error() }}</p>
              }

              <div class="form-actions">
                <button
                  type="submit"
                  class="btn-primary"
                  [disabled]="saving() || checkingDate() || !!dateError()"
                >
                  {{ saving() ? 'יוצר הזמנה...' : 'המשך לתשלום' }}
                </button>
                <button type="button" class="btn-secondary" (click)="backToDishes()">
                  → חזרה לבחירת מנות
                </button>
              </div>
            </form>
          }

          <!-- Step 3: payment -->
          @if (step() === 3 && createdOrderId(); as orderId) {
            <div class="payment-step">
              <p class="total-line">
                <span class="label-caps">סה״כ לתשלום</span>
                <span class="gold-text">₪{{ estimatedTotal() }}</span>
              </p>

              <app-paypal-payment
                [orderId]="orderId"
                (paymentSuccess)="onPaymentSuccess()"
              />
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent implements OnInit {
  private packageService = inject(PackageService);
  private dishService = inject(DishService);
  private orderService = inject(OrderService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly packageId = input<string>('');

  readonly fallbackDishImage =
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600';

  pkg = signal<Package | null>(null);
  allDishes = signal<Dish[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  step = signal<1 | 2 | 3>(1);

  // Map of category key -> selected dish ids.
  selections = signal<Record<string, string[]>>({});

  numberOfGuests = 1;
  eventDate = '';
  address = '';

  checkingDate = signal(false);
  dateError = signal('');

  // Today's date as a local YYYY-MM-DD string, used to block past dates in the picker.
  readonly todayDateString = this.getTodayDateString();

  createdOrderId = signal('');

  categories = computed<CategoryGroup[]>(() => {
    const p = this.pkg();
    if (!p?.limits) return [];
    const dishes = this.allDishes();
    return Object.entries(p.limits)
      .filter(([, limit]) => (limit ?? 0) > 0)
      .map(([key, limit]) => ({
        key,
        label: CATEGORY_LABELS[key] ?? key,
        limit: limit ?? 0,
        dishes: dishes.filter((d) => d.category === key),
      }));
  });

  countFor(category: string): number {
    return (this.selections()[category] ?? []).length;
  }

  isSelected(category: string, dishId: string): boolean {
    return (this.selections()[category] ?? []).includes(dishId);
  }

  toggleDish(category: string, dishId: string, limit: number): void {
    const current = this.selections();
    const list = current[category] ?? [];
    let next: string[];
    if (list.includes(dishId)) {
      next = list.filter((id) => id !== dishId);
    } else {
      if (list.length >= limit) return; // enforce per-category limit
      next = [...list, dishId];
    }
    this.selections.set({ ...current, [category]: next });
  }

  selectionComplete(): boolean {
    const cats = this.categories();
    if (!cats.length) return false;
    return cats.every((c) => this.countFor(c.key) === c.limit);
  }

  selectedItems(): string[] {
    return Object.values(this.selections()).flat();
  }

  estimatedTotal(): number {
    const p = this.pkg();
    if (!p) return 0;
    return p.pricePerPerson * (Number(this.numberOfGuests) || 0);
  }

  ngOnInit(): void {
    forkJoin({
      packages: this.packageService.getAll(),
      dishes: this.dishService.getAll(),
    }).subscribe({
      next: ({ packages, dishes }) => {
        this.pkg.set(packages.find((p) => p.id === this.packageId()) ?? null);
        this.allDishes.set(dishes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToStep2(): void {
    if (!this.selectionComplete()) return;
    this.step.set(2);
  }

  backToDishes(): void {
    this.step.set(1);
  }

  onDateChange(date: string): void {
    this.dateError.set('');
    if (!date) return;

    // Reject past dates before hitting the server for the per-day availability check.
    if (date < this.todayDateString) {
      this.dateError.set('לא ניתן לבחור תאריך שעבר');
      return;
    }

    this.checkingDate.set(true);
    this.orderService.getCountByDate(date).subscribe({
      next: (count) => {
        if (count >= 2) {
          this.dateError.set('התאריך שבחרת עמוס מדי, אנא בחר תאריך אחר');
        }
        this.checkingDate.set(false);
      },
      error: () => this.checkingDate.set(false),
    });
  }

  // Returns today's date as a local YYYY-MM-DD string (avoids UTC off-by-one).
  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    const p = this.pkg();
    if (!p) return;

    if (this.dateError()) return;
    if (this.checkingDate()) return;

    if (Number(this.numberOfGuests) < 1 || !this.eventDate || !this.address.trim()) {
      this.error.set('יש למלא את כל השדות');
      return;
    }

    // Defensive client-side check in case the picker's [min] was bypassed.
    if (this.eventDate < this.todayDateString) {
      this.dateError.set('לא ניתן לבחור תאריך שעבר');
      return;
    }

    this.error.set('');
    this.saving.set(true);

    // Create our internal order first. It stays "ממתין לתשלום" (pending) until a
    // PayPal capture is confirmed server-side — we never mark it paid from here.
    this.orderService
      .create({
        packageId: p.id,
        selectedItems: this.selectedItems(),
        numberOfGuests: Number(this.numberOfGuests),
        eventDate: this.eventDate,
        address: this.address.trim(),
        totalPrice: this.estimatedTotal(),
      })
      .subscribe({
        next: (order) => {
          this.saving.set(false);
          this.createdOrderId.set(order.id);
          this.step.set(3);
        },
        error: (e: { error?: { message?: string } }) => {
          this.error.set(e.error?.message || 'שליחת ההזמנה נכשלה, נסה שוב');
          this.saving.set(false);
        },
      });
  }

  onPaymentSuccess(): void {
    this.toast.show('התשלום בוצע בהצלחה! ההזמנה אושרה', 'success');
    this.router.navigate(['/profile']);
  }

  goToPackages(): void {
    this.router.navigate(['/packages']);
  }
}
