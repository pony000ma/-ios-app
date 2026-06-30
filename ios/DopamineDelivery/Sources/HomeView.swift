import SwiftUI

struct HomeView: View {
  @Environment(AppState.self) private var appState
  @State private var searchText = ""
  @State private var selectedCategory = "全部"

  private var categories: [String] {
    ["全部"] + Array(Set(appState.fixture.restaurants.map(\.category))).sorted()
  }

  private var restaurants: [Restaurant] {
    let term = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    return appState.fixture.restaurants.filter { restaurant in
      let categoryMatches = selectedCategory == "全部" || restaurant.category == selectedCategory
      let searchable = "\(restaurant.name) \(restaurant.category) \(restaurant.tags.joined(separator: " "))"
      return categoryMatches && (term.isEmpty || searchable.localizedCaseInsensitiveContains(term))
    }
  }

  var body: some View {
    ScrollView {
      LazyVStack(spacing: 16) {
        header
        categoryChips
        ForEach(restaurants) { restaurant in
          NavigationLink(value: restaurant.id) {
            RestaurantRow(restaurant: restaurant)
          }
          .buttonStyle(.plain)
        }
      }
      .padding()
    }
    .navigationTitle("多巴胺外卖")
    .searchable(text: $searchText, prompt: "搜炸鸡、奶茶、那个差点下单的东西")
  }

  private var header: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("Food Never Comes, but gentler")
        .font(.caption.weight(.bold))
        .foregroundStyle(.secondary)
      Text("浏览、挑选、加购、等待。真实支出仍为 0。")
        .font(.title2.weight(.bold))
      HStack(spacing: 8) {
        Image(systemName: "mappin.and.ellipse")
        Text(appState.selectedAddress.label)
        Spacer()
      }
      .font(.subheadline.weight(.semibold))
      .foregroundStyle(.brown)
      .padding(12)
      .background(.brown.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private var categoryChips: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        ForEach(categories, id: \.self) { category in
          Button(category) {
            selectedCategory = category
          }
          .buttonStyle(.borderedProminent)
          .tint(category == selectedCategory ? .green : .gray.opacity(0.24))
          .foregroundStyle(category == selectedCategory ? .white : .primary)
        }
      }
    }
  }
}

struct RestaurantRow: View {
  let restaurant: Restaurant

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      RemoteFoodImage(url: restaurant.imageUrl, height: 184)
      VStack(alignment: .leading, spacing: 10) {
        HStack(alignment: .firstTextBaseline) {
          Text(restaurant.name)
            .font(.headline)
          Spacer()
          Text("★ \(restaurant.rating, specifier: "%.1f")")
            .font(.subheadline.weight(.bold))
            .foregroundStyle(.green)
        }
        Text(restaurant.tags.joined(separator: " · "))
          .font(.subheadline)
          .foregroundStyle(.secondary)
        HStack(spacing: 12) {
          Label("\(restaurant.etaMinutes) 分钟", systemImage: "clock")
          Label("\(restaurant.distanceKm, specifier: "%.1f") km", systemImage: "mappin")
          Text("配送 \(money(restaurant.deliveryFee))")
        }
        .font(.caption.weight(.semibold))
        .foregroundStyle(.secondary)
      }
      .padding(14)
    }
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(.brown.opacity(0.16))
    )
  }
}

#Preview {
  NavigationStack {
    HomeView()
  }
  .environment(AppState(fixture: .preview))
}

