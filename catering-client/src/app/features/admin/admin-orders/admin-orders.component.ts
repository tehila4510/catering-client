import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import {
  Order,
  OrderFullDetails,
  UpdateOrderDto,
  orderStatusLabel,
} from '../../../core/models/order.model';
import { OrderService } from '../../orders/order.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../core/services/toast.service';

interface OrderEditModel {
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

      @if (editing(); as order) {
        <div
          class="modal-overlay"
          role="button"
          tabindex="0"
          (click)="closeEdit()"
          (keydown.escape)="closeEdit()"
        >
          <div
            class="modal-box"
            role="presentation"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <h2>עדכון הזמנה</h2>
            <form (ngSubmit)="saveEdit()" class="edit-form">
              <div class="form-group">
                <label for="ord-guests">מספר אורחים</label>
                <input id="ord-guests" name="guests" type="number" min="1" [(ngModel)]="editModel.numberOfGuests" required />
              </div>
              <div class="form-group">
                <label for="ord-date">תאריך אירוע</label>
                <input id="ord-date" name="date" type="date" [(ngModel)]="editModel.eventDate" required />
              </div>
              <div class="form-group">
                <label for="ord-address">כתובת</label>
                <input id="ord-address" name="address" [(ngModel)]="editModel.address" required />
              </div>
              <label class="checkbox-row">
                <input type="checkbox" name="approve" [(ngModel)]="editModel.isApproved" />
                <span>אשר את ההזמנה</span>
              </label>
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  {{ saving() ? 'שומר...' : 'שמור שינויים' }}
                </button>
                <button type="button" class="btn-secondary" (click)="closeEdit()">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      }

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
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  saving = signal(false);
  editing = signal<Order | null>(null);

  detailsOpen = signal(false);
  detailsLoading = signal(false);
  details = signal<OrderFullDetails | null>(null);

  customerTerm = signal('');
  startDate = signal('');
  endDate = signal('');

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

  editModel: OrderEditModel = {
    numberOfGuests: 1,
    eventDate: '',
    address: '',
    isApproved: false,
  };

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
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAll().subscribe({
      next: (data) => {
        // #region agent log
        fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5d23e0'},body:JSON.stringify({sessionId:'5d23e0',hypothesisId:'A',location:'admin-orders.component.ts:loadOrders',message:'getAll success',data:{count:data.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        this.orders.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        // #region agent log
        fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5d23e0'},body:JSON.stringify({sessionId:'5d23e0',hypothesisId:'A',location:'admin-orders.component.ts:loadOrders',message:'getAll error',data:{status:err?.status,url:err?.url,statusText:err?.statusText},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        this.loading.set(false);
      },
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
        this.details.set(data);
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
    this.editModel = {
      numberOfGuests: order.numberOfGuests,
      eventDate: order.eventDate ? order.eventDate.substring(0, 10) : '',
      address: order.address,
      isApproved: order.isApproved,
    };
    this.editing.set(order);
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    const order = this.editing();
    if (!order) return;

    this.saving.set(true);
    const dto: UpdateOrderDto = {
      numberOfGuests: Number(this.editModel.numberOfGuests),
      eventDate: this.editModel.eventDate,
      address: this.editModel.address,
      isApproved: this.editModel.isApproved,
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
      error: () => this.saving.set(false),
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
