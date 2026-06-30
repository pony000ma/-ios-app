import SwiftUI

struct TrackingView: View {
  @Environment(AppState.self) private var appState
  let order: SimulatedOrder

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { context in
      let elapsed = max(0, Int(context.date.timeIntervalSince(order.createdAt)))
      let status = appState.status(forElapsed: elapsed)
      let progress = appState.progress(forElapsed: elapsed)
      let canReflect = elapsed >= appState.reflectionUnlockSeconds

      ScrollView {
        LazyVStack(alignment: .leading, spacing: 16) {
          MockMapView(progress: progress)
          VStack(alignment: .leading, spacing: 10) {
            Text("订单永远不会完成")
              .font(.caption.weight(.bold))
              .foregroundStyle(.secondary)
            Text(status.title)
              .font(.title2.weight(.black))
            Text(status.detail)
              .foregroundStyle(.secondary)
            Label("已期待 \(elapsed) 秒，真实支出仍为 ¥0", systemImage: "clock")
              .font(.subheadline.weight(.semibold))
              .padding(10)
              .frame(maxWidth: .infinity, alignment: .leading)
              .background(.yellow.opacity(0.2), in: RoundedRectangle(cornerRadius: 8))
          }

          VStack(spacing: 12) {
            ForEach(appState.fixture.statusEvents) { event in
              HStack(alignment: .top, spacing: 10) {
                Image(systemName: elapsed >= min(event.unlockSecond, appState.reflectionUnlockSeconds) ? "checkmark.circle.fill" : "circle")
                  .foregroundStyle(elapsed >= min(event.unlockSecond, appState.reflectionUnlockSeconds) ? .green : .secondary)
                VStack(alignment: .leading, spacing: 3) {
                  Text(event.title)
                    .font(.headline)
                  Text(event.detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                Spacer()
              }
            }
          }
          .padding(14)
          .background(.background, in: RoundedRectangle(cornerRadius: 8))
          .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))

          PrimaryActionButton(disabled: !canReflect) {
            appState.finishExpectation()
          } label: {
            Label("我已经不想吃了", systemImage: "heart.fill")
          }
        }
        .padding()
      }
      .navigationTitle("永远快到了")
    }
  }
}

private struct MockMapView: View {
  let progress: Double

  var body: some View {
    GeometryReader { proxy in
      let width = proxy.size.width
      let height = proxy.size.height
      ZStack(alignment: .topLeading) {
        GridBackground()
        Rectangle()
          .fill(.brown.opacity(0.18))
          .frame(height: 46)
          .position(x: width / 2, y: height * 0.64)
        Rectangle()
          .fill(.brown.opacity(0.18))
          .frame(width: 52)
          .position(x: width * 0.72, y: height / 2)
        Label("你", systemImage: "house.fill")
          .font(.caption.weight(.bold))
          .padding(9)
          .background(.background, in: RoundedRectangle(cornerRadius: 8))
          .position(x: width * 0.84, y: height * 0.22)
        Label("骑手", systemImage: "bicycle")
          .font(.caption.weight(.bold))
          .foregroundStyle(.white)
          .padding(9)
          .background(.red, in: RoundedRectangle(cornerRadius: 8))
          .position(
            x: width * (0.14 + progress * 0.68),
            y: height * (0.72 - progress * 0.48)
          )
          .animation(.easeInOut(duration: 0.7), value: progress)
      }
    }
    .frame(height: 320)
    .clipShape(RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.green.opacity(0.18)))
  }
}

private struct GridBackground: View {
  var body: some View {
    Canvas { context, size in
      let spacing: CGFloat = 44
      var path = Path()
      stride(from: CGFloat.zero, through: size.width, by: spacing).forEach { x in
        path.move(to: CGPoint(x: x, y: 0))
        path.addLine(to: CGPoint(x: x, y: size.height))
      }
      stride(from: CGFloat.zero, through: size.height, by: spacing).forEach { y in
        path.move(to: CGPoint(x: 0, y: y))
        path.addLine(to: CGPoint(x: size.width, y: y))
      }
      context.stroke(path, with: .color(.green.opacity(0.09)), lineWidth: 1)
    }
    .background(Color.green.opacity(0.06))
  }
}

#Preview {
  TrackingView(order: SimulatedOrder(
    id: "preview",
    createdAt: Date().addingTimeInterval(-92),
    address: FixtureData.preview.addresses[0],
    items: [CartItem(restaurantId: "preview-crispy", menuItemId: "golden-chicken", quantity: 1)],
    totals: CartTotals(subtotal: 42, deliveryFee: 3, discount: 8, total: 37, savedAmount: 37, coupon: FixtureData.preview.coupons[0])
  ))
  .environment(AppState(fixture: .preview))
}

