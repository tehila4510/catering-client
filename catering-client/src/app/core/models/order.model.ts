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
  isApproved?: boolean;
}

/** DTO for customer self-edit — isApproved is intentionally omitted. */
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
  isApproved: boolean;
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
  isApproved: boolean;
  dishes: OrderDishItem[];
}

export const ORDER_STATUS_PENDING = 'ממתין לאישור';
export const ORDER_STATUS_APPROVED = 'מאושר';

export function orderStatusLabel(order: Pick<Order, 'isApproved'>): string {
  return order.isApproved ? ORDER_STATUS_APPROVED : ORDER_STATUS_PENDING;
}
