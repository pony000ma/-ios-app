import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
  case home
  case cart
  case history
  case profile

  var id: String { rawValue }

  var title: String {
    switch self {
    case .home: "首页"
    case .cart: "购物车"
    case .history: "记录"
    case .profile: "我的"
    }
  }

  var systemImage: String {
    switch self {
    case .home: "house.fill"
    case .cart: "bag.fill"
    case .history: "clock.arrow.circlepath"
    case .profile: "person.crop.circle.fill"
    }
  }
}

struct AppView: View {
  @State private var appState = AppState()

  var body: some View {
    ZStack {
      appState.profile.backgroundColor.softColor
        .ignoresSafeArea()
      TabView {
        NavigationStack {
          HomeView()
            .navigationDestination(for: String.self) { restaurantId in
              if let restaurant = appState.fixture.restaurants.first(where: { $0.id == restaurantId }) {
                RestaurantDetailView(restaurant: restaurant)
              }
            }
        }
        .tabItem { Label(AppTab.home.title, systemImage: AppTab.home.systemImage) }

        NavigationStack {
          CartView()
        }
        .tabItem { Label(AppTab.cart.title, systemImage: AppTab.cart.systemImage) }
        .badge(appState.cart.reduce(0) { $0 + $1.quantity })

        NavigationStack {
          HistoryView()
        }
        .tabItem { Label(AppTab.history.title, systemImage: AppTab.history.systemImage) }

        NavigationStack {
          ProfileView()
        }
        .tabItem { Label(AppTab.profile.title, systemImage: AppTab.profile.systemImage) }
      }
    }
    .environment(appState)
    .tint(appState.profile.iconColor.color)
    .foregroundStyle(appState.profile.fontColor.color)
  }
}

#Preview {
  AppView()
}
