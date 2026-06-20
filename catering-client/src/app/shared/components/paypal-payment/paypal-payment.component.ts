import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { PaymentService } from '../../../features/orders/payment.service';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-paypal-payment',
  standalone: true,
  imports: [LoaderComponent],
  template: `
    <div class="paypal-payment">
      @if (paid()) {
        <p class="success-msg">{{ successMessage() }}</p>
      } @else {
        @if (showHint()) {
          <p class="pay-hint">לתשלום ולאישור ההזמנה, השלם את התשלום באמצעות PayPal:</p>
        }

        @if (paypalLoading()) {
          <app-loader />
        }

        @if (paymentError()) {
          <p class="error-msg">{{ paymentError() }}</p>
        }

        <div #buttonContainer class="paypal-button-container"></div>

        @if (capturing()) {
          <p class="pay-hint">מאמת את התשלום...</p>
        }
      }
    </div>
  `,
  styleUrl: './paypal-payment.component.scss',
})
export class PaypalPaymentComponent implements AfterViewInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private zone = inject(NgZone);

  orderId = input.required<string>();
  showHint = input(true);
  successMessage = input('התשלום בוצע בהצלחה! ההזמנה אושרה');

  paymentSuccess = output<void>();

  paypalLoading = signal(false);
  capturing = signal(false);
  paymentError = signal('');
  paid = signal(false);

  private buttonContainer = viewChild<ElementRef<HTMLElement>>('buttonContainer');
  private paypalRendered = false;
  private started = false;

  ngAfterViewInit(): void {
    this.startPayment();
  }

  ngOnDestroy(): void {
    const el = this.buttonContainer()?.nativeElement;
    if (el) {
      el.innerHTML = '';
    }
  }

  private startPayment(): void {
    if (this.started) return;
    this.started = true;

    const orderId = this.orderId();
    this.paymentError.set('');
    this.paypalLoading.set(true);

    this.paymentService.createPaypalOrder(orderId).subscribe({
      next: (paypalOrderId) => {
        this.renderPaypalButtons(paypalOrderId, orderId);
      },
      error: (e: { error?: { message?: string } }) => {
        this.paypalLoading.set(false);
        this.paymentError.set(
          e.error?.message || 'אירעה שגיאה בהפעלת התשלום, נסה שוב',
        );
      },
    });
  }

  private async renderPaypalButtons(paypalOrderId: string, orderId: string): Promise<void> {
    try {
      const paypal = await this.paymentService.loadPaypalSdk();
      this.paypalLoading.set(false);

      if (!paypal?.Buttons) {
        this.paymentError.set('טעינת PayPal נכשלה, נסה שוב');
        return;
      }

      const container = this.buttonContainer()?.nativeElement;
      if (!container || this.paypalRendered) return;
      this.paypalRendered = true;

      paypal
        .Buttons({
          createOrder: () => Promise.resolve(paypalOrderId),
          onApprove: () => this.onPaypalApprove(paypalOrderId, orderId),
          onError: () =>
            this.zone.run(() => this.paymentError.set('התשלום נכשל, נסה שוב')),
        })
        .render(container);
    } catch {
      this.paypalLoading.set(false);
      this.paymentError.set('טעינת PayPal נכשלה, נסה שוב');
    }
  }

  private onPaypalApprove(paypalOrderId: string, orderId: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.zone.run(() => {
        this.capturing.set(true);
        this.paymentError.set('');

        this.paymentService.capturePaypalOrder(paypalOrderId, orderId).subscribe({
          next: (success) => {
            this.capturing.set(false);
            if (success) {
              this.paid.set(true);
              this.paymentSuccess.emit();
            } else {
              this.paymentError.set('התשלום נכשל, נסה שוב');
            }
            resolve();
          },
          error: () => {
            this.capturing.set(false);
            this.paymentError.set('התשלום נכשל, נסה שוב');
            resolve();
          },
        });
      });
    });
  }
}
