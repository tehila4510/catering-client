import { Component, OnInit, signal, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Package } from '../../../core/models/package.model';
import { PackageService } from '../package.service';
import { AuthService } from '../../../core/services/auth.service';
import { PackageCardComponent } from '../../../shared/components/package-card/package-card.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { PackageFormComponent } from '../package-form/package-form.component';

@Component({
  selector: 'app-package-list',
  standalone: true,
  imports: [FormsModule, PackageCardComponent, LoaderComponent, PackageFormComponent],
  template: `
    <section class="packages-page">
      <div class="page-header">
        <h1>החבילות שלנו</h1>
        <p class="label-caps">חבילות מאוצרות לכל אירוע</p>
      </div>
    
      <div class="toolbar">
        <input
          class="search-input"
          type="text"
          placeholder="חיפוש חבילה..."
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearch()"
          />
          @if (authService.isAdmin()) {
            <button
              class="btn-primary"
              (click)="openCreateForm()"
            >+ הוספת חבילה</button>
          }
        </div>
    
        @if (loading()) {
          <app-loader />
        }
    
        @if (!loading() && filtered().length === 0) {
          <div class="empty-state">
            <p>לא נמצאו חבילות</p>
          </div>
        }
    
        @if (!loading()) {
          <div class="grid-3">
            @for (pkg of filtered(); track pkg) {
              <app-package-card
                [pkg]="pkg"
                [isAdmin]="authService.isAdmin()"
                (edited)="openEditForm($event)"
                (deleted)="deletePackage($event)"
                />
            }
          </div>
        }
    
        @if (showForm()) {
          <div class="modal-overlay" role="button" tabindex="0" (click)="closeForm()" (keydown.escape)="closeForm()">
            <div class="modal-box" role="presentation" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
              <app-package-form
                [pkg]="editingPkg()"
                (saved)="onPackageSaved()"
                (cancelled)="closeForm()"
                />
              </div>
            </div>
          }
        </section>
    `,
  styleUrl: './package-list.component.scss',
})
export class PackageListComponent implements OnInit {
  private packageService = inject(PackageService);
  authService = inject(AuthService);

  packages = signal<Package[]>([]);
  filtered = signal<Package[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingPkg = signal<Package | null>(null);
  searchTerm = '';

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading.set(true);
    this.packageService.getAll().subscribe({
      next: (data) => {
        this.packages.set(data);
        this.filtered.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered.set(
      this.packages().filter((p) => p.name.toLowerCase().includes(term)),
    );
  }

  openCreateForm(): void {
    this.editingPkg.set(null);
    this.showForm.set(true);
  }

  openEditForm(pkg: Package): void {
    this.editingPkg.set(pkg);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingPkg.set(null);
  }

  onPackageSaved(): void {
    this.closeForm();
    this.loadPackages();
  }

  deletePackage(id: string): void {
    if (!confirm('האם אתה בטוח שברצונך למחוק את החבילה?')) return;
    this.packageService.delete(id).subscribe(() => this.loadPackages());
  }
}
