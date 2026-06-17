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

interface DishApi {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category: string;
  imageUrl?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DishService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/dishes`;

  getAll(filters?: { name?: string; category?: string }): Observable<Dish[]> {
    const params: Record<string, string> = {};
    const name = filters?.name?.trim();
    const category = filters?.category?.trim();
    if (name) params['name'] = name;
    if (category) params['category'] = category;

    return this.http
      .get<ApiResponse<DishApi[]>>(this.apiUrl, { params })
      .pipe(map((res) => (res.data ?? []).map((d) => this.toModel(d))));
  }

  create(dish: Partial<Dish>): Observable<Dish> {
    return this.http
      .post<ApiResponse<DishApi>>(this.apiUrl, this.toApi(dish))
      .pipe(map((res) => this.toModel(res.data)));
  }

  update(id: string, dish: Partial<Dish>): Observable<Dish> {
    return this.http
      .put<ApiResponse<DishApi>>(`${this.apiUrl}/${id}`, this.toApi(dish))
      .pipe(map((res) => this.toModel(res.data)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  private toModel(d: DishApi): Dish {
    return {
      id: d._id ?? d.id ?? '',
      name: d.name ?? '',
      description: d.description ?? '',
      category: d.category ?? '',
      imageUrl: d.imageUrl,
      isActive: d.isActive,
    };
  }

  private toApi(d: Partial<Dish>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (d.name !== undefined) body['name'] = d.name;
    if (d.description !== undefined) body['description'] = d.description;
    if (d.category !== undefined) body['category'] = d.category;
    if (d.imageUrl) body['imageUrl'] = d.imageUrl;
    return body;
  }
}
