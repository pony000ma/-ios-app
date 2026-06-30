import SwiftUI

extension DopamineColorChoice {
  var color: Color {
    switch self {
    case .pink: Color(red: 1.0, green: 0.31, blue: 0.64)
    case .green: Color(red: 0.21, green: 0.82, blue: 0.44)
    case .purple: Color(red: 0.61, green: 0.36, blue: 1.0)
    case .orange: Color(red: 1.0, green: 0.54, blue: 0.16)
    case .blue: Color(red: 0.18, green: 0.55, blue: 1.0)
    case .yellow: Color(red: 1.0, green: 0.83, blue: 0.23)
    }
  }

  var softColor: Color {
    switch self {
    case .pink: Color(red: 1.0, green: 0.94, blue: 0.97)
    case .green: Color(red: 0.93, green: 1.0, blue: 0.95)
    case .purple: Color(red: 0.96, green: 0.94, blue: 1.0)
    case .orange: Color(red: 1.0, green: 0.95, blue: 0.90)
    case .blue: Color(red: 0.93, green: 0.96, blue: 1.0)
    case .yellow: Color(red: 1.0, green: 0.98, blue: 0.86)
    }
  }
}

struct LocalFoodImage: View {
  let imageName: String
  var height: CGFloat

  var body: some View {
    Image(imageName)
      .resizable()
      .scaledToFill()
      .frame(height: height)
      .clipped()
      .accessibilityHidden(true)
  }
}

struct Pill: View {
  let text: String

  var body: some View {
    Text(text)
      .font(.caption.weight(.semibold))
      .padding(.horizontal, 9)
      .padding(.vertical, 5)
      .foregroundStyle(.green)
      .background(.green.opacity(0.12), in: Capsule())
  }
}

struct PrimaryActionButton<Label: View>: View {
  @Environment(AppState.self) private var appState
  var disabled = false
  let action: () -> Void
  @ViewBuilder let label: Label

  var body: some View {
    Button(action: action) {
      label
        .font(.headline)
        .frame(maxWidth: .infinity, minHeight: 52)
    }
    .buttonStyle(.borderedProminent)
    .tint(appState.profile.iconColor.color)
    .disabled(disabled)
  }
}
