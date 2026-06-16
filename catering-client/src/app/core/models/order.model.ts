export interface CreateOrderDto {
  packageId: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  selectedItems?: string[];
}

export interface Order {
  id: string;
  packageId: string;
  numberOfGuests: number;
  eventDate: string;
  address: string;
  totalPrice: number;
  isApproved: boolean;
}
