import SwiftUI

struct CartView: View {
  @Environment(AppState.self) private var appState
  @State private var walletNotice = ""

  var body: some View {
    Group {
      if let summary = appState.latestReflection {
        ReflectionView(summary: summary)
      } else if let order = appState.activeOrder {
        TrackingView(order: order)
      } else {
        checkout
      }
    }
    .navigationTitle("购物车")
  }

  private var checkout: some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 16) {
        Text("这里没有付款，只有期待。")
          .font(.title2.weight(.bold))
        if appState.cartLines.isEmpty {
          EmptyCartView()
        } else {
          ForEach(appState.cartLines) { line in
            CartLineRow(line: line)
          }
        }

        addressSection
        walletSection
        totalsSection

        PrimaryActionButton(disabled: appState.cart.isEmpty) {
          switch appState.beginExpectation() {
          case .started:
            walletNotice = "已扣除 \(money(appState.activeOrder?.totals.total ?? 0)) 情绪储值，真实账户依然没有动静。"
          case .needsRegistration:
            walletNotice = "先去“我的”给自己取个能劝住钱包的名字。"
          case .needsRecharge(let required, let balance):
            walletNotice = "余额 \(money(balance)) 不够本次 \(money(required))，先充值再开始期待。"
          }
        } label: {
          Label(appState.profile.isRegistered && appState.profile.balance < appState.cartTotals.total ? "余额不足，先充值" : "开始期待", systemImage: "sparkles")
        }
      }
      .padding()
    }
  }

  private var addressSection: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("虚拟地址")
        .font(.headline)
      Text("只使用地址昵称，不采集真实地址，也不会请求付款。")
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
      ForEach(appState.fixture.addresses) { address in
        Button {
          appState.selectAddress(address)
        } label: {
          HStack(alignment: .top, spacing: 10) {
            Image(systemName: address.id == appState.selectedAddressId ? "checkmark.circle.fill" : "circle")
              .foregroundStyle(address.id == appState.selectedAddressId ? .green : .secondary)
            VStack(alignment: .leading, spacing: 4) {
              Text(address.label)
                .font(.headline)
              Text(address.detail)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
          }
          .padding(12)
          .background(.brown.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
      }
    }
  }

  private var totalsSection: some View {
    VStack(spacing: 10) {
      if let coupon = appState.cartTotals.coupon {
        HStack(alignment: .top, spacing: 10) {
          Image(systemName: "ticket.fill")
            .foregroundStyle(.orange)
          VStack(alignment: .leading, spacing: 3) {
            Text(coupon.title)
              .font(.headline)
            Text(coupon.copy)
              .font(.caption)
              .foregroundStyle(.secondary)
          }
          Spacer()
        }
        .padding(12)
        .background(.yellow.opacity(0.18), in: RoundedRectangle(cornerRadius: 8))
      }
      totalRow("商品小计", appState.cartTotals.subtotal)
      totalRow("虚拟配送", appState.cartTotals.deliveryFee)
      totalRow("冲动折扣", -appState.cartTotals.discount)
      Divider()
      totalRow("如果真点了", appState.cartTotals.total, prominent: true)
    }
    .padding(14)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }

  private var walletSection: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .top, spacing: 10) {
        Image(systemName: "wallet.pass.fill")
          .foregroundStyle(appState.profile.iconColor.color)
        VStack(alignment: .leading, spacing: 4) {
          Text(appState.profile.isRegistered ? "\(appState.profile.username) 的情绪储值" : "还没有注册情绪钱包")
            .font(.headline)
          Text(appState.profile.isRegistered ? "当前余额 \(money(appState.profile.balance))，本次将扣除 \(money(appState.cartTotals.total))。" : "去“我的”注册后选择预存金额，再回来开始期待。")
            .font(.subheadline)
            .foregroundStyle(.secondary)
          if !walletNotice.isEmpty {
            Text(walletNotice)
              .font(.caption.weight(.bold))
              .foregroundStyle(.red)
          }
        }
        Spacer()
      }

      if appState.profile.isRegistered && appState.profile.balance < appState.cartTotals.total {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), spacing: 8)], spacing: 8) {
          ForEach(appState.rechargeAmounts, id: \.self) { amount in
            Button("+\(money(amount))") {
              appState.recharge(amount: amount)
              walletNotice = "已补充 \(money(amount)) 情绪储值。"
            }
            .buttonStyle(.bordered)
            .tint(appState.profile.iconColor.color)
          }
        }
      }
    }
    .padding(14)
    .background(appState.profile.iconColor.softColor, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(appState.profile.iconColor.color.opacity(0.22)))
  }

  private func totalRow(_ title: String, _ value: Double, prominent: Bool = false) -> some View {
    HStack {
      Text(title)
        .foregroundStyle(.secondary)
      Spacer()
      Text(money(value))
        .font(prominent ? .title3.weight(.black) : .headline)
    }
  }
}

private struct EmptyCartView: View {
  var body: some View {
    ContentUnavailableView {
      Label("今晚还没有差点拥有", systemImage: "fork.knife")
    } description: {
      Text("去首页滑一滑，给大脑一点认真挑选的快乐。")
    }
    .frame(minHeight: 240)
  }
}

private struct CartLineRow: View {
  @Environment(AppState.self) private var appState
  let line: CartLine

  var body: some View {
    HStack(spacing: 12) {
      RemoteFoodImage(url: line.item.imageUrl, height: 84)
        .frame(width: 84)
        .clipShape(RoundedRectangle(cornerRadius: 8))
      VStack(alignment: .leading, spacing: 5) {
        Text(line.restaurant.name)
          .font(.caption.weight(.bold))
          .foregroundStyle(.secondary)
        Text(line.item.name)
          .font(.headline)
        Text(money(line.lineTotal))
          .font(.subheadline.weight(.bold))
      }
      Spacer()
      HStack(spacing: 8) {
        Button {
          appState.decrementCart(line)
        } label: {
          Image(systemName: "minus")
        }
        Text("\(line.quantity)")
          .font(.headline)
          .frame(minWidth: 24)
        Button {
          appState.addToCart(restaurant: line.restaurant, item: line.item)
        } label: {
          Image(systemName: "plus")
        }
      }
      .buttonStyle(.bordered)

      Button(role: .destructive) {
        appState.removeCart(line)
      } label: {
        Image(systemName: "trash")
      }
      .buttonStyle(.borderless)
    }
    .padding(10)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }
}

#Preview {
  CartView()
    .environment(AppState(fixture: .preview))
}
