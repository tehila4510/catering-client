import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Dish } from '../../core/models/dish.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class DishService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/dishes`;

  getAll(): Observable<Dish[]> {
    return this.http.get<ApiResponse<Dish[]>>(this.apiUrl).pipe(map(res => res.data));
  }

  create(dish: Partial<Dish>): Observable<Dish> {
    return this.http.post<ApiResponse<Dish>>(this.apiUrl, dish).pipe(map(res => res.data));
  }

  update(id: string, dish: Partial<Dish>): Observable<Dish> {
    return this.http.put<ApiResponse<Dish>>(`${this.apiUrl}/${id}`, dish).pipe(map(res => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(res => res.data));
  }
}
