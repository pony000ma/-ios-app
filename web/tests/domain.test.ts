import { describe, expect, it } from 'vitest';
import {
  addToCart,
  calculateCartTotals,
  chargeProfile,
  createSimulatedOrder,
  data,
  defaultUserProfile,
  decrementCart,
  rechargeProfile,
  registerProfile,
  isCompletionStatus,
  statusForElapsed,
  validateFixture,
} from '../src/domain';

describe('fixture content', () => {
  it('has complete shared content and no completion status', () => {
    expect(validateFixture(data)).toEqual([]);
    expect(data.statusEvents.map((event) => event.status)).not.toContain('delivered');
  });

  it('keeps every category with multiple restaurant choices', () => {
    const byCategory = data.restaurants.reduce<Record<string, number>>((acc, restaurant) => {
      acc[restaurant.category] = (acc[restaurant.category] ?? 0) + 1;
      return acc;
    }, {});

    expect(Object.entries(byCategory).filter(([, count]) => count < 2)).toEqual([]);
  });
});

describe('cart and totals', () => {
  it('adds, decrements, discounts, and treats the virtual total as saved money', () => {
    const restaurant = data.restaurants[0];
    const firstItem = restaurant.menuSections[0].items[0];
    const secondItem = restaurant.menuSections[0].items[1];

    let cart = addToCart([], restaurant.id, firstItem.id);
    cart = addToCart(cart, restaurant.id, secondItem.id);
    cart = addToCart(cart, restaurant.id, firstItem.id);

    const totals = calculateCartTotals(cart);
    expect(cart.find((item) => item.menuItemId === firstItem.id)?.quantity).toBe(2);
    expect(totals.subtotal).toBe(firstItem.price * 2 + secondItem.price);
    expect(totals.discount).toBeGreaterThan(0);
    expect(totals.savedAmount).toBe(totals.total);

    cart = decrementCart(cart, restaurant.id, firstItem.id);
    expect(cart.find((item) => item.menuItemId === firstItem.id)?.quantity).toBe(1);
  });
});

describe('order state machine', () => {
  it('never reports delivered, paid, or completed states', () => {
    for (const event of data.statusEvents) {
      expect(isCompletionStatus(event.status)).toBe(false);
    }

    expect(statusForElapsed(0).status).toBe('placed');
    expect(statusForElapsed(10000).status).toBe('reflectionReady');
  });

  it('creates a simulated order without payment fields', () => {
    const restaurant = data.restaurants[0];
    const item = restaurant.menuSections[0].items[0];
    const order = createSimulatedOrder(addToCart([], restaurant.id, item.id), data.addresses[0]);

    expect(order.address.label).toBe(data.addresses[0].label);
    expect(JSON.stringify(order)).not.toMatch(/payment|pay|card|paid/i);
  });
});

describe('user profile wallet', () => {
  it('registers with stored value, recharges, and blocks insufficient charges', () => {
    const registered = registerProfile(defaultUserProfile(), '钱包守夜人', 66);
    expect(registered.isRegistered).toBe(true);
    expect(registered.username).toBe('钱包守夜人');
    expect(registered.balance).toBe(66);

    const charged = chargeProfile(registered, 42);
    expect(charged.ok).toBe(true);
    expect(charged.profile.balance).toBe(24);

    const blocked = chargeProfile(charged.profile, 99);
    expect(blocked.ok).toBe(false);
    expect(blocked.profile.balance).toBe(24);

    expect(rechargeProfile(blocked.profile, 128).balance).toBe(152);
  });
});
