import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';
import { Order, orderStatusLabel } from '../../core/models/order.model';
import { OrderService } from '../orders/order.service';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private toast = inject(ToastService);

  user = signal<User | null>(null);
  orders = signal<Order[]>([]);
  ordersLoading = signal(true);

  // Minimum lead time (in days) required to allow self-cancellation.
  private readonly minCancelLeadDays = 4;

  ngOnInit(): void {
    this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/auth/profile`)
      .pipe(map((res) => res.data))
      .subscribe((u) => this.user.set(u));

    this.loadOrders();
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.orderService.getUserOrders().subscribe({
      next: (data) => {
        // #region agent log
        fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5d23e0'},body:JSON.stringify({sessionId:'5d23e0',hypothesisId:'D',location:'profile.component.ts:loadOrders',message:'user orders mapped',data:{count:data.length,first:data[0]?{packageName:data[0].packageName,eventDate:data[0].eventDate,address:data[0].address,totalPrice:data[0].totalPrice,isApproved:data[0].isApproved}:null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        this.orders.set(data);
        this.ordersLoading.set(false);
      },
      error: (err) => {
        // #region agent log
        fetch('http://127.0.0.1:7472/ingest/1efcf1af-9ffc-46cb-be5f-a6ada37ad3ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5d23e0'},body:JSON.stringify({sessionId:'5d23e0',hypothesisId:'D',location:'profile.component.ts:loadOrders',message:'user orders error',data:{status:err?.status,url:err?.url},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        this.ordersLoading.set(false);
      },
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

  logout(): void {
    this.auth.logout();
  }
}
