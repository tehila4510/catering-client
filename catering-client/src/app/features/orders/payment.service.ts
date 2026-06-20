import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { loadScript, PayPalNamespace } from '@paypal/paypal-js';

import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface CreatePaypalOrderResponse {
  paypalOrderId: string;
}

interface CapturePaypalOrderResponse {
  success: boolean;
  paymentStatus: string;
  orderId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/payments`;

  // Cache the loaded PayPal SDK so we only inject the script once per app session.
  private paypalPromise: Promise<PayPalNamespace | null> | null = null;

  /** Creates a PayPal order on our backend for the given internal order. */
  createPaypalOrder(orderId: string): Observable<string> {
    return this.http
      .post<ApiResponse<CreatePaypalOrderResponse>>(`${this.apiUrl}/create-paypal-order`, {
        orderId,
      })
      .pipe(map((res) => res.data.paypalOrderId));
  }

  /** Asks our backend to capture the payment server-side and confirm success. */
  capturePaypalOrder(paypalOrderId: string, orderId: string): Observable<boolean> {
    return this.http
      .post<ApiResponse<CapturePaypalOrderResponse>>(`${this.apiUrl}/capture-paypal-order`, {
        paypalOrderId,
        orderId,
      })
      .pipe(map((res) => res.data.success === true));
  }

  /**
   * Loads the PayPal JS SDK using the public client ID. The secret is never
   * referenced on the frontend — only the backend uses it to create/capture.
   */
  loadPaypalSdk(): Promise<PayPalNamespace | null> {
    if (!this.paypalPromise) {
      this.paypalPromise = loadScript({
        clientId: environment.paypalClientId,
        currency: 'ILS',
        intent: 'capture',
      });
    }
    return this.paypalPromise;
  }
}
