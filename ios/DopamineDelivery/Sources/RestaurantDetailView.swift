import SwiftUI

struct RestaurantDetailView: View {
  @Environment(AppState.self) private var appState
  let restaurant: Restaurant

  var body: some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 18) {
        LocalFoodImage(imageName: restaurant.imageName, height: 260)
          .clipShape(RoundedRectangle(cornerRadius: 8))
        VStack(alignment: .leading, spacing: 8) {
          Text(restaurant.category)
            .font(.caption.weight(.bold))
            .foregroundStyle(.secondary)
          Text(restaurant.name)
            .font(.largeTitle.weight(.black))
          Text(restaurant.tags.joined(separator: " · "))
            .foregroundStyle(.secondary)
          HStack(spacing: 12) {
            Label("★ \(restaurant.rating, specifier: "%.1f")", systemImage: "star.fill")
            Text("起送 \(money(restaurant.minimumOrder))")
            Text("预计 \(restaurant.etaMinutes) 分钟快到")
          }
          .font(.caption.weight(.semibold))
          .foregroundStyle(.green)
        }

        ForEach(restaurant.menuSections) { section in
          VStack(alignment: .leading, spacing: 12) {
            Text(section.title)
              .font(.title3.weight(.bold))
            ForEach(section.items) { item in
              MenuItemRow(restaurant: restaurant, item: item)
            }
          }
        }
      }
      .padding()
    }
    .navigationTitle(restaurant.name)
    .navigationBarTitleDisplayMode(.inline)
  }
}

private struct MenuItemRow: View {
  @Environment(AppState.self) private var appState
  let restaurant: Restaurant
  let item: MenuItem

  private var quantity: Int {
    appState.cart.first(where: { $0.restaurantId == restaurant.id && $0.menuItemId == item.id })?.quantity ?? 0
  }

  var body: some View {
    HStack(alignment: .top, spacing: 12) {
      LocalFoodImage(imageName: item.imageName, height: 104)
        .frame(width: 112)
        .clipShape(RoundedRectangle(cornerRadius: 8))
      VStack(alignment: .leading, spacing: 8) {
        HStack(alignment: .top) {
          Text(item.name)
            .font(.headline)
          Spacer()
          Text("\(item.heat)°")
            .font(.subheadline.weight(.black))
            .foregroundStyle(.green)
        }
        Text(item.description)
          .font(.subheadline)
          .foregroundStyle(.secondary)
        HStack {
          ForEach(item.tags, id: \.self) { tag in
            Pill(text: tag)
          }
        }
        HStack {
          Text(money(item.price))
            .font(.headline)
          Spacer()
          Button {
            appState.addToCart(restaurant: restaurant, item: item)
          } label: {
            Label(quantity > 0 ? "\(quantity)" : "加入", systemImage: "plus")
          }
          .buttonStyle(.borderedProminent)
          .tint(.red)
        }
      }
    }
    .padding(10)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }
}

#Preview {
  NavigationStack {
    RestaurantDetailView(restaurant: FixtureData.preview.restaurants[0])
  }
  .environment(AppState(fixture: .preview))
}
