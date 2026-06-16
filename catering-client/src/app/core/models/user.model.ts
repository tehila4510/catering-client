export interface User {
  // _id is intentionally excluded — never expose MongoDB _id on the client
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  createdAt?: Date;
}
