import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { Customer, CustomerService } from './customer.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { OrderService } from '../../orders/order.service';
import { PackageService } from '../../packages/package.service';
import { DishService } from '../../dishes/dish.service';
import { ToastService } from '../../../core/services/toast.service';
import { CATEGORY_LABELS } from '../../../core/constants/categories';
import { Order, UpdateOrderDto, orderStatusLabel } from '../../../core/models/order.model';
import { Package } from '../../../core/models/package.model';
import { Dish } from '../../../core/models/dish.model';

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
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule, DatePipe, LoaderComponent],
  template: `
    <div class="admin-section">
      <div class="section-header">
        <h1>רשימת לקוחות</h1>
        <p class="subtitle">{{ customers().length }} לקוחות רשומים</p>
      </div>

      <div class="filters">
        <input
          class="filter-input"
          type="text"
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          [ngModel]="searchTerm()"
          (ngModelChange)="searchTerm.set($event)"
        />
        @if (searchTerm()) {
          <button class="btn-secondary" (click)="searchTerm.set('')">נקה חיפוש</button>
        }
      </div>

      @if (loading()) {
        <app-loader />
      }

      @if (!loading() && filtered().length === 0) {
        <div class="empty-state">
          {{ searchTerm() ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין לקוחות רשומים' }}
        </div>
      }

      @if (!loading() && filtered().length > 0) {
        <div class="customers-table-wrap">
          <table class="customers-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>אימייל</th>
                <th>טלפון</th>
                <th>תאריך הרשמה</th>
                <th>הזמנות</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of filtered(); track customer.id) {
                <tr>
                  <td class="name-cell">{{ customer.name }}</td>
                  <td>{{ customer.email }}</td>
                  <td>{{ customer.phone || '—' }}</td>
                  <td>{{ customer.createdAt | date: 'd בMMMM yyyy' : '' : 'he' }}</td>
                  <td>
                    <button class="btn-orders" (click)="openOrders(customer)">צפייה בהזמנות</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="customers-cards">
          @for (customer of filtered(); track customer.id) {
            <div class="customer-card">
              <div class="customer-name">{{ customer.name }}</div>
              <div class="row"><span class="lbl">אימייל:</span><span>{{ customer.email }}</span></div>
              <div class="row"><span class="lbl">טלפון:</span><span>{{ customer.phone || '—' }}</span></div>
              <div class="row">
                <span class="lbl">הרשמה:</span>
                <span>{{ customer.createdAt | date: 'd בMMMM yyyy' : '' : 'he' }}</span>
              </div>
              <button class="btn-orders full" (click)="openOrders(customer)">צפייה בהזמנות</button>
            </div>
          }
        </div>
      }

      <!-- Customer orders modal -->
      @if (selectedCustomer(); as customer) {
        <div
          class="modal-overlay"
          role="button"
          tabindex="0"
          (click)="closeOrders()"
          (keydown.escape)="closeOrders()"
        >
          <div
            class="modal-box"
            role="presentation"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <div class="modal-header">
              <h2>ההזמנות של {{ customer.name }}</h2>
              <button class="modal-close" (click)="closeOrders()" aria-label="סגירה">✕</button>
            </div>

            @if (ordersLoading()) {
              <app-loader />
            }

            @if (!ordersLoading() && customerOrders().length === 0) {
              <div class="empty-state">לקוח זה עדיין לא ביצע הזמנות</div>
            }

            @if (!ordersLoading() && customerOrders().length > 0) {
              <div class="orders-list">
                @for (order of customerOrders(); track order.id) {
                  <div class="order-item">
                    <div class="order-item-header">
                      <span class="pkg">{{ order.packageName || 'חבילה' }}</span>
                      <span
                        class="status-badge"
                        [class.approved]="order.isApproved"
                        [class.pending]="!order.isApproved"
                      >{{ statusLabel(order) }}</span>
                    </div>
                    <div class="row"><span class="lbl">מס' אורחים:</span><span>{{ order.numberOfGuests }}</span></div>
                    <div class="row"><span class="lbl">תאריך אירוע:</span><span>{{ order.eventDate | date: 'd בMMMM yyyy' : '' : 'he' }}</span></div>
                    <div class="row"><span class="lbl">כתובת:</span><span>{{ order.address }}</span></div>
                    <div class="row"><span class="lbl">מחיר כולל:</span><span>₪{{ order.totalPrice }}</span></div>

                    @if (!order.isApproved) {
                      <div class="order-item-actions">
                        <button
                          class="btn-approve"
                          [disabled]="approvingId() === order.id"
                          (click)="approveOrder(order)"
                        >{{ approvingId() === order.id ? 'מאשר...' : 'אשר הזמנה' }}</button>
                        <button class="btn-edit" (click)="openEdit(order)">עריכה</button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Edit order modal -->
      @if (editing(); as order) {
        <div
          class="modal-overlay edit-overlay"
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
            <div class="modal-header">
              <h2>עריכת הזמנה</h2>
              <button class="modal-close" (click)="closeEdit()" aria-label="סגירה">✕</button>
            </div>

            @if (editLoadingDetails()) {
              <app-loader />
            } @else {
              <form (ngSubmit)="saveEdit()" class="edit-form">
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
                    [min]="editMinGuests()"
                    [ngModel]="editModel().numberOfGuests"
                    (ngModelChange)="patchEdit({ numberOfGuests: +$event })"
                    required
                  />
                  <span class="date-hint">מינימום {{ editMinGuests() }} אורחים</span>
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
    </div>
  `,
  styleUrl: './admin-customers.component.scss',
})
export class AdminCustomersComponent implements OnInit {
  private customerService = inject(CustomerService);
  private orderService = inject(OrderService);
  private packageService = inject(PackageService);
  private dishService = inject(DishService);
  private toast = inject(ToastService);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  selectedCustomer = signal<Customer | null>(null);
  customerOrders = signal<Order[]>([]);
  ordersLoading = signal(false);
  approvingId = signal<string | null>(null);

  packages = signal<Package[]>([]);
  allDishes = signal<Dish[]>([]);
  private refDataLoaded = false;

  editing = signal<Order | null>(null);
  editLoadingDetails = signal(false);
  saving = signal(false);
  editCheckingDate = signal(false);
  editDateError = signal('');

  private readonly emptyEdit: OrderEditModel = {
    packageId: '',
    selectedItems: [],
    numberOfGuests: 1,
    eventDate: '',
    address: '',
    isApproved: false,
  };

  editModel = signal<OrderEditModel>({ ...this.emptyEdit });

  filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.customers();
    return this.customers().filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term),
    );
  });

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

  editMinGuests = computed<number>(() => {
    const m = this.editModel();
    const pkg = this.packages().find((p) => p.id === m.packageId);
    return pkg?.minGuests ?? 1;
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openOrders(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerOrders.set([]);
    this.ordersLoading.set(true);
    this.orderService.getByCustomer(customer.id).subscribe({
      next: (orders) => {
        this.customerOrders.set(orders);
        this.ordersLoading.set(false);
      },
      error: () => this.ordersLoading.set(false),
    });
  }

  closeOrders(): void {
    this.selectedCustomer.set(null);
    this.customerOrders.set([]);
  }

  statusLabel(order: Order): string {
    return orderStatusLabel(order);
  }

  approveOrder(order: Order): void {
    this.approvingId.set(order.id);
    this.orderService.update(order.id, { isApproved: true }).subscribe({
      next: (updated) => {
        this.customerOrders.update((list) =>
          list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
        );
        this.approvingId.set(null);
        this.toast.show('ההזמנה אושרה בהצלחה', 'success');
      },
      error: (e: { error?: { message?: string } }) => {
        this.toast.show(e.error?.message || 'אישור ההזמנה נכשל', 'error');
        this.approvingId.set(null);
      },
    });
  }

  private ensureRefData(): void {
    if (this.refDataLoaded) return;
    this.packageService.getAll().subscribe((pkgs) => this.packages.set(pkgs));
    this.dishService.getAll().subscribe((dishes) => this.allDishes.set(dishes));
    this.refDataLoaded = true;
  }

  openEdit(order: Order): void {
    this.ensureRefData();
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

    const m = this.editModel();
    const min = this.editMinGuests();
    if (Number(m.numberOfGuests) < min) {
      this.toast.show(`מספר האורחים חייב להיות לפחות ${min} לחבילה זו`, 'error');
      return;
    }

    this.saving.set(true);
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
        this.customerOrders.update((list) =>
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
}
