import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public routes
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'dishes',
    loadComponent: () =>
      import('./features/dishes/dish-list/dish-list.component').then(
        (m) => m.DishListComponent,
      ),
  },
  {
    path: 'dishes/:id',
    loadComponent: () =>
      import('./features/dishes/dish-detail/dish-detail.component').then(
        (m) => m.DishDetailComponent,
      ),
  },
  {
    path: 'packages',
    loadComponent: () =>
      import('./features/packages/package-list/package-list.component').then(
        (m) => m.PackageListComponent,
      ),
  },
  {
    path: 'packages/:id',
    loadComponent: () =>
      import('./features/packages/package-detail/package-detail.component').then(
        (m) => m.PackageDetailComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },

  // Protected routes
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'order/:packageId',
    loadComponent: () =>
      import('./features/orders/order-form/order-form.component').then(
        (m) => m.OrderFormComponent,
      ),
    canActivate: [authGuard],
  },

  // Admin routes
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dishes', pathMatch: 'full' },
      {
        path: 'dishes',
        loadComponent: () =>
          import('./features/admin/admin-dishes/admin-dishes.component').then(
            (m) => m.AdminDishesComponent,
          ),
      },
      {
        path: 'packages',
        loadComponent: () =>
          import(
            './features/admin/admin-packages/admin-packages.component'
          ).then((m) => m.AdminPackagesComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/admin-orders/admin-orders.component').then(
            (m) => m.AdminOrdersComponent,
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'home' },
];
