import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  onSubmit(): void {
    this.error = '';

    if (this.password !== this.confirmPassword) {
      this.error = 'הסיסמאות אינן תואמות';
      return;
    }

    this.loading = true;
    this.auth
      .register({
        name: this.name,
        email: this.email,
        phone: this.phone,
        password: this.password,
      })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (e: { error?: { message?: string } }) => {
          this.error = e.error?.message || 'ההרשמה נכשלה, נסה שוב';
          this.loading = false;
        },
      });
  }
}
