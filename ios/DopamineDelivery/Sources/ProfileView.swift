import SwiftUI

struct ProfileView: View {
  @Environment(AppState.self) private var appState
  @State private var draftName = ""
  @State private var selectedSystemName = "钱包守夜人"
  @State private var selectedAmount: Double = 128
  @State private var notice = ""

  var body: some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 16) {
        hero
        if !notice.isEmpty {
          Label(notice, systemImage: "sparkles")
            .font(.subheadline.weight(.bold))
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(appState.profile.iconColor.softColor, in: RoundedRectangle(cornerRadius: 8))
        }
        registrationCard
        rechargeCard
        themeCard
      }
      .padding()
    }
    .navigationTitle("我的")
    .onAppear {
      if selectedSystemName.isEmpty {
        selectedSystemName = appState.suggestedUsernames[0]
      }
      if draftName.isEmpty {
        draftName = appState.profile.username
      }
    }
  }

  private var hero: some View {
    HStack(alignment: .center, spacing: 16) {
      VStack(alignment: .leading, spacing: 8) {
        Text("我的情绪钱包")
          .font(.caption.weight(.bold))
          .foregroundStyle(.secondary)
        Text(appState.profile.isRegistered ? appState.profile.username : "先注册一个会劝你的名字")
          .font(.title2.weight(.black))
        Text(appState.profile.isRegistered ? "每次开始期待都会从这里扣除虚拟储值，余额不足时先充值。" : "自定义用户名，或者拿一个系统准备好的劝慰讽刺名。")
          .font(.subheadline)
          .foregroundStyle(.secondary)
      }
      Spacer()
      VStack(spacing: 6) {
        Image(systemName: "wallet.pass.fill")
          .font(.title2)
        Text("余额")
          .font(.caption.weight(.bold))
        Text(money(appState.profile.balance))
          .font(.title2.weight(.black))
      }
      .foregroundStyle(.white)
      .frame(width: 116, height: 116)
      .background(appState.profile.iconColor.color, in: RoundedRectangle(cornerRadius: 8))
    }
    .padding(16)
    .background(appState.profile.backgroundColor.softColor, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(appState.profile.iconColor.color.opacity(0.18)))
  }

  private var registrationCard: some View {
    VStack(alignment: .leading, spacing: 12) {
      Label(appState.profile.isRegistered ? "用户信息" : "注册入口", systemImage: "person.crop.circle.fill")
        .font(.headline)
      Text("名字可以认真，也可以让系统替钱包阴阳怪气一下。")
        .font(.subheadline)
        .foregroundStyle(.secondary)
      TextField("例如：今晚不点也很完整", text: $draftName)
        .textFieldStyle(.roundedBorder)

      LazyVGrid(columns: [GridItem(.adaptive(minimum: 128), spacing: 8)], spacing: 8) {
        ForEach(appState.suggestedUsernames, id: \.self) { name in
          Button(name) {
            selectedSystemName = name
            draftName = ""
          }
          .buttonStyle(.borderedProminent)
          .tint(selectedSystemName == name && draftName.isEmpty ? appState.profile.iconColor.color : .gray.opacity(0.24))
          .foregroundStyle(selectedSystemName == name && draftName.isEmpty ? .white : appState.profile.fontColor.color)
        }
      }

      if appState.profile.isRegistered {
        VStack(alignment: .leading, spacing: 4) {
          Text(appState.profile.username)
            .font(.title3.weight(.black))
          Text("这名字看起来很会把夜宵冲动拦在门外。")
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(appState.profile.iconColor.softColor, in: RoundedRectangle(cornerRadius: 8))
      } else {
        amountPicker
        PrimaryActionButton {
          let name = draftName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? selectedSystemName : draftName
          appState.registerUser(name: name, initialAmount: selectedAmount)
          notice = "欢迎 \(name)，已存入 \(money(selectedAmount)) 情绪预算。"
        } label: {
          Label("注册并存入 \(money(selectedAmount))", systemImage: "creditcard.fill")
        }
      }
    }
    .padding(16)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }

  private var amountPicker: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("选择预存储值")
        .font(.subheadline.weight(.bold))
        .foregroundStyle(.secondary)
      LazyVGrid(columns: [GridItem(.adaptive(minimum: 84), spacing: 8)], spacing: 8) {
        ForEach(appState.rechargeAmounts, id: \.self) { amount in
          Button(money(amount)) {
            selectedAmount = amount
          }
          .buttonStyle(.borderedProminent)
          .tint(selectedAmount == amount ? appState.profile.iconColor.color : .gray.opacity(0.24))
          .foregroundStyle(selectedAmount == amount ? .white : appState.profile.fontColor.color)
        }
      }
    }
  }

  private var rechargeCard: some View {
    VStack(alignment: .leading, spacing: 12) {
      Label("储值充值", systemImage: "plus.circle.fill")
        .font(.headline)
      Text("余额不足时，先给情绪预算充点彩色空气。")
        .font(.subheadline)
        .foregroundStyle(.secondary)
      LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) {
        ForEach(appState.rechargeAmounts, id: \.self) { amount in
          Button("+\(money(amount))") {
            appState.recharge(amount: amount)
            notice = "已充值 \(money(amount))，余额又被情绪价值抱了一下。"
          }
          .buttonStyle(.bordered)
          .tint(appState.profile.iconColor.color)
          .disabled(!appState.profile.isRegistered)
        }
      }
    }
    .padding(16)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }

  private var themeCard: some View {
    VStack(alignment: .leading, spacing: 14) {
      Label("多巴胺配色", systemImage: "paintpalette.fill")
        .font(.headline)
      Text("背景色、图标色、字体颜色都可以单独选择，情绪价值拉满。")
        .font(.subheadline)
        .foregroundStyle(.secondary)
      ThemeChoiceRow(title: "背景色", selected: appState.profile.backgroundColor, part: .background)
      ThemeChoiceRow(title: "图标色", selected: appState.profile.iconColor, part: .icon)
      ThemeChoiceRow(title: "字体颜色", selected: appState.profile.fontColor, part: .font)
    }
    .padding(16)
    .background(.background, in: RoundedRectangle(cornerRadius: 8))
    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.brown.opacity(0.14)))
  }
}

private struct ThemeChoiceRow: View {
  @Environment(AppState.self) private var appState
  let title: String
  let selected: DopamineColorChoice
  let part: ProfileThemePart

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.subheadline.weight(.bold))
        .foregroundStyle(.secondary)
      LazyVGrid(columns: [GridItem(.adaptive(minimum: 118), spacing: 8)], spacing: 8) {
        ForEach(DopamineColorChoice.allCases) { choice in
          Button {
            appState.setTheme(part, to: choice)
          } label: {
            HStack {
              Circle()
                .fill(choice.color)
                .frame(width: 18, height: 18)
              Text(choice.title)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            }
            .frame(maxWidth: .infinity, minHeight: 38)
          }
          .buttonStyle(.borderedProminent)
          .tint(selected == choice ? choice.color : .gray.opacity(0.22))
          .foregroundStyle(selected == choice ? .white : appState.profile.fontColor.color)
        }
      }
    }
  }
}

#Preview {
  NavigationStack {
    ProfileView()
  }
  .environment(AppState(fixture: .preview))
}
