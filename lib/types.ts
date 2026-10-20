export type UserRole = 'buyer' | 'seller' | 'admin';
export type ListingStatus = 'active' | 'paused' | 'sold_out';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'refunded';
export type PaymentMethod = 'online' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'released' | 'refunded' | 'failed';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  address: string | null;
  farm_name: string | null;
  approved: boolean;
  payout_account: string | null;
  created_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  price_per_kg: number;
  quantity_kg: number;
  harvest_date: string | null;
  area: string | null;
  status: ListingStatus;
  created_at: string;
  seller?: Pick<Profile, 'id' | 'full_name' | 'farm_name' | 'address' | 'phone'>;
};

export type Order = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  quantity_kg: number;
  unit_price: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  listing?: Pick<Listing, 'id' | 'name' | 'image_url' | 'category' | 'area'>;
  buyer?: Pick<Profile, 'id' | 'full_name' | 'phone' | 'address'>;
  seller?: Pick<Profile, 'id' | 'full_name' | 'farm_name' | 'phone' | 'address'>;
  payment?: Payment | null;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  platform_fee: number;
  method: PaymentMethod;
  provider_ref: string | null;
  status: PaymentStatus;
  created_at: string;
};

export const VEGETABLE_CATEGORIES = [
  'Leafy',
  'Root',
  'Fruit',
  'Cruciferous',
  'Pod',
  'Other',
] as const;
