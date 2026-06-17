import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Package, PackageLimits } from '../../core/models/package.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PackageApi {
  _id?: string;
  id?: string;
  packageName?: string;
  name?: string;
  description?: string;
  pricePerPerson?: number;
  limits?: Partial<PackageLimits>;
  featured?: boolean;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PackageService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/packages`;

  getAll(): Observable<Package[]> {
    return this.http
      .get<ApiResponse<PackageApi[]>>(this.apiUrl)
      .pipe(map((res) => (res.data ?? []).map((p) => this.toModel(p))));
  }

  create(pkg: Partial<Package>): Observable<Package> {
    return this.http
      .post<ApiResponse<PackageApi>>(this.apiUrl, this.toApi(pkg))
      .pipe(map((res) => this.toModel(res.data)));
  }

  update(id: string, pkg: Partial<Package>): Observable<Package> {
    return this.http
      .put<ApiResponse<PackageApi>>(`${this.apiUrl}/${id}`, this.toApi(pkg))
      .pipe(map((res) => this.toModel(res.data)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }

  private emptyLimits(): PackageLimits {
    return {
      starters: 0,
      mainCourses: 0,
      salads: 0,
      desserts: 0,
      breads: 0,
      drinks: 0,
    };
  }

  private toModel(p: PackageApi): Package {
    return {
      id: p._id ?? p.id ?? '',
      name: p.packageName ?? p.name ?? '',
      description: p.description ?? '',
      pricePerPerson: p.pricePerPerson ?? 0,
      limits: { ...this.emptyLimits(), ...(p.limits ?? {}) } as PackageLimits,
      featured: p.featured ?? false,
      imageUrl: p.imageUrl,
    };
  }

  private toApi(p: Partial<Package>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (p.name !== undefined) body['packageName'] = p.name;
    if (p.description !== undefined) body['description'] = p.description;
    if (p.imageUrl !== undefined) body['imageUrl'] = p.imageUrl;
    if (p.pricePerPerson !== undefined) body['pricePerPerson'] = p.pricePerPerson;
    if (p.limits !== undefined) body['limits'] = p.limits;
    if (p.featured !== undefined) body['featured'] = p.featured;
    if (p.imageUrl !== undefined) body['imageUrl'] = p.imageUrl;
    return body;
  }
}
