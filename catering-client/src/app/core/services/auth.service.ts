import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthResponse, LoginDto, RegisterDto } from '../models/auth.model';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
  ) {}

  login(credentials: LoginDto): Observable<void> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(({ token }) => {
          this.tokenService.setToken(token);
          this.loadProfile();
        }),
        map(() => void 0),
      );
  }

  register(data: RegisterDto): Observable<void> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(({ token }) => {
          this.tokenService.setToken(token);
          this.loadProfile();
        }),
        map(() => void 0),
      );
  }

  loadProfile(): void {
    this.http.get<User>(`${environment.apiUrl}/auth/profile`).subscribe({
      next: (user) => this.currentUser.set(user),
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
