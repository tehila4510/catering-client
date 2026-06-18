import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  CreateOrderDto,
  CustomerUpdateOrderDto,
  Order,
  OrderFullDetails,
  UpdateOrderDto,
} from '../../core/models/order.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PopulatedUser {
  _id?: string;
  name?: string;
  email?: string;
}

interface PopulatedPackage {
  _id?: string;
  packageName?: string;
}

interface OrderApi {
  _id?: string;
  id?: string;
  packageId?: string | PopulatedPackage;
  userId?: string | PopulatedUser;
  numberOfGuests?: number;
  eventDate?: string;
  address?: string;
  totalPrice?: number;
  isApproved?: boolean;
}

interface PopulatedDish {
  _id?: string;
  id?: string;
  name?: string;
  category?: string;
}

interface OrderFullApi extends OrderApi {
  selectedItems?: PopulatedDish[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/orders`;

  create(order: CreateOrderDto): Observable<Order> {
    return this.http
      .post<ApiResponse<OrderApi>>(this.apiUrl, order)
      .pipe(map((res) => this.toModel(res.data)));
  }

  // Admin: all orders in the system.
  getAll(): Observable<Order[]> {
    return this.http
      .get<ApiResponse<OrderApi[]>>(this.apiUrl)
      .pipe(map((res) => (res.data ?? []).map((o) => this.toModel(o))));
  }

  // Orders belonging to the logged-in user.
  getUserOrders(): Observable<Order[]> {
    return this.http
      .get<ApiResponse<OrderApi[]>>(`${this.apiUrl}/user/orders`)
      .pipe(map((res) => (res.data ?? []).map((o) => this.toModel(o))));
  }

  // Admin: orders belonging to a specific customer.
  getByCustomer(customerId: string): Observable<Order[]> {
    return this.http
      .get<ApiResponse<OrderApi[]>>(`${this.apiUrl}/customer/${customerId}`)
      .pipe(map((res) => (res.data ?? []).map((o) => this.toModel(o))));
  }

  // Admin: full populated details for a single order.
  getFullDetails(id: string): Observable<OrderFullDetails> {
    return this.http
      .get<ApiResponse<OrderFullApi>>(`${this.apiUrl}/${id}/full-details`)
      .pipe(map((res) => this.toFullModel(res.data)));
  }

  update(id: string, data: UpdateOrderDto): Observable<Order> {
    return this.http
      .put<ApiResponse<OrderApi>>(`${this.apiUrl}/${id}`, data)
      .pipe(map((res) => this.toModel(res.data)));
  }

  /** Customer self-edit: PUT /orders/:id/edit — cannot change isApproved. */
  customerUpdate(id: string, data: CustomerUpdateOrderDto): Observable<Order> {
    return this.http
      .put<ApiResponse<OrderApi>>(`${this.apiUrl}/${id}/edit`, data)
      .pipe(map((res) => this.toModel(res.data)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  // Returns how many orders already exist for a given event date (YYYY-MM-DD).
  getCountByDate(date: string): Observable<number> {
    const params = new HttpParams().set('startDate', date).set('endDate', date);
    return this.http
      .get<ApiResponse<OrderApi[]>>(`${this.apiUrl}/by-date-range`, { params })
      .pipe(map((res) => (res.data ?? []).length));
  }

  // Same as above but excludes one order by ID (used when editing an existing order).
  getCountByDateExcluding(date: string, excludeOrderId: string): Observable<number> {
    const params = new HttpParams().set('startDate', date).set('endDate', date);
    return this.http
      .get<ApiResponse<OrderApi[]>>(`${this.apiUrl}/by-date-range`, { params })
      .pipe(
        map((res) =>
          (res.data ?? []).filter(
            (o) => (o._id ?? o.id) !== excludeOrderId,
          ).length,
        ),
      );
  }

  private toFullModel(o: OrderFullApi): OrderFullDetails {
    const base = this.toModel(o);
    const usr = o.userId;
    const userName = typeof usr === 'string' ? '' : (usr?.name ?? '');

    const dishes = (o.selectedItems ?? []).map((d) => ({
      id: d._id ?? d.id ?? '',
      name: d.name ?? '',
      category: d.category ?? '',
    }));

    return {
      id: base.id,
      userName: userName || base.userName,
      userEmail: base.userEmail,
      packageName: base.packageName,
      numberOfGuests: base.numberOfGuests,
      eventDate: base.eventDate,
      address: base.address,
      totalPrice: base.totalPrice,
      isApproved: base.isApproved,
      dishes,
    };
  }

  private toModel(o: OrderApi): Order {
    const pkg = o.packageId;
    const pkgId = typeof pkg === 'string' ? pkg : (pkg?._id ?? '');
    const pkgName = typeof pkg === 'string' ? '' : (pkg?.packageName ?? '');

    const usr = o.userId;
    const userId = typeof usr === 'string' ? usr : (usr?._id ?? '');
    const userName = typeof usr === 'string' ? '' : (usr?.name ?? '');
    const userEmail = typeof usr === 'string' ? '' : (usr?.email ?? '');

    return {
      id: o._id ?? o.id ?? '',
      packageId: pkgId,
      packageName: pkgName,
      userId,
      userName,
      userEmail,
      numberOfGuests: o.numberOfGuests ?? 0,
      eventDate: o.eventDate ?? '',
      address: o.address ?? '',
      totalPrice: o.totalPrice ?? 0,
      isApproved: o.isApproved ?? false,
    };
  }
}
