import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Package } from '../../core/models/package.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PackageService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/packages`;

  getAll(): Observable<Package[]> {
    return this.http.get<ApiResponse<Package[]>>(this.apiUrl).pipe(map(res => res.data));
  }

  create(pkg: Partial<Package>): Observable<Package> {
    return this.http.post<ApiResponse<Package>>(this.apiUrl, pkg).pipe(map(res => res.data));
  }

  update(id: string, pkg: Partial<Package>): Observable<Package> {
    return this.http.put<ApiResponse<Package>>(`${this.apiUrl}/${id}`, pkg).pipe(map(res => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(res => res.data));
  }
}
