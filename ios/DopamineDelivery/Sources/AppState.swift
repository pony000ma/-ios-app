import Foundation
import Observation

enum BeginExpectationResult: Equatable {
  case started
  case needsRegistration
  case needsRecharge(required: Double, balance: Double)
}

@MainActor
@Observable
final class AppState {
  private struct PersistedState: Codable {
    var cart: [CartItem]
    var history: [ReflectionSummary]
    var activeOrder: SimulatedOrder?
    var latestReflection: ReflectionSummary?
    var selectedAddressId: String
    var profile: UserProfile?
  }

  let fixture: FixtureData
  var cart: [CartItem] = []
  var history: [ReflectionSummary] = []
  var activeOrder: SimulatedOrder?
  var latestReflection: ReflectionSummary?
  var selectedAddressId: String
  var profile: UserProfile = .empty

  private let storageKey = "DopamineDelivery.state"
  let reflectionUnlockSeconds = 90
  let suggestedUsernames = ["钱包守夜人", "奶茶撤退冠军", "炸鸡冷静观察员", "深夜下单刹车片", "余额保卫处处长"]
  let rechargeAmounts: [Double] = [66, 128, 288, 520]

  init(fixture: FixtureData = .load()) {
    self.fixture = fixture
    self.selectedAddressId = fixture.addresses.first?.id ?? ""
    restore()
  }

  var selectedAddress: VirtualAddress {
    fixture.addresses.first(where: { $0.id == selectedAddressId }) ?? fixture.addresses[0]
  }

  var cartLines: [CartLine] {
    cart.compactMap { item in
      guard
        let restaurant = fixture.restaurants.first(where: { $0.id == item.restaurantId }),
        let menuItem = restaurant.allItems.first(where: { $0.id == item.menuItemId })
      else { return nil }

      return CartLine(restaurant: restaurant, item: menuItem, quantity: item.quantity)
    }
  }

  var cartTotals: CartTotals {
    let subtotal = cartLines.reduce(0) { $0 + $1.lineTotal }
    let deliveryFee = cartLines.map(\.restaurant.deliveryFee).max() ?? 0
    let coupon = fixture.coupons
      .filter { subtotal >= $0.threshold }
      .sorted { $0.discount > $1.discount }
      .first
    let discount = coupon?.discount ?? 0
    let total = max(0, subtotal + deliveryFee - discount)
    return CartTotals(subtotal: subtotal, deliveryFee: deliveryFee, discount: discount, total: total, savedAmount: total, coupon: coupon)
  }

  var totalSaved: Double {
    history.reduce(0) { $0 + $1.savedAmount }
  }

  var topCategory: String {
    let counts = Dictionary(grouping: history, by: \.dominantCategory).mapValues(\.count)
    return counts.sorted { $0.value > $1.value }.first?.key ?? "还没有"
  }

  func addToCart(restaurant: Restaurant, item: MenuItem) {
    latestReflection = nil
    if let index = cart.firstIndex(where: { $0.restaurantId == restaurant.id && $0.menuItemId == item.id }) {
      cart[index].quantity += 1
    } else {
      cart.append(CartItem(restaurantId: restaurant.id, menuItemId: item.id, quantity: 1))
    }
    persist()
  }

  func decrementCart(_ line: CartLine) {
    guard let index = cart.firstIndex(where: { $0.restaurantId == line.restaurant.id && $0.menuItemId == line.item.id }) else { return }
    cart[index].quantity -= 1
    if cart[index].quantity <= 0 {
      cart.remove(at: index)
    }
    persist()
  }

  func removeCart(_ line: CartLine) {
    cart.removeAll { $0.restaurantId == line.restaurant.id && $0.menuItemId == line.item.id }
    persist()
  }

  func selectAddress(_ address: VirtualAddress) {
    selectedAddressId = address.id
    persist()
  }

  func beginExpectation() -> BeginExpectationResult {
    guard !cart.isEmpty else { return .needsRegistration }
    guard profile.isRegistered else { return .needsRegistration }
    guard profile.balance >= cartTotals.total else {
      return .needsRecharge(required: cartTotals.total, balance: profile.balance)
    }

    latestReflection = nil
    profile.balance = max(0, profile.balance - cartTotals.total)
    activeOrder = SimulatedOrder(
      id: UUID().uuidString,
      createdAt: Date(),
      address: selectedAddress,
      items: cart,
      totals: cartTotals
    )
    persist()
    return .started
  }

  func finishExpectation() {
    guard let order = activeOrder else { return }
    let lines = lines(for: order.items)
    let categoryCounts = Dictionary(grouping: lines, by: \.restaurant.category).mapValues(\.count)
    let dominantCategory = categoryCounts.sorted { $0.value > $1.value }.first?.key ?? "夜宵"
    let summary = ReflectionSummary(
      id: UUID().uuidString,
      createdAt: Date(),
      orderId: order.id,
      savedAmount: order.totals.savedAmount,
      itemNames: lines.map { "\($0.item.name) x\($0.quantity)" },
      dominantCategory: dominantCategory,
      copy: "你已经拥有了最快乐的那一部分，真实账单今晚没有发生。"
    )
    latestReflection = summary
    history.insert(summary, at: 0)
    history = Array(history.prefix(20))
    cart = []
    activeOrder = nil
    persist()
  }

  func clearLatestReflection() {
    latestReflection = nil
    persist()
  }

  func registerUser(name: String, initialAmount: Double) {
    let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
    profile.isRegistered = true
    profile.username = cleanName.isEmpty ? suggestedUsernames[0] : cleanName
    profile.balance = max(0, profile.balance + initialAmount)
    persist()
  }

  func recharge(amount: Double) {
    guard profile.isRegistered else { return }
    profile.balance = max(0, profile.balance + amount)
    persist()
  }

  func setTheme(_ part: ProfileThemePart, to choice: DopamineColorChoice) {
    switch part {
    case .background:
      profile.backgroundColor = choice
    case .icon:
      profile.iconColor = choice
    case .font:
      profile.fontColor = choice
    }
    persist()
  }

  func status(forElapsed seconds: Int) -> OrderStatusEvent {
    fixture.statusEvents
      .sorted { $0.unlockSecond < $1.unlockSecond }
      .reduce(fixture.statusEvents[0]) { current, event in
        seconds >= event.unlockSecond ? event : current
      }
  }

  func progress(forElapsed seconds: Int) -> Double {
    min(1, max(0, Double(seconds) / Double(reflectionUnlockSeconds)))
  }

  func lines(for items: [CartItem]) -> [CartLine] {
    items.compactMap { item in
      guard
        let restaurant = fixture.restaurants.first(where: { $0.id == item.restaurantId }),
        let menuItem = restaurant.allItems.first(where: { $0.id == item.menuItemId })
      else { return nil }

      return CartLine(restaurant: restaurant, item: menuItem, quantity: item.quantity)
    }
  }

  private func restore() {
    guard
      let data = UserDefaults.standard.data(forKey: storageKey),
      let persisted = try? JSONDecoder().decode(PersistedState.self, from: data)
    else { return }

    cart = persisted.cart
    history = persisted.history
    activeOrder = persisted.activeOrder
    latestReflection = persisted.latestReflection
    profile = persisted.profile ?? .empty
    if fixture.addresses.contains(where: { $0.id == persisted.selectedAddressId }) {
      selectedAddressId = persisted.selectedAddressId
    }
  }

  private func persist() {
    let payload = PersistedState(
      cart: cart,
      history: history,
      activeOrder: activeOrder,
      latestReflection: latestReflection,
      selectedAddressId: selectedAddressId,
      profile: profile
    )

    if let data = try? JSONEncoder().encode(payload) {
      UserDefaults.standard.set(data, forKey: storageKey)
    }
  }
}

enum ProfileThemePart {
  case background
  case icon
  case font
}

func money(_ value: Double) -> String {
  if value.rounded() == value {
    return "¥\(Int(value))"
  }

  return String(format: "¥%.1f", value)
}
