import SwiftUI

extension DopamineColorChoice {
  var color: Color {
    switch self {
    case .pink: Color(red: 1.0, green: 0.31, blue: 0.64)
    case .green: Color(red: 0.21, green: 0.82, blue: 0.44)
    case .purple: Color(red: 0.61, green: 0.36, blue: 1.0)
    case .orange: Color(red: 1.0, green: 0.54, blue: 0.16)
    }
  }

  var softColor: Color {
    switch self {
    case .pink: Color(red: 1.0, green: 0.94, blue: 0.97)
    case .green: Color(red: 0.93, green: 1.0, blue: 0.95)
    case .purple: Color(red: 0.96, green: 0.94, blue: 1.0)
    case .orange: Color(red: 1.0, green: 0.95, blue: 0.90)
    }
  }
}

struct RemoteFoodImage: View {
  let url: URL
  var height: CGFloat

  var body: some View {
    AsyncImage(url: url) { phase in
      switch phase {
      case .success(let image):
        image
          .resizable()
          .scaledToFill()
      case .failure:
        placeholder
      case .empty:
        placeholder
          .redacted(reason: .placeholder)
      @unknown default:
        placeholder
      }
    }
    .frame(height: height)
    .clipped()
    .accessibilityHidden(true)
  }

  private var placeholder: some View {
    Rectangle()
      .fill(Color.orange.opacity(0.18))
      .overlay {
        Image(systemName: "fork.knife")
          .font(.title2)
          .foregroundStyle(.orange)
      }
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
