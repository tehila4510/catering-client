import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CreateOrderDto, Order } from '../../core/models/order.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface OrderApi {
  _id?: string;
  id?: string;
  packageId?: string | { _id?: string };
  numberOfGuests?: number;
  eventDate?: string;
  address?: string;
  totalPrice?: number;
  isApproved?: boolean;
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

  // Returns how many orders already exist for a given event date (YYYY-MM-DD).
  getCountByDate(date: string): Observable<number> {
    const params = new HttpParams().set('startDate', date).set('endDate', date);
    return this.http
      .get<ApiResponse<OrderApi[]>>(`${this.apiUrl}/by-date-range`, { params })
      .pipe(map((res) => (res.data ?? []).length));
  }

  private toModel(o: OrderApi): Order {
    const pkgId =
      typeof o.packageId === 'string' ? o.packageId : (o.packageId?._id ?? '');
    return {
      id: o._id ?? o.id ?? '',
      packageId: pkgId,
      numberOfGuests: o.numberOfGuests ?? 0,
      eventDate: o.eventDate ?? '',
      address: o.address ?? '',
      totalPrice: o.totalPrice ?? 0,
      isApproved: o.isApproved ?? false,
    };
  }
}
