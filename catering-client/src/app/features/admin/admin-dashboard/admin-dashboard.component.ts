import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>ניהול</h2>
        </div>
        <nav class="sidebar-nav">
          <a
            routerLink="dishes"
            routerLinkActive="active"
            class="nav-link"
          >
            <span class="nav-icon">🍽</span>
            ניהול מנות
          </a>
          <a
            routerLink="packages"
            routerLinkActive="active"
            class="nav-link"
          >
            <span class="nav-icon">📦</span>
            ניהול חבילות
          </a>
          <a
            routerLink="orders"
            routerLinkActive="active"
            class="nav-link"
          >
            <span class="nav-icon">📋</span>
            ניהול הזמנות
          </a>
        </nav>
      </aside>
      <main class="content-area">
        <div class="content-inner">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {}
