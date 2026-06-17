import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

import {
  Order,
  OrderFullDetails,
  UpdateOrderDto,
  orderStatusLabel,
} from '../../../core/models/order.model';
import { Package } from '../../../core/models/package.model';
import { Dish } from '../../../core/models/dish.model';
import { OrderService } from '../../orders/order.service';
import { PackageService } from '../../packages/package.service';
import { DishService } from '../../dishes/dish.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../core/services/toast.service';
import { CATEGORY_LABELS } from '../../../core/constants/categories';

interface CategoryGroup {
  key: string;
  label: string;
  limit: number;
  dishes: Dish[];
}

interface OrderEditModel {
  packageId: string;
  selectedItems: string[];
  numberOfGuests: number;
  eventDate: string;
  address: string;
  isApproved: boolean;
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, LoaderComponent],
  template: `
    <div class="admin-section">
      <div class="section-header">
        <h1>ניהול הזמנות</h1>
      </div>

      <div class="filters">
        <input
          class="filter-input"
          type="text"
          placeholder="חיפוש לפי שם או אימייל לקוח..."
          [ngModel]="customerTerm()"
          (ngModelChange)="customerTerm.set($event)"
        />
        <div class="date-filter">
          <label>מתאריך:</label>
          <input
            class="filter-input"
            type="date"
            [ngModel]="startDate()"
            (ngModelChange)="startDate.set($event)"
          />
        </div>
        <div class="date-filter">
          <label>עד תאריך:</label>
          <input
            class="filter-input"
            type="date"
            [ngModel]="endDate()"
            (ngModelChange)="endDate.set($event)"
          />
        </div>
        <button class="btn-secondary" (click)="clearFilters()">נקה סינון</button>
      </div>

      @if (loading()) {
        <app-loader />
      }

      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">לא נמצאו הזמנות</div>
      }

      @if (!loading() && filtered().length > 0) {
        <div class="orders-grid">
          @for (order of filtered(); track order.id) {
            <div class="order-card">
              <div class="order-header">
                <span class="customer">{{ order.userName || 'לקוח' }}</span>
                <span
                  class="status-badge"
                  [class.approved]="order.isApproved"
                  [class.pending]="!order.isApproved"
                >{{ statusLabel(order) }}</span>
              </div>
              <div class="order-body">
                <div class="row"><span class="lbl">אימייל:</span><span>{{ order.userEmail }}</span></div>
                <div class="row"><span class="lbl">חבילה:</span><span>{{ order.packageName }}</span></div>
                <div class="row"><span class="lbl">מס' אורחים:</span><span>{{ order.numberOfGuests }}</span></div>
                <div class="row"><span class="lbl">תאריך אירוע:</span><span>{{ order.eventDate | date: 'd בMMMM yyyy' : '' : 'he' }}</span></div>
                <div class="row"><span class="lbl">כתובת:</span><span>{{ order.address }}</span></div>
                <div class="row"><span class="lbl">מחיר כולל:</span><span>₪{{ order.totalPrice }}</span></div>
              </div>
              <div class="order-actions">
                <button class="btn-details" (click)="openDetails(order)">פרטים מלאים</button>
                @if (!order.isApproved) {
                  <button class="btn-edit" (click)="openEdit(order)">עדכון</button>
                  <button class="btn-delete" (click)="deleteOrder(order)">מחיקה</button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Edit Modal -->
      @if (editing(); as order) {
        <div
          class="modal-overlay"
          role="button"
          tabindex="0"
          (click)="closeEdit()"
          (keydown.escape)="closeEdit()"
        >
          <div
            class="modal-box edit-box"
            role="presentation"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <h2>עדכון הזמנה</h2>

            @if (editLoadingDetails()) {
              <app-loader />
            } @else {
              <form (ngSubmit)="saveEdit()" class="edit-form">

                <!-- Package selector -->
                <div class="form-group">
                  <label for="ord-pkg">חבילה</label>
                  <select
                    id="ord-pkg"
                    name="pkg"
                    [ngModel]="editModel().packageId"
                    (ngModelChange)="onPackageChange($event)"
                    required
                  >
                    @for (pkg of packages(); track pkg.id) {
                      <option [value]="pkg.id">{{ pkg.name }} — ₪{{ pkg.pricePerPerson }} לאדם</option>
                    }
                  </select>
                </div>

                <!-- Dish selection by category -->
                @if (editCategories().length > 0) {
                  <div class="dishes-section">
                    <h3 class="dishes-title">בחירת מנות</h3>
                    @for (cat of editCategories(); track cat.key) {
                      <div class="category-block">
                        <div class="cat-header">
                          <span class="cat-label">{{ cat.label }}</span>
                          <span
                            class="cat-counter"
                            [class.complete]="editCountFor(cat.key) === cat.limit"
                          >{{ editCountFor(cat.key) }}/{{ cat.limit }}</span>
                        </div>
                        <div class="dish-checks">
                          @for (dish of cat.dishes; track dish.id) {
                            <label
                              class="dish-check"
                              [class.disabled]="!isDishSelected(dish.id) && editCountFor(cat.key) >= cat.limit"
                            >
                              <input
                                type="checkbox"
                                [checked]="isDishSelected(dish.id)"
                                [disabled]="!isDishSelected(dish.id) && editCountFor(cat.key) >= cat.limit"
                                (change)="toggleDishEdit(cat.key, dish.id, cat.limit)"
                              />
                              {{ dish.name }}
                            </label>
                          }
                          @if (cat.dishes.length === 0) {
                            <span class="no-dishes">אין מנות בקטגוריה זו</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <div class="form-group">
                  <label for="ord-guests">מספר אורחים</label>
                  <input
                    id="ord-guests"
                    name="guests"
                    type="number"
                    min="1"
                    [ngModel]="editModel().numberOfGuests"
                    (ngModelChange)="patchEdit({ numberOfGuests: +$event })"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="ord-date">תאריך אירוע</label>
                  <input
                    id="ord-date"
                    name="date"
                    type="date"
                    [ngModel]="editModel().eventDate"
                    (ngModelChange)="onEditDateChange($event)"
                    required
                  />
                  @if (editCheckingDate()) {
                    <span class="date-hint">בודק זמינות תאריך...</span>
                  }
                  @if (editDateError()) {
                    <span class="date-error">{{ editDateError() }}</span>
                  }
                </div>
                <div class="form-group">
                  <label for="ord-address">כתובת</label>
                  <input
                    id="ord-address"
                    name="address"
                    [ngModel]="editModel().address"
                    (ngModelChange)="patchEdit({ address: $event })"
                    required
                  />
                </div>

                <p class="total-estimate">
                  <span>מחיר משוער:</span>
                  <span class="gold-text">₪{{ estimatedTotal() }}</span>
                </p>

                <label class="checkbox-row">
                  <input
                    type="checkbox"
                    name="approve"
                    [ngModel]="editModel().isApproved"
                    (ngModelChange)="patchEdit({ isApproved: $event })"
                  />
                  <span>אשר את ההזמנה</span>
                </label>

                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn-primary"
                    [disabled]="saving() || editCheckingDate() || !!editDateError()"
                  >
                    {{ saving() ? 'שומר...' : editCheckingDate() ? 'בודק תאריך...' : 'שמור שינויים' }}
                  </button>
                  <button type="button" class="btn-secondary" (click)="closeEdit()">ביטול</button>
                </div>
              </form>
            }
          </div>
        </div>
      }

      <!-- Details Modal -->
      @if (detailsOpen()) {
        <div
          class="modal-overlay"
          role="button"
          tabindex="0"
          (click)="closeDetails()"
          (keydown.escape)="closeDetails()"
        >
          <div
            class="modal-box details-box"
            role="presentation"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <h2>פרטי הזמנה מלאים</h2>

            @if (detailsLoading()) {
              <app-loader />
            } @else if (details(); as d) {
              <section class="details-section">
                <h3>פרטי לקוח</h3>
                <div class="row"><span class="lbl">שם מלא:</span><span>{{ d.userName || '—' }}</span></div>
                <div class="row"><span class="lbl">אימייל:</span><span>{{ d.userEmail || '—' }}</span></div>
              </section>

              <section class="details-section">
                <h3>פרטי האירוע</h3>
                <div class="row"><span class="lbl">חבילה:</span><span>{{ d.packageName || '—' }}</span></div>
                <div class="row"><span class="lbl">תאריך אירוע:</span><span>{{ d.eventDate | date: 'dd/MM/yyyy' }}</span></div>
                <div class="row"><span class="lbl">כתובת:</span><span>{{ d.address }}</span></div>
                <div class="row"><span class="lbl">מס' אורחים:</span><span>{{ d.numberOfGuests }}</span></div>
                <div class="row"><span class="lbl">מחיר כולל:</span><span>₪{{ d.totalPrice }}</span></div>
                <div class="row">
                  <span class="lbl">סטטוס:</span>
                  <span
                    class="status-badge"
                    [class.approved]="d.isApproved"
                    [class.pending]="!d.isApproved"
                  >{{ statusLabelFor(d.isApproved) }}</span>
                </div>
              </section>

              <section class="details-section">
                <h3>מנות נבחרות</h3>
                @if (dishGroups().length === 0) {
                  <p class="muted">לא נבחרו מנות</p>
                } @else {
                  @for (group of dishGroups(); track group.label) {
                    <div class="dish-group">
                      <h4>{{ group.label }}</h4>
                      <ul>
                        @for (name of group.dishes; track name) {
                          <li>{{ name }}</li>
                        }
                      </ul>
                    </div>
                  }
                }
              </section>

              <div class="form-actions">
                @if (!d.isApproved) {
                  <button type="button" class="btn-primary" (click)="openEditFromDetails()">עדכון סטטוס</button>
                }
                <button type="button" class="btn-secondary" (click)="closeDetails()">סגירה</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private packageService = inject(PackageService);
  private dishService = inject(DishService);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  packages = signal<Package[]>([]);
  allDishes = signal<Dish[]>([]);
  loading = signal(true);
  saving = signal(false);
  editing = signal<Order | null>(null);
  editLoadingDetails = signal(false);
  editCheckingDate = signal(false);
  editDateError = signal('');

  detailsOpen = signal(false);
  detailsLoading = signal(false);
  details = signal<OrderFullDetails | null>(null);

  customerTerm = signal('');
  startDate = signal('');
  endDate = signal('');

  private readonly emptyEdit: OrderEditModel = {
    packageId: '',
    selectedItems: [],
    numberOfGuests: 1,
    eventDate: '',
    address: '',
    isApproved: false,
  };

  // Signal so computed() tracks changes reactively.
  editModel = signal<OrderEditModel>({ ...this.emptyEdit });

  private readonly categoryOrder: { key: string; label: string }[] = [
    { key: 'starters', label: 'מנות ראשונות' },
    { key: 'mainCourses', label: 'מנות עיקריות' },
    { key: 'salads', label: 'סלטים' },
    { key: 'desserts', label: 'קינוחים' },
    { key: 'breads', label: 'לחמים' },
    { key: 'drinks', label: 'משקאות' },
  ];

  dishGroups = computed(() => {
    const d = this.details();
    if (!d) return [];
    return this.categoryOrder
      .map((c) => ({
        label: c.label,
        dishes: d.dishes.filter((dish) => dish.category === c.key).map((dish) => dish.name),
      }))
      .filter((group) => group.dishes.length > 0);
  });

  // Reactive: re-computes when editModel signal or packages/dishes signals change.
  editCategories = computed<CategoryGroup[]>(() => {
    const m = this.editModel();
    const pkg = this.packages().find((p) => p.id === m.packageId);
    if (!pkg?.limits) return [];
    const dishes = this.allDishes();
    return Object.entries(pkg.limits)
      .filter(([, limit]) => (limit ?? 0) > 0)
      .map(([key, limit]) => ({
        key,
        label: CATEGORY_LABELS[key] ?? key,
        limit: limit ?? 0,
        dishes: dishes.filter((d) => d.category === key),
      }));
  });

  estimatedTotal = computed<number>(() => {
    const m = this.editModel();
    const pkg = this.packages().find((p) => p.id === m.packageId);
    if (!pkg) return 0;
    return pkg.pricePerPerson * (Number(m.numberOfGuests) || 0);
  });

  filtered = computed(() => {
    const term = this.customerTerm().trim().toLowerCase();
    const start = this.startDate();
    const end = this.endDate();

    return this.orders().filter((o) => {
      const matchesCustomer =
        !term ||
        o.userName.toLowerCase().includes(term) ||
        o.userEmail.toLowerCase().includes(term);

      const eventDay = o.eventDate ? o.eventDate.substring(0, 10) : '';
      const matchesStart = !start || (eventDay && eventDay >= start);
      const matchesEnd = !end || (eventDay && eventDay <= end);

      return matchesCustomer && matchesStart && matchesEnd;
    });
  });

  ngOnInit(): void {
    forkJoin({
      orders: this.orderService.getAll(),
      packages: this.packageService.getAll(),
      dishes: this.dishService.getAll(),
    }).subscribe({
      next: ({ orders, packages, dishes }) => {
        this.orders.set(orders);
        this.packages.set(packages);
        this.allDishes.set(dishes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(order: Order): string {
    return orderStatusLabel(order);
  }

  statusLabelFor(isApproved: boolean): string {
    return orderStatusLabel({ isApproved });
  }

  openDetails(order: Order): void {
    this.detailsOpen.set(true);
    this.detailsLoading.set(true);
    this.details.set(null);
    this.orderService.getFullDetails(order.id).subscribe({
      next: (data) => {
        this.details.set({
          ...data,
          userName: data.userName || order.userName,
        });
        this.detailsLoading.set(false);
      },
      error: () => {
        this.detailsLoading.set(false);
        this.closeDetails();
        this.toast.show('שגיאה בטעינת פרטי ההזמנה', 'error');
      },
    });
  }

  closeDetails(): void {
    this.detailsOpen.set(false);
    this.details.set(null);
  }

  openEditFromDetails(): void {
    const d = this.details();
    if (!d) return;
    const order = this.orders().find((o) => o.id === d.id);
    this.closeDetails();
    if (order) this.openEdit(order);
  }

  clearFilters(): void {
    this.customerTerm.set('');
    this.startDate.set('');
    this.endDate.set('');
  }

  openEdit(order: Order): void {
    // Show the modal immediately with basic data; fill in dish selections once loaded.
    this.editModel.set({
      packageId: order.packageId,
      selectedItems: [],
      numberOfGuests: order.numberOfGuests,
      eventDate: order.eventDate ? order.eventDate.substring(0, 10) : '',
      address: order.address,
      isApproved: order.isApproved,
    });
    this.editing.set(order);
    this.editLoadingDetails.set(true);

    // Load the existing dish selection so checkboxes are pre-filled.
    this.orderService.getFullDetails(order.id).subscribe({
      next: (d) => {
        this.editModel.update((m) => ({
          ...m,
          selectedItems: d.dishes.map((dish) => dish.id),
        }));
        this.editLoadingDetails.set(false);
      },
      error: () => this.editLoadingDetails.set(false),
    });
  }

  closeEdit(): void {
    this.editing.set(null);
    this.editModel.set({ ...this.emptyEdit });
    this.editDateError.set('');
    this.editCheckingDate.set(false);
  }

  onEditDateChange(date: string): void {
    const order = this.editing();
    if (!order) return;

    this.editDateError.set('');
    this.patchEdit({ eventDate: date });

    if (!date) return;

    this.editCheckingDate.set(true);
    this.orderService.getCountByDateExcluding(date, order.id).subscribe({
      next: (count) => {
        if (count >= 2) {
          this.editDateError.set('התאריך שבחרת עמוס מדי, אנא בחר תאריך אחר');
        }
        this.editCheckingDate.set(false);
      },
      error: () => this.editCheckingDate.set(false),
    });
  }

  patchEdit(patch: Partial<OrderEditModel>): void {
    this.editModel.update((m) => ({ ...m, ...patch }));
  }

  onPackageChange(newPkgId: string): void {
    // Switching the package clears dish selections since limits may differ.
    this.editModel.update((m) => ({ ...m, packageId: newPkgId, selectedItems: [] }));
  }

  editCountFor(category: string): number {
    const catDishIds = this.allDishes()
      .filter((d) => d.category === category)
      .map((d) => d.id);
    return this.editModel().selectedItems.filter((id) => catDishIds.includes(id)).length;
  }

  isDishSelected(dishId: string): boolean {
    return this.editModel().selectedItems.includes(dishId);
  }

  toggleDishEdit(category: string, dishId: string, limit: number): void {
    const catDishIds = this.allDishes()
      .filter((d) => d.category === category)
      .map((d) => d.id);
    const currentCount = this.editModel().selectedItems.filter((id) => catDishIds.includes(id)).length;

    this.editModel.update((m) => {
      if (m.selectedItems.includes(dishId)) {
        return { ...m, selectedItems: m.selectedItems.filter((id) => id !== dishId) };
      }
      if (currentCount >= limit) return m;
      return { ...m, selectedItems: [...m.selectedItems, dishId] };
    });
  }

  saveEdit(): void {
    const order = this.editing();
    if (!order) return;
    if (this.editCheckingDate()) return;
    if (this.editDateError()) return;

    this.saving.set(true);
    const m = this.editModel();
    const dto: UpdateOrderDto = {
      packageId: m.packageId,
      selectedItems: m.selectedItems,
      numberOfGuests: Number(m.numberOfGuests),
      eventDate: m.eventDate,
      address: m.address,
      isApproved: m.isApproved,
    };

    this.orderService.update(order.id, dto).subscribe({
      next: (updated) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
        );
        this.saving.set(false);
        this.closeEdit();
        this.toast.show('ההזמנה עודכנה בהצלחה', 'success');
      },
      error: (e: { error?: { message?: string } }) => {
        this.toast.show(e.error?.message || 'עדכון ההזמנה נכשל', 'error');
        this.saving.set(false);
      },
    });
  }

  deleteOrder(order: Order): void {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההזמנה?')) return;
    this.orderService.delete(order.id).subscribe(() => {
      this.orders.update((list) => list.filter((o) => o.id !== order.id));
      this.toast.show('ההזמנה נמחקה בהצלחה', 'success');
    });
  }
}
