import SwiftUI

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
    .tint(.green)
    .disabled(disabled)
  }
}

