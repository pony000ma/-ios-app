import Foundation

struct FixtureData: Codable {
  let restaurants: [Restaurant]
  let coupons: [VirtualCoupon]
  let addresses: [VirtualAddress]
  let statusEvents: [OrderStatusEvent]

  static func load() -> FixtureData {
    guard let url = Bundle.main.url(forResource: "dopamine-menu", withExtension: "json") else {
      return .preview
    }

    do {
      let data = try Data(contentsOf: url)
      return try JSONDecoder().decode(FixtureData.self, from: data)
    } catch {
      return .preview
    }
  }

  static let preview = FixtureData(
    restaurants: [
      Restaurant(
        id: "preview-crispy",
        name: "凌晨脆皮研究所",
        category: "炸鸡",
        rating: 4.8,
        distanceKm: 1.2,
        deliveryFee: 3,
        minimumOrder: 20,
        etaMinutes: 28,
        tags: ["深夜热卖", "永远快到"],
        imageUrl: URL(string: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1200&q=80")!,
        menuSections: [
          MenuSection(
            id: "fried",
            title: "差点拥有炸物",
            items: [
              MenuItem(
                id: "golden-chicken",
                name: "金黄脆皮半只鸡",
                description: "外皮会发出你今晚本来想听见的声音。",
                price: 42,
                calories: 980,
                heat: 98,
                imageUrl: URL(string: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=900&q=80")!,
                tags: ["爆汁", "罪恶感友好"]
              )
            ]
          )
        ]
      )
    ],
    coupons: [VirtualCoupon(id: "almost-8", title: "差点下单券", threshold: 38, discount: 8, copy: "满 38 减 8，减的是冲动，不是快乐。")],
    addresses: [VirtualAddress(id: "sofa", label: "沙发角落 3 号", detail: "不是真实地址，只是一个今晚很懂你的地方。")],
    statusEvents: [
      OrderStatusEvent(status: .placed, unlockSecond: 0, title: "商家已接到你的想象订单", detail: "厨房正在认真处理一份不会产生账单的期待。"),
      OrderStatusEvent(status: .preparing, unlockSecond: 15, title: "正在备餐", detail: "香味正在你的脑内排队出锅。"),
      OrderStatusEvent(status: .riderAssigned, unlockSecond: 35, title: "虚拟骑手已接单", detail: "他会移动，但不会打电话让你下楼。"),
      OrderStatusEvent(status: .nearby, unlockSecond: 55, title: "骑手已在附近", detail: "附近是一个很宽容的概念。"),
      OrderStatusEvent(status: .almostThere, unlockSecond: 75, title: "马上就到", detail: "你已经拥有了最刺激的那一部分。"),
      OrderStatusEvent(status: .stillAlmostThere, unlockSecond: 84, title: "预计 8 分钟后仍然预计 8 分钟", detail: "期待正在无限续杯，现实成本仍为 0。"),
      OrderStatusEvent(status: .reflectionReady, unlockSecond: 90, title: "可以结束期待了", detail: "如果馋已经过去，今晚先放过钱包。")
    ]
  )
}

struct Restaurant: Codable, Identifiable, Hashable {
  let id: String
  let name: String
  let category: String
  let rating: Double
  let distanceKm: Double
  let deliveryFee: Double
  let minimumOrder: Double
  let etaMinutes: Int
  let tags: [String]
  let imageUrl: URL
  let menuSections: [MenuSection]

  var allItems: [MenuItem] {
    menuSections.flatMap(\.items)
  }
}

struct MenuSection: Codable, Identifiable, Hashable {
  let id: String
  let title: String
  let items: [MenuItem]
}

struct MenuItem: Codable, Identifiable, Hashable {
  let id: String
  let name: String
  let description: String
  let price: Double
  let calories: Int
  let heat: Int
  let imageUrl: URL
  let tags: [String]
}

struct VirtualCoupon: Codable, Identifiable, Hashable {
  let id: String
  let title: String
  let threshold: Double
  let discount: Double
  let copy: String
}

struct VirtualAddress: Codable, Identifiable, Hashable {
  let id: String
  let label: String
  let detail: String
}

enum OrderStatus: String, Codable, CaseIterable, Hashable {
  case placed
  case preparing
  case riderAssigned
  case nearby
  case almostThere
  case stillAlmostThere
  case reflectionReady
}

struct OrderStatusEvent: Codable, Identifiable, Hashable {
  let status: OrderStatus
  let unlockSecond: Int
  let title: String
  let detail: String

  var id: String { status.rawValue }
}

struct CartItem: Codable, Hashable {
  let restaurantId: String
  let menuItemId: String
  var quantity: Int
}

struct CartLine: Identifiable, Hashable {
  let restaurant: Restaurant
  let item: MenuItem
  let quantity: Int

  var id: String { "\(restaurant.id)-\(item.id)" }
  var lineTotal: Double { item.price * Double(quantity) }
}

struct CartTotals: Codable, Hashable {
  let subtotal: Double
  let deliveryFee: Double
  let discount: Double
  let total: Double
  let savedAmount: Double
  let coupon: VirtualCoupon?
}

struct SimulatedOrder: Codable, Identifiable, Hashable {
  let id: String
  let createdAt: Date
  let address: VirtualAddress
  let items: [CartItem]
  let totals: CartTotals
}

struct ReflectionSummary: Codable, Identifiable, Hashable {
  let id: String
  let createdAt: Date
  let orderId: String
  let savedAmount: Double
  let itemNames: [String]
  let dominantCategory: String
  let copy: String
}

