import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message =
        (err.error as { message?: string })?.message || 'אירעה שגיאה, נסה שוב';
      toast.show(message, 'error');
      return throwError(() => err);
    }),
  );
};
