export interface User {
  // _id is intentionally excluded — never expose MongoDB _id on the client
  email: string;
  role: 'admin' | 'customer';
  createdAt?: Date;
}
