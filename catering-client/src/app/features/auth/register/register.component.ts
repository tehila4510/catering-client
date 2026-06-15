import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.error = '';

    if (this.password !== this.confirmPassword) {
      this.error = 'הסיסמאות אינן תואמות';
      return;
    }

    this.loading = true;
    this.auth.register({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: { error?: { message?: string } }) => {
        this.error = e.error?.message || 'ההרשמה נכשלה, נסה שוב';
        this.loading = false;
      },
    });
  }
}
