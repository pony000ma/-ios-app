import fixture from '../../shared/fixtures/dopamine-menu.json';
import type {
  CartItem,
  CartLine,
  CartTotals,
  DopamineColorId,
  DopaminePalette,
  FixtureData,
  MenuItem,
  OrderStatus,
  OrderStatusEvent,
  ReflectionSummary,
  Restaurant,
  SimulatedOrder,
  UserProfile,
  VirtualAddress,
  VirtualCoupon,
} from './types';

export const data = fixture as FixtureData;

const completionStatuses = new Set<string>(['delivered', 'paid', 'completed']);

export const suggestedUsernames = [
  '钱包守夜人',
  '奶茶撤退冠军',
  '炸鸡冷静观察员',
  '深夜下单刹车片',
  '余额保卫处处长',
];

export const rechargeAmounts = [66, 128, 288, 520];

export const dopaminePalettes: DopaminePalette[] = [
  { id: 'pink', label: '多巴胺粉', color: '#ff4fa3', soft: '#fff0f7', contrast: '#5c1234' },
  { id: 'green', label: '多巴胺绿', color: '#35d06f', soft: '#edfff3', contrast: '#0f4a27' },
  { id: 'purple', label: '多巴胺紫', color: '#9b5cff', soft: '#f6f0ff', contrast: '#321266' },
  { id: 'orange', label: '多巴胺橙', color: '#ff8a2a', soft: '#fff3e8', contrast: '#66310a' },
];

export function paletteFor(id: DopamineColorId): DopaminePalette {
  return dopaminePalettes.find((palette) => palette.id === id) ?? dopaminePalettes[1];
}

export function defaultUserProfile(): UserProfile {
  return {
    isRegistered: false,
    username: '',
    balance: 0,
    backgroundColor: 'pink',
    iconColor: 'green',
    fontColor: 'purple',
  };
}

export function registerProfile(profile: UserProfile, username: string, initialAmount: number): UserProfile {
  const cleanName = username.trim() || suggestedUsernames[0];
  return {
    ...profile,
    isRegistered: true,
    username: cleanName,
    balance: Math.max(0, profile.balance + initialAmount),
  };
}

export function rechargeProfile(profile: UserProfile, amount: number): UserProfile {
  return {
    ...profile,
    balance: Math.max(0, profile.balance + amount),
  };
}

export function chargeProfile(profile: UserProfile, amount: number): { profile: UserProfile; ok: boolean } {
  if (!profile.isRegistered || profile.balance < amount) {
    return { profile, ok: false };
  }

  return {
    profile: { ...profile, balance: Math.max(0, profile.balance - amount) },
    ok: true,
  };
}

export function allMenuItems(restaurant: Restaurant): MenuItem[] {
  return restaurant.menuSections.flatMap((section) => section.items);
}

export function findMenuItem(restaurants: Restaurant[], restaurantId: string, menuItemId: string) {
  const restaurant = restaurants.find((candidate) => candidate.id === restaurantId);
  const item = restaurant ? allMenuItems(restaurant).find((candidate) => candidate.id === menuItemId) : undefined;
  return restaurant && item ? { restaurant, item } : undefined;
}

export function addToCart(cart: CartItem[], restaurantId: string, menuItemId: string): CartItem[] {
  const existing = cart.find((item) => item.restaurantId === restaurantId && item.menuItemId === menuItemId);
  if (existing) {
    return cart.map((item) =>
      item.restaurantId === restaurantId && item.menuItemId === menuItemId
        ? { ...item, quantity: item.quantity + 1 }
        : item,
    );
  }
  return [...cart, { restaurantId, menuItemId, quantity: 1 }];
}

export function decrementCart(cart: CartItem[], restaurantId: string, menuItemId: string): CartItem[] {
  return cart
    .map((item) =>
      item.restaurantId === restaurantId && item.menuItemId === menuItemId
        ? { ...item, quantity: item.quantity - 1 }
        : item,
    )
    .filter((item) => item.quantity > 0);
}

export function removeFromCart(cart: CartItem[], restaurantId: string, menuItemId: string): CartItem[] {
  return cart.filter((item) => item.restaurantId !== restaurantId || item.menuItemId !== menuItemId);
}

export function resolveCartLines(cart: CartItem[], restaurants = data.restaurants): CartLine[] {
  return cart.flatMap((cartItem) => {
    const resolved = findMenuItem(restaurants, cartItem.restaurantId, cartItem.menuItemId);
    if (!resolved) return [];
    return [{ ...cartItem, ...resolved, lineTotal: resolved.item.price * cartItem.quantity }];
  });
}

export function bestCoupon(subtotal: number, coupons: VirtualCoupon[]): VirtualCoupon | undefined {
  return coupons
    .filter((coupon) => subtotal >= coupon.threshold)
    .sort((left, right) => right.discount - left.discount)[0];
}

export function calculateCartTotals(
  cart: CartItem[],
  restaurants = data.restaurants,
  coupons = data.coupons,
): CartTotals {
  const lines = resolveCartLines(cart, restaurants);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryFee = lines.length ? Math.max(...lines.map((line) => line.restaurant.deliveryFee)) : 0;
  const coupon = bestCoupon(subtotal, coupons);
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return {
    subtotal,
    deliveryFee,
    discount,
    total,
    savedAmount: total,
    coupon,
  };
}

export function statusForElapsed(seconds: number, events = data.statusEvents): OrderStatusEvent {
  const sorted = [...events].sort((left, right) => left.unlockSecond - right.unlockSecond);
  return sorted.reduce((current, event) => (seconds >= event.unlockSecond ? event : current), sorted[0]);
}

export function statusProgress(seconds: number, readySecond = 90): number {
  return Math.min(1, Math.max(0, seconds / readySecond));
}

export function isCompletionStatus(status: string): boolean {
  return completionStatuses.has(status);
}

export function createSimulatedOrder(cart: CartItem[], address: VirtualAddress): SimulatedOrder {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    address,
    items: cart,
    totals: calculateCartTotals(cart),
  };
}

export function createReflection(order: SimulatedOrder, restaurants = data.restaurants): ReflectionSummary {
  const lines = resolveCartLines(order.items, restaurants);
  const categories = lines.reduce<Record<string, number>>((acc, line) => {
    acc[line.restaurant.category] = (acc[line.restaurant.category] ?? 0) + line.quantity;
    return acc;
  }, {});
  const dominantCategory = Object.entries(categories).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '夜宵';

  return {
    id: crypto.randomUUID(),
    orderId: order.id,
    createdAt: new Date().toISOString(),
    savedAmount: order.totals.savedAmount,
    itemNames: lines.map((line) => `${line.item.name} x${line.quantity}`),
    dominantCategory,
    copy: '你已经拥有了最快乐的那一部分，真实账单今晚没有发生。',
  };
}

export function summarizeHistory(history: ReflectionSummary[]) {
  const totalSaved = history.reduce((sum, item) => sum + item.savedAmount, 0);
  const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
    acc[item.dominantCategory] = (acc[item.dominantCategory] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '还没有';
  return { totalSaved, topCategory, count: history.length };
}

export function validateFixture(input: FixtureData): string[] {
  const issues: string[] = [];
  const statuses: OrderStatus[] = [
    'placed',
    'preparing',
    'riderAssigned',
    'nearby',
    'almostThere',
    'stillAlmostThere',
    'reflectionReady',
  ];

  for (const restaurant of input.restaurants) {
    if (!restaurant.id || !restaurant.name || !restaurant.imageUrl) issues.push(`restaurant:${restaurant.id}:missing-core`);
    if (!restaurant.menuSections.length) issues.push(`restaurant:${restaurant.id}:missing-menu`);
    for (const item of allMenuItems(restaurant)) {
      if (!item.id || !item.name || !item.imageUrl || item.price <= 0) issues.push(`item:${item.id}:invalid`);
    }
  }

  for (const status of statuses) {
    if (!input.statusEvents.some((event) => event.status === status)) issues.push(`status:${status}:missing`);
  }

  if (input.statusEvents.some((event) => isCompletionStatus(event.status))) {
    issues.push('status:completion-present');
  }

  if (!input.addresses.every((address) => address.label && address.detail)) issues.push('address:invalid');
  return issues;
}
