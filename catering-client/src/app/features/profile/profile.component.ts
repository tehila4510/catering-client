import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

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

  user = signal<User | null>(null);

  ngOnInit(): void {
    this.http
      .get<User>(`${environment.apiUrl}/auth/profile`)
      .subscribe((u) => this.user.set(u));
  }

  logout(): void {
    this.auth.logout();
  }
}
