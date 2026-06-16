export interface CreateOrderDto {
  packageId: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  selectedItems?: string[];
  totalPrice?: number;
}

export interface UpdateOrderDto {
  eventDate?: string;
  address?: string;
  numberOfGuests?: number;
  isApproved?: boolean;
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
  isApproved: boolean;
}

export const ORDER_STATUS_PENDING = 'ממתין לאישור';
export const ORDER_STATUS_APPROVED = 'מאושר';

export function orderStatusLabel(order: Pick<Order, 'isApproved'>): string {
  return order.isApproved ? ORDER_STATUS_APPROVED : ORDER_STATUS_PENDING;
}
