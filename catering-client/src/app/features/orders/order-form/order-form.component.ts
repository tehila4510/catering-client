import { Component, OnInit, input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Package } from '../../../core/models/package.model';
import { PackageService } from '../../packages/package.service';
import { OrderService } from '../order.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [FormsModule, LoaderComponent],
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
                [(ngModel)]="eventDate"
                required
                />
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
              <button type="submit" class="btn-primary" [disabled]="saving()">
                {{ saving() ? 'שולח...' : 'אישור הזמנה' }}
              </button>
              <button type="button" class="btn-secondary" (click)="goToPackages()">
                ביטול
              </button>
            </div>
          </form>
        </div>
      }
    </section>
  `,
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent implements OnInit {
  private packageService = inject(PackageService);
  private orderService = inject(OrderService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly packageId = input<string>('');

  pkg = signal<Package | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  numberOfGuests = 1;
  eventDate = '';
  address = '';

  estimatedTotal(): number {
    const p = this.pkg();
    if (!p) return 0;
    return p.pricePerPerson * (Number(this.numberOfGuests) || 0);
  }

  ngOnInit(): void {
    this.packageService.getAll().subscribe({
      next: (packages) => {
        this.pkg.set(packages.find((p) => p.id === this.packageId()) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSubmit(): void {
    const p = this.pkg();
    if (!p) return;

    if (Number(this.numberOfGuests) < 1 || !this.eventDate || !this.address.trim()) {
      this.error.set('יש למלא את כל השדות');
      return;
    }

    this.error.set('');
    this.saving.set(true);

    this.orderService
      .create({
        packageId: p.id,
        numberOfGuests: Number(this.numberOfGuests),
        eventDate: this.eventDate,
        address: this.address.trim(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.show('ההזמנה נשלחה בהצלחה!', 'success');
          this.router.navigate(['/profile']);
        },
        error: (e: { error?: { message?: string } }) => {
          this.error.set(e.error?.message || 'שליחת ההזמנה נכשלה, נסה שוב');
          this.saving.set(false);
        },
      });
  }

  goToPackages(): void {
    this.router.navigate(['/packages']);
  }
}
