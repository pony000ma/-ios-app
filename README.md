# 多巴胺外卖

一个“真实外卖模拟 + 荒诞讽刺体验”的双端 MVP。它保留浏览、挑选、加购、下单和等待的期待感，但不接真实商家、不收钱、不采集真实地址，帮助用户在冲动消费前温柔降温。

## 结构

- `shared/fixtures/dopamine-menu.json`: iOS 和 Web 共用的餐厅、菜单、优惠券、虚拟地址与订单状态文案。
- `web/`: React + Vite + TypeScript 响应式 Web。
- `ios/`: SwiftUI iOS App 和 Xcode 工程。

## Web

```bash
cd web
npm install
npm run dev
npm run build
npm test
npm run test:e2e
```

## iOS

打开 `ios/DopamineDelivery.xcodeproj`，选择 `DopamineDelivery` scheme，在 iOS Simulator 运行。

命令行编译：

```bash
xcodebuild -project ios/DopamineDelivery.xcodeproj -scheme DopamineDelivery -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO
```

## App Store / TestFlight

iOS App 已按“完全本机外卖模拟”准备：不接真实商家、不接支付、不请求真实地址、不发起网络请求；图片、菜单、订单状态和模拟逻辑都在本机。上架准备说明见 `docs/app-store-prep.md`。
