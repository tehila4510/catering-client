export interface CreateOrderDto {
  packageId: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  selectedItems?: string[];
  totalPrice?: number;
}

export interface UpdateOrderDto {
  packageId?: string;
  selectedItems?: string[];
  eventDate?: string;
  address?: string;
  numberOfGuests?: number;
}

/** DTO for customer self-edit — paymentStatus cannot be changed via this endpoint. */
export interface CustomerUpdateOrderDto {
  packageId?: string;
  selectedItems?: string[];
  eventDate?: string;
  address?: string;
  numberOfGuests?: number;
}

export interface Order {
  id: string;
  packageId: string;
  packageName: string;
  userId: string;
  userName: string;
  userEmail: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  totalPrice: number;
  paymentStatus: string;
}

export interface OrderDishItem {
  id: string;
  name: string;
  category: string;
}

export interface OrderFullDetails {
  id: string;
  userName: string;
  userEmail: string;
  packageName: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  totalPrice: number;
  paymentStatus: string;
  dishes: OrderDishItem[];
}

export const ORDER_STATUS_PENDING = 'ממתין לתשלום';
export const ORDER_STATUS_APPROVED = 'מאושר';

/** True once payment has been confirmed (PayPal capture or admin manual confirm). */
export function isOrderApproved(order: Pick<Order, 'paymentStatus'>): boolean {
  return order.paymentStatus === ORDER_STATUS_APPROVED;
}

export function orderStatusLabel(order: Pick<Order, 'paymentStatus'>): string {
  return isOrderApproved(order) ? ORDER_STATUS_APPROVED : ORDER_STATUS_PENDING;
}
