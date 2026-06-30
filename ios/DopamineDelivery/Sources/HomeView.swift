import SwiftUI

struct HomeView: View {
  @Environment(AppState.self) private var appState
  @State private var searchText = ""
  @State private var selectedCategory = "全部"
  private let categoryColumns = Array(repeating: GridItem(.flexible(minimum: 64), spacing: 8), count: 4)

  private var categories: [String] {
    let preferredOrder = ["咖啡", "奶茶", "甜品", "蛋糕", "果汁", "酸奶", "炸鸡", "炸串", "烧烤", "汉堡", "披萨", "麻辣烫", "粉面", "寿司"]
    let availableCategories = Set(appState.fixture.restaurants.map(\.category))
    let ordered = preferredOrder.filter { availableCategories.contains($0) }
    let remaining = availableCategories.subtracting(ordered).sorted()
    return ["全部"] + ordered + remaining
  }

  private var selectedCategoryTitle: String {
    selectedCategory == "全部" ? "全部店家" : selectedCategory
  }

  private var categoryGridHeight: CGFloat {
    let rows = max(1, Int(ceil(Double(categories.count) / 4.0)))
    return CGFloat(rows * 42 + (rows - 1) * 8 + 4)
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
        HStack {
          Text("\(selectedCategoryTitle) · \(restaurants.count) 家可选")
            .font(.subheadline.weight(.bold))
            .foregroundStyle(.secondary)
          Spacer()
        }
        .id("summary-\(selectedCategory)-\(restaurants.count)")
        if restaurants.isEmpty {
          ContentUnavailableView {
            Label("没有匹配的店家", systemImage: "magnifyingglass")
          } description: {
            Text("换个品类或清空搜索词试试。")
          }
          .frame(minHeight: 220)
        } else {
          ForEach(restaurants, id: \.id) { restaurant in
            NavigationLink(value: restaurant.id) {
              RestaurantRow(restaurant: restaurant)
            }
            .buttonStyle(.plain)
          }
        }
      }
      .id("restaurant-list-\(selectedCategory)-\(searchText)")
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
    LazyVGrid(columns: categoryColumns, alignment: .leading, spacing: 8) {
      ForEach(categories, id: \.self) { category in
        let isSelected = category == selectedCategory
        Button {
          selectCategory(category)
        } label: {
          CategoryChip(
            title: category,
            isSelected: isSelected,
            selectedColor: appState.profile.iconColor.color,
            textColor: appState.profile.fontColor.color
          )
          .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("category-\(category)")
        .simultaneousGesture(
          TapGesture().onEnded {
            selectCategory(category)
          }
        )
      }
    }
    .padding(.vertical, 2)
    .frame(minHeight: categoryGridHeight)
    .zIndex(2)
  }

  private func selectCategory(_ category: String) {
    guard selectedCategory != category || !searchText.isEmpty else { return }
    withAnimation(.easeInOut(duration: 0.2)) {
      selectedCategory = category
      searchText = ""
    }
  }
}

private struct CategoryChip: View {
  let title: String
  let isSelected: Bool
  let selectedColor: Color
  let textColor: Color

  var body: some View {
    Text(title)
      .font(.subheadline.weight(.bold))
      .lineLimit(1)
      .minimumScaleFactor(0.78)
      .padding(.horizontal, 16)
      .frame(height: 42)
      .foregroundStyle(isSelected ? .white : textColor)
      .background(isSelected ? selectedColor : Color.gray.opacity(0.16), in: Capsule())
  }
}

struct RestaurantRow: View {
  let restaurant: Restaurant

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      LocalFoodImage(imageName: restaurant.imageName, height: 184)
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
