# Catering Client - Agent Instructions

## Project Overview

Catering Client is a premium Angular 17+ standalone application for a catering service. It consumes a Node.js/Express REST API (`http://localhost:3000/api`) to manage dishes, packages, and customer orders with a luxury dark theme (gold/black/white palette).

**Tech Stack:** Angular 17+ (signals, standalone components) | TypeScript (strict mode) | SCSS | HttpClient | RxJS

---

## ⚠️ COLLABORATION MODEL — READ THIS FIRST

**This project has two developers working in parallel:**

### Developer 1 (NOT YOUR CONCERN) — Core Infrastructure
- **DO NOT modify these files:**
  - `src/app/app.config.ts` — App configuration & providers
  - `src/app/app.routes.ts` — All routing definitions
  - `src/app/core/guards/` — `auth.guard.ts`, `admin.guard.ts`
  - `src/app/core/interceptors/` — `auth.interceptor.ts`, `error.interceptor.ts`
  - `src/app/core/models/` — All TypeScript interfaces (User, Dish, Package, DTOs)
  - `src/app/core/services/` — `auth.service.ts`, `token.service.ts`, `toast.service.ts`
  - `src/app/features/auth/` — Login and Register components
  - `src/app/features/profile/` — Profile page
  - `src/app/shared/components/navbar/` — Navbar
  - `src/app/shared/components/footer/` — Footer
  - `src/app/shared/components/toast/` — Toast component
  - `src/environments/` — Environment files

### Developer 2 (YOU) — Features, UI & Design System
**Your responsibility:** Build all features listed in the "Your Features" section below. Follow the design system patterns. You own:
- `src/styles/` — Design tokens, typography, base components
- `src/app/features/dishes/` — Dish CRUD and display
- `src/app/features/packages/` — Package CRUD and display
- `src/app/features/home/` — Hero + featured content
- `src/app/features/admin/admin-dashboard/` — Admin panel layout
- `src/app/shared/components/{dish-card,package-card,loader}/` — Feature-specific components

---

## Quick Start

```bash
npm install
ng serve              # Start dev server → http://localhost:4200
npm run build         # Build for production
npm run test          # Run Vitest unit tests
```

**Backend must be running:** `npm run dev` in `catering-server/`

---

## Architecture & Conventions

### Folder Structure
```
src/
├── app/
│   ├── app.ts                     # Root component (handled by Dev 1)
│   ├── app.config.ts              # Providers & interceptors (Dev 1)
│   ├── app.routes.ts              # Route definitions (Dev 1)
│   ├── core/                      # Auth, models, guards (Dev 1)
│   ├── features/                  # Feature modules (your main work area)
│   │   ├── auth/                  # Login/Register (Dev 1)
│   │   ├── dishes/                # Dish CRUD & list (YOUR WORK)
│   │   ├── packages/              # Package CRUD & list (YOUR WORK)
│   │   ├── home/                  # Hero + featured sections (YOUR WORK)
│   │   ├── admin/                 # Admin dashboard (YOUR WORK)
│   │   └── profile/               # Profile page (Dev 1)
│   └── shared/                    # Reusable components
│       └── components/
│           ├── navbar/            # (Dev 1)
│           ├── footer/            # (Dev 1)
│           ├── toast/             # (Dev 1)
│           ├── dish-card/         # (YOUR WORK)
│           ├── package-card/      # (YOUR WORK)
│           └── loader/            # (YOUR WORK)
├── styles/                        # Global design system (YOUR WORK)
│   ├── _variables.scss
│   ├── _typography.scss
│   └── styles.scss
└── environments/                  # API config (Dev 1)
```

### Angular 17+ Patterns (Signals & Standalone)

**All new components must be standalone:**
```typescript
import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-dish-card',
  standalone: true,
  imports: [CommonModule, FormsModule],  // Explicitly import dependencies
  template: `<div>{{ dish().name }}</div>`,
  styleUrl: './dish-card.component.scss'
})
export class DishCardComponent {
  dish = input.required<Dish>();     // Read-only input
  onEdit = output<string>();         // Event emitter replacement
  
  count = signal(0);                  // Reactive state
  
  increment() {
    this.count.update(c => c + 1);
  }
}
```

**Key patterns:**
- `input()` for props (replaces `@Input`)
- `output()` for events (replaces `@Output() EventEmitter`)
- `signal()` for reactive state
- No NgModule — standalone only
- TypeScript strict mode — zero `any` type

### Styling Conventions

**Color Palette (luxury/dark theme):**
- **Gold:** `#C9A84C` (primary accent)
- **Gold Light:** `#E8D5A3` (hover/light accent)
- **Gold Dark:** `#A07830` (pressed/dark accent)
- **Black:** `#111111` (background)
- **Black Soft:** `#1E1E1E` (card background)
- **White:** `#F9F9F9` (text)
- **White Dim:** `#E0E0E0` (secondary text)
- **Gray:** `#5C5C5C` (disabled/muted)

**Typography:**
- **Display:** Playfair Display (headings)
- **Body:** Inter (body text, UI)

**Spacing & Radius:**
- Radius small: `6px`
- Radius medium: `12px`
- Radius large: `20px`

**All styling must use the SCSS variables from `src/styles/_variables.scss`** — never hardcode colors.

---

## API Integration

### Backend Base URL
```typescript
// environment.ts (handled by Dev 1)
export const environment = {
  apiUrl: 'http://localhost:3000/api'
};
```

### Dish Endpoints (YOUR WORK)
```
GET    /api/dishes              → Fetch all dishes
POST   /api/dishes              → Create dish (admin only)
PUT    /api/dishes/:id          → Update dish (admin only)
DELETE /api/dishes/:id          → Delete dish (admin only)
```

### Package Endpoints (YOUR WORK)
```
GET    /api/packages            → Fetch all packages
POST   /api/packages            → Create package (admin only)
PUT    /api/packages/:id        → Update package (admin only)
DELETE /api/packages/:id        → Delete package (admin only)
```

### Authentication
- **JWT Token:** Automatically injected by `auth.interceptor.ts` (Dev 1) — no manual token attachment needed
- **Admin Check:** Inject `AuthService` and use `authService.isAdmin()` signal
- Example:
  ```typescript
  constructor(private authService: AuthService) {}
  isAdmin = this.authService.isAdmin;  // Reactive signal
  ```

### HTTP Client Pattern
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DishService {
  private apiUrl = `${environment.apiUrl}/dishes`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Dish[]>(this.apiUrl);
  }

  create(dish: Partial<Dish>) {
    return this.http.post<Dish>(this.apiUrl, dish);
  }

  update(id: string, dish: Partial<Dish>) {
    return this.http.put<Dish>(`${this.apiUrl}/${id}`, dish);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

---

## Your Features Checklist

### Design System (Priority 1)
- [ ] `src/styles/_variables.scss` — Color, typography, spacing variables
- [ ] `src/styles/_typography.scss` — Base heading & body styles
- [ ] `src/styles/styles.scss` — Global buttons, cards, grid layout
- [ ] Responsive grid: 3 cols (desktop) → 2 cols (tablet) → 1 col (mobile)
- [ ] All button states (.btn-primary, .btn-secondary)
- [ ] Card hover/shadow effects

### Dishes Feature (Priority 2)
- [ ] `DishService` — CRUD operations via HttpClient
- [ ] `DishListComponent` — Grid display with search/filter
- [ ] `DishCardComponent` — Reusable card with edit/delete for admins
- [ ] `DishDetailComponent` — Route `/dishes/:id` detail page
- [ ] `DishFormComponent` — Create/Edit form (admin only, embedded in admin dashboard)

### Packages Feature (Priority 2)
- [ ] `PackageService` — CRUD operations via HttpClient
- [ ] `PackageListComponent` — Grid display
- [ ] `PackageCardComponent` — Reusable card with edit/delete for admins
- [ ] `PackageDetailComponent` — Route `/packages/:id` detail page
- [ ] `PackageFormComponent` — Create/Edit form (admin only, embedded in admin dashboard)

### Home Page (Priority 2)
- [ ] Hero section with dark overlay + Unsplash background image
- [ ] Featured Dishes carousel (first 3 from API)
- [ ] Featured Packages carousel (first 3 from API)
- [ ] Two CTA buttons: Browse Dishes, Browse Packages

### Admin Dashboard (Priority 3)
- [ ] Admin sidebar with "Manage Dishes" and "Manage Packages" links
- [ ] Content area that loads DishForm or PackageForm based on selection
- [ ] Route: `/admin/dashboard` (guarded by `admin.guard.ts`)

### Shared Components (Priority 3)
- [ ] `LoaderComponent` — Gold spinning ring for loading states
- [ ] Apply loader to all API calls (dishes/packages lists)

---

## Development Patterns

### Component Structure
```typescript
// Example: DishListComponent

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishService } from '../dish.service';
import { DishCardComponent } from '../../shared/components/dish-card/dish-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Dish } from '../../core/models/dish.model';

@Component({
  selector: 'app-dish-list',
  standalone: true,
  imports: [CommonModule, DishCardComponent, LoaderComponent],
  template: `
    <div class="dishes-container">
      <h1 class="gold-text">Our Dishes</h1>
      
      @if (isLoading()) {
        <app-loader></app-loader>
      } @else {
        <div class="grid-3">
          @for (dish of dishes(); track dish.id) {
            <app-dish-card
              [dish]="dish"
              [isAdmin]="isAdmin()"
              (onEdit)="editDish($event)"
              (onDelete)="deleteDish($event)"
            />
          }
        </div>
      }
    </div>
  `,
  styleUrl: './dish-list.component.scss'
})
export class DishListComponent implements OnInit {
  dishes = signal<Dish[]>([]);
  isLoading = signal(false);
  isAdmin = this.authService.isAdmin;

  constructor(
    private dishService: DishService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDishes();
  }

  private loadDishes() {
    this.isLoading.set(true);
    this.dishService.getAll().subscribe({
      next: (data) => {
        this.dishes.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dishes:', err);
        this.isLoading.set(false);
      }
    });
  }

  editDish(id: string) {
    // Navigate to edit form
  }

  deleteDish(id: string) {
    if (!confirm('Delete this dish?')) return;
    
    this.dishService.delete(id).subscribe({
      next: () => this.loadDishes(),
      error: (err) => console.error('Delete failed:', err)
    });
  }
}
```

### Form Pattern (Create/Edit)
Use Angular's reactive forms or template-driven (your choice). Ensure:
1. Validate all inputs before submit
2. Disable submit button while saving
3. Show success/error toast (via `ToastService` from Dev 1)
4. Emit `onSaved` event after successful save

### Image URLs
Use real Unsplash URLs (free, no attribution required):
```
Hero background:
https://images.unsplash.com/photo-1555244162-803834f70033?w=1400

Catering event:
https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800

Fine dining:
https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800

Food platter:
https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800

Dish close-up:
https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800

Elegant dish:
https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800
```

---

## Common Tasks

### Adding a Dish List Component
1. Create `src/app/features/dishes/dish-list/dish-list.component.ts`
2. Import `DishService`, `DishCardComponent`, `LoaderComponent`
3. Load dishes on `ngOnInit()` with loading signal
4. Render grid of `DishCardComponent`
5. Show loader during API call

### Adding a Feature Component
1. Make it **standalone: true**
2. Explicitly import all dependencies in `imports: []`
3. Use signals for state management
4. Use input/output decorators for props/events
5. No `any` types — specify full types

### Styling a Component
1. Import variables from `src/styles/_variables.scss`
2. Use `$gold`, `$black`, `$white` constants
3. Apply responsive design: desktop-first, then tablet, then mobile
4. Reference: `.grid-3 { grid-template-columns: repeat(3, 1fr); }` on desktop

---

## Build & Deployment

```bash
npm run build              # Build for production → dist/catering-client/
```

The built app will connect to `environment.prod.ts` (configured by Dev 1).

---

## Tips & Pitfalls

- **JWT Token:** Already in every request via interceptor — don't try to add it manually
- **Admin Check:** Use `authService.isAdmin()` signal, not hardcoded checks
- **Strict Mode:** TypeScript strict is ON — you must type everything
- **Standalone:** No NgModule — every component imports its dependencies
- **Signals:** Use `signal()`, `computed()`, and reactive patterns — no RxJS subscription hell
- **Router:** Dev 1 owns routing — ask them if you need a new route
- **Models:** Dev 1 owns `src/app/core/models/` — use what's already there
- **Toast:** Use `ToastService.success()` / `.error()` for user feedback
- **Loader:** Create a reusable loader component, use it everywhere during API calls

---

## Resources

- [Angular 17+ Docs](https://angular.io)
- [Signals API](https://angular.io/guide/signals)
- [HttpClient Guide](https://angular.io/guide/http)
- [Standalone Components](https://angular.io/guide/standalone-components)
- [SCSS Documentation](https://sass-lang.com)

