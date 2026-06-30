export type OrderStatus =
  | 'placed'
  | 'preparing'
  | 'riderAssigned'
  | 'nearby'
  | 'almostThere'
  | 'stillAlmostThere'
  | 'reflectionReady';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  heat: number;
  imageName: string;
  tags: string[];
}

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  distanceKm: number;
  deliveryFee: number;
  minimumOrder: number;
  etaMinutes: number;
  tags: string[];
  imageName: string;
  menuSections: MenuSection[];
}

export interface VirtualCoupon {
  id: string;
  title: string;
  threshold: number;
  discount: number;
  copy: string;
}

export interface VirtualAddress {
  id: string;
  label: string;
  detail: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  unlockSecond: number;
  title: string;
  detail: string;
}

export interface FixtureData {
  restaurants: Restaurant[];
  coupons: VirtualCoupon[];
  addresses: VirtualAddress[];
  statusEvents: OrderStatusEvent[];
}

export interface CartItem {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
}

export interface CartLine extends CartItem {
  restaurant: Restaurant;
  item: MenuItem;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  savedAmount: number;
  coupon?: VirtualCoupon;
}

export interface SimulatedOrder {
  id: string;
  createdAt: string;
  address: VirtualAddress;
  items: CartItem[];
  totals: CartTotals;
}

export interface ReflectionSummary {
  id: string;
  createdAt: string;
  orderId: string;
  savedAmount: number;
  itemNames: string[];
  dominantCategory: string;
  copy: string;
}

export type DopamineColorId = 'pink' | 'green' | 'purple' | 'orange' | 'blue' | 'yellow';

export interface UserProfile {
  isRegistered: boolean;
  username: string;
  balance: number;
  backgroundColor: DopamineColorId;
  iconColor: DopamineColorId;
  fontColor: DopamineColorId;
}

export interface DopaminePalette {
  id: DopamineColorId;
  label: string;
  color: string;
  soft: string;
  contrast: string;
}
