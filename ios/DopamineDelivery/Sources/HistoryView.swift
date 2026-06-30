import SwiftUI

struct ReflectionView: View {
  @Environment(AppState.self) private var appState
  let summary: ReflectionSummary

  var body: some View {
    ScrollView {
      VStack(spacing: 18) {
        Image(systemName: "sparkles")
          .font(.system(size: 42, weight: .bold))
          .foregroundStyle(.orange)
        Text("情绪复盘")
          .font(.caption.weight(.bold))
          .foregroundStyle(.secondary)
        Text("你已经拥有了最快乐的那一部分")
          .font(.largeTitle.weight(.black))
          .multilineTextAlignment(.center)
        Text(summary.copy)
          .foregroundStyle(.secondary)
          .multilineTextAlignment(.center)
        Text(money(summary.savedAmount))
          .font(.system(size: 72, weight: .black))
          .foregroundStyle(.red)
          .minimumScaleFactor(0.6)
        Text("今晚差点拥有：\(summary.itemNames.joined(separator: "、"))")
          .font(.subheadline.weight(.semibold))
          .multilineTextAlignment(.center)
          .foregroundStyle(.secondary)

        PrimaryActionButton {
          appState.clearLatestReflection()
        } label: {
          Label("今晚先放过钱包", systemImage: "receipt")
        }

        Button {
          appState.clearLatestReflection()
        } label: {
          Label("再模拟一单", systemImage: "magnifyingglass")
            .frame(maxWidth: .infinity, minHeight: 48)
        }
        .buttonStyle(.bordered)
      }
      .padding()
      .frame(maxWidth: .infinity)
    }
    .navigationTitle("复盘")
  }
}

struct HistoryView: View {
  @Environment(AppState.self) private var appState

  var body: some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 16) {
        stats
        Text("我差点吃了什么")
          .font(.title2.weight(.bold))
        if appState.history.isEmpty {
          ContentUnavailableView {
            Label("还没有复盘记录", systemImage: "clock.arrow.circlepath")
          } description: {
            Text("完成一次虚拟等待后，这里会记录你今晚省下的现实成本。")
          }
          .frame(minHeight: 240)
        } else {
          ForEach(appState.history) { item in
            HistoryRow(item: item)
          }
        }
      }
      .padding()
    }
    .navigationTitle("记录")
  }

  private var stats: some View {
    Grid(horizontalSpacing: 10, verticalSpacing: 10) {
      GridRow {
        StatCard(title: "累计避免支出", value: money(appState.totalSaved), systemImage: "chart.bar.fill")
        StatCard(title: "期待结束次数", value: "\(appState.history.count)", systemImage: "heart.fill")
      }
      GridRow {
        StatCard(title: "最常幻想品类", value: appState.topCategory, systemImage: "fork.knife")
        StatCard(title: "真实付款次数", value: "0", systemImage: "creditcard.trianglebadge.exclamationmark")
      }
    }
  }
}

private struct StatCard: View {
  let title: String
  let value: String
  let systemImage: String

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Image(systemName: systemImage)
        .foregroundStyle(.green)
      Text(title)
        .font(.caption)
        .foregroundStyle(.secondary)
      Text(value)
        .font(.title3.weight(.black))
        .lineLimit(1)
        .minimumScaleFactor(0.72)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(14)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }
}

private struct HistoryRow: View {
  let item: ReflectionSummary

  var body: some View {
    HStack(alignment: .top, spacing: 12) {
      VStack(alignment: .leading, spacing: 6) {
        Text(item.createdAt, format: .dateTime.month(.abbreviated).day().hour().minute())
          .font(.caption.weight(.bold))
          .foregroundStyle(.secondary)
        Text(item.itemNames.joined(separator: "、"))
          .font(.headline)
        Text(item.copy)
          .font(.caption)
          .foregroundStyle(.secondary)
      }
      Spacer()
      Text(money(item.savedAmount))
        .font(.title3.weight(.black))
        .foregroundStyle(.red)
    }
    .padding(14)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }
}

#Preview {
  HistoryView()
    .environment(AppState(fixture: .preview))
}
