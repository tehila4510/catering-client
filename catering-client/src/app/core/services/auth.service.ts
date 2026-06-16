import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthResponse, LoginDto, RegisterDto } from '../models/auth.model';
import { TokenService } from './token.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  private currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  login(credentials: LoginDto): Observable<void> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(({ data }) => {
          this.tokenService.setToken(data.token);
          this.currentUser.set(data.user);
        }),
        map(() => void 0),
      );
  }

  register(data: RegisterDto): Observable<void> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(({ data: authData }) => {
          this.tokenService.setToken(authData.token);
          this.currentUser.set(authData.user);
        }),
        map(() => void 0),
      );
  }

  loadProfile(): void {
    this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/profile`).subscribe({
      next: (res) => this.currentUser.set(res.data),
      error: () => this.logout(),
    });
  }

  logout(): void {
    this.tokenService.clearToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getUser(): User | null {
    return this.currentUser();
  }
}
