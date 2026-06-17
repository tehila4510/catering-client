import { Component, OnInit, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { Order, CustomerUpdateOrderDto, orderStatusLabel } from '../../core/models/order.model';
import { Package } from '../../core/models/package.model';
import { Dish } from '../../core/models/dish.model';
import { OrderService } from '../orders/order.service';
import { PackageService } from '../packages/package.service';
import { DishService } from '../dishes/dish.service';
import { environment } from '../../../environments/environment';
import { CATEGORY_LABELS } from '../../core/constants/categories';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CategoryGroup {
  key: string;
  label: string;
  limit: number;
  dishes: Dish[];
}

interface OrderEditState {
  step: 1 | 2;
  orderId: string;
  packageId: string;
  selectedItems: string[];
  numberOfGuests: number;
  eventDate: string;
  address: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private packageService = inject(PackageService);
  private dishService = inject(DishService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  user = signal<User | null>(null);
  orders = signal<Order[]>([]);
  ordersLoading = signal(true);

  packages = signal<Package[]>([]);
  allDishes = signal<Dish[]>([]);
  catalogLoading = signal(false);

  editState = signal<OrderEditState | null>(null);
  editSaving = signal(false);
  editError = signal('');
  editCheckingDate = signal(false);
  editDateError = signal('');

  private readonly minCancelLeadDays = 4;

  editCategories = computed<CategoryGroup[]>(() => {
    const state = this.editState();
    if (!state) return [];
    const pkg = this.packages().find((p) => p.id === state.packageId);
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

  editEstimatedTotal = computed<number>(() => {
    const state = this.editState();
    if (!state) return 0;
    const pkg = this.packages().find((p) => p.id === state.packageId);
    if (!pkg) return 0;
    return pkg.pricePerPerson * (Number(state.numberOfGuests) || 0);
  });

  editSelectionComplete = computed<boolean>(() => {
    const cats = this.editCategories();
    if (!cats.length) return true;
    return cats.every((c) => this.editCountFor(c.key) === c.limit);
  });

  ngOnInit(): void {
    this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/auth/profile`)
      .pipe(map((res) => res.data))
      .subscribe((u) => this.user.set(u));

    this.loadOrders();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => event.urlAfterRedirects.startsWith('/profile')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadOrders());
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.orderService.getUserOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.ordersLoading.set(false);
      },
      error: () => this.ordersLoading.set(false),
    });
  }

  statusLabel(order: Order): string {
    return orderStatusLabel(order);
  }

  canCancel(order: Order): boolean {
    if (order.isApproved) return false;
    if (!order.eventDate) return false;

    const event = new Date(order.eventDate);
    event.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= this.minCancelLeadDays;
  }

  canEdit(order: Order): boolean {
    return !order.isApproved;
  }

  cancelOrder(order: Order): void {
    if (!this.canCancel(order)) return;
    if (!confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) return;

    this.orderService.delete(order.id).subscribe({
      next: () => {
        this.orders.update((list) => list.filter((o) => o.id !== order.id));
        this.toast.show('ההזמנה בוטלה בהצלחה', 'success');
      },
    });
  }

  openEdit(order: Order): void {
    this.editError.set('');

    if (this.packages().length === 0) {
      this.catalogLoading.set(true);
      forkJoin({
        packages: this.packageService.getAll(),
        dishes: this.dishService.getAll(),
      }).subscribe({
        next: ({ packages, dishes }) => {
          this.packages.set(packages);
          this.allDishes.set(dishes);
          this.catalogLoading.set(false);
          this.initEditState(order);
        },
        error: () => {
          this.catalogLoading.set(false);
          this.toast.show('שגיאה בטעינת הנתונים', 'error');
        },
      });
    } else {
      this.initEditState(order);
    }
  }

  private initEditState(order: Order): void {
    this.orderService.getFullDetails(order.id).subscribe({
      next: (details) => {
        this.editState.set({
          step: 1,
          orderId: order.id,
          packageId: order.packageId,
          selectedItems: details.dishes.map((d) => d.id),
          numberOfGuests: order.numberOfGuests,
          eventDate: order.eventDate ? order.eventDate.substring(0, 10) : '',
          address: order.address,
        });
      },
      error: () => {
        this.editState.set({
          step: 1,
          orderId: order.id,
          packageId: order.packageId,
          selectedItems: [],
          numberOfGuests: order.numberOfGuests,
          eventDate: order.eventDate ? order.eventDate.substring(0, 10) : '',
          address: order.address,
        });
      },
    });
  }

  closeEdit(): void {
    this.editState.set(null);
    this.editError.set('');
    this.editDateError.set('');
    this.editCheckingDate.set(false);
  }

  onEditDateChange(date: string): void {
    const state = this.editState();
    if (!state) return;

    this.editDateError.set('');
    this.editState.set({ ...state, eventDate: date });

    if (!date) return;

    this.editCheckingDate.set(true);
    this.orderService.getCountByDateExcluding(date, state.orderId).subscribe({
      next: (count) => {
        if (count >= 2) {
          this.editDateError.set('התאריך שבחרת עמוס מדי, אנא בחר תאריך אחר');
        }
        this.editCheckingDate.set(false);
      },
      error: () => this.editCheckingDate.set(false),
    });
  }

  onEditPackageChange(newPkgId: string): void {
    const state = this.editState();
    if (!state) return;
    this.editState.set({ ...state, packageId: newPkgId, selectedItems: [] });
  }

  editCountFor(category: string): number {
    const state = this.editState();
    if (!state) return 0;
    const catDishIds = this.allDishes()
      .filter((d) => d.category === category)
      .map((d) => d.id);
    return state.selectedItems.filter((id) => catDishIds.includes(id)).length;
  }

  isEditDishSelected(dishId: string): boolean {
    return this.editState()?.selectedItems.includes(dishId) ?? false;
  }

  toggleEditDish(category: string, dishId: string, limit: number): void {
    const state = this.editState();
    if (!state) return;

    const catDishIds = this.allDishes()
      .filter((d) => d.category === category)
      .map((d) => d.id);
    const currentCount = state.selectedItems.filter((id) => catDishIds.includes(id)).length;

    let updated: string[];
    if (state.selectedItems.includes(dishId)) {
      updated = state.selectedItems.filter((id) => id !== dishId);
    } else {
      if (currentCount >= limit) return;
      updated = [...state.selectedItems, dishId];
    }
    this.editState.set({ ...state, selectedItems: updated });
  }

  goToEditStep2(): void {
    const state = this.editState();
    if (!state || !this.editSelectionComplete()) return;
    this.editState.set({ ...state, step: 2 });
  }

  backToEditStep1(): void {
    const state = this.editState();
    if (!state) return;
    this.editState.set({ ...state, step: 1 });
  }

  updateEditField(field: keyof OrderEditState, value: string | number): void {
    const state = this.editState();
    if (!state) return;
    this.editState.set({ ...state, [field]: value });
  }

  submitEdit(): void {
    const state = this.editState();
    if (!state) return;

    if (this.editCheckingDate()) return;
    if (this.editDateError()) return;

    if (!state.numberOfGuests || Number(state.numberOfGuests) < 1 || !state.eventDate || !state.address.trim()) {
      this.editError.set('יש למלא את כל השדות');
      return;
    }

    this.editError.set('');
    this.editSaving.set(true);

    const dto: CustomerUpdateOrderDto = {
      packageId: state.packageId,
      selectedItems: state.selectedItems,
      numberOfGuests: Number(state.numberOfGuests),
      eventDate: state.eventDate,
      address: state.address.trim(),
    };

    this.orderService.customerUpdate(state.orderId, dto).subscribe({
      next: (updated) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
        );
        this.editSaving.set(false);
        this.closeEdit();
        this.toast.show('ההזמנה עודכנה בהצלחה!', 'success');
      },
      error: (e: { error?: { message?: string } }) => {
        this.editError.set(e.error?.message || 'עדכון ההזמנה נכשל, נסה שוב');
        this.editSaving.set(false);
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
