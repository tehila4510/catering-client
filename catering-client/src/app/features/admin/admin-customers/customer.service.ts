import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CustomerApi {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'customer';
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth/users`;

  getAll(): Observable<Customer[]> {
    return this.http
      .get<ApiResponse<CustomerApi[]>>(this.apiUrl)
      .pipe(map((res) => (res.data ?? []).map((c) => this.toModel(c))));
  }

  private toModel(c: CustomerApi): Customer {
    return {
      id: c._id ?? c.id ?? '',
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      createdAt: c.createdAt ?? '',
    };
  }
}
