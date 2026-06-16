import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { Order, UpdateOrderDto, orderStatusLabel } from '../../../core/models/order.model';
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
              @if (!order.isApproved) {
                <div class="order-actions">
                  <button class="btn-edit" (click)="openEdit(order)">עדכון</button>
                  <button class="btn-delete" (click)="deleteOrder(order)">מחיקה</button>
                </div>
              }
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

  customerTerm = signal('');
  startDate = signal('');
  endDate = signal('');

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
