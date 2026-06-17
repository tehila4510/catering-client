import { Component, OnInit, signal, inject } from '@angular/core';

import { Package } from '../../../core/models/package.model';
import { PackageService } from '../../packages/package.service';
import { PackageFormComponent } from '../../packages/package-form/package-form.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../core/services/toast.service';
import { formatPackageLimitsSummary } from '../../../core/constants/categories';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [PackageFormComponent, LoaderComponent],
  template: `
    <div class="admin-section">
      <div class="section-header">
        <h1>ניהול חבילות</h1>
        <button class="btn-primary" (click)="openCreateForm()">+ הוספת חבילה</button>
      </div>

      @if (loading()) {
        <app-loader />
      }

      @if (!loading() && packages().length === 0) {
        <div class="empty-state">לא נמצאו חבילות</div>
      }

      @if (!loading() && packages().length > 0) {
        <div class="admin-table">
          <div class="table-head">
            <span class="col-name">שם החבילה</span>
            <span class="col-limits">לימיטים</span>
            <span class="col-price">מחיר לאדם</span>
            <span class="col-actions">פעולות</span>
          </div>
          @for (pkg of packages(); track pkg.id) {
            <div class="table-row">
              <span class="col-name">{{ pkg.name }}</span>
              <span class="col-limits">{{ limitsSummary(pkg) }}</span>
              <span class="col-price">₪{{ pkg.pricePerPerson }}</span>
              <span class="col-actions">
                <button class="btn-edit" (click)="openEditForm(pkg)">עריכה</button>
                <button class="btn-delete" (click)="deletePackage(pkg)">מחיקה</button>
              </span>
            </div>
          }
        </div>
      }

      @if (showForm()) {
        <div
          class="modal-overlay"
          role="button"
          tabindex="0"
          (click)="closeForm()"
          (keydown.escape)="closeForm()"
        >
          <div
            class="modal-box"
            role="presentation"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <app-package-form
              [pkg]="editingPkg()"
              (saved)="onSaved()"
              (cancelled)="closeForm()"
            />
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-packages.component.scss',
})
export class AdminPackagesComponent implements OnInit {
  private packageService = inject(PackageService);
  private toast = inject(ToastService);

  packages = signal<Package[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingPkg = signal<Package | null>(null);

  limitsSummary(pkg: Package): string {
    return formatPackageLimitsSummary(pkg.limits);
  }

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading.set(true);
    this.packageService.getAll().subscribe({
      next: (data) => {
        this.packages.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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

  onSaved(): void {
    this.closeForm();
    this.loadPackages();
  }

  deletePackage(pkg: Package): void {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את החבילה "${pkg.name}"?`)) return;
    this.packageService.delete(pkg.id).subscribe(() => {
      this.toast.show('החבילה נמחקה בהצלחה', 'success');
      this.loadPackages();
    });
  }
}
