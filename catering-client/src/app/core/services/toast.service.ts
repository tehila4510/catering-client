import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info'): void {
    const toast: Toast = { message, type };
    // Defer the signal mutation out of any in-progress change-detection cycle
    // to avoid NG0100 (ExpressionChangedAfterItHasBeenCheckedError).
    setTimeout(() => {
      this.toasts.update((t) => [...t, toast]);
      setTimeout(
        () => this.toasts.update((t) => t.filter((x) => x !== toast)),
        3500,
      );
    });
  }
}
