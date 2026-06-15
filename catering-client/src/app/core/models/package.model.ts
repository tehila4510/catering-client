import { Dish } from './dish.model';

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  dishes: Dish[];
  imageUrl?: string;
}
