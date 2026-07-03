# 多巴胺外卖 App Store / TestFlight 准备清单

## 产品定位

多巴胺外卖不是外卖服务，也不连接真实商家、骑手、地图或支付。它是一个完全本机运行的外卖流程模拟器，通过浏览、加购、虚拟下单和等待复盘，帮助用户在冲动消费前获得情绪缓冲。

建议 App Store 副标题：

> 本机外卖模拟与情绪钱包

建议一句话介绍：

> 浏览想吃的，开始期待，然后在真实花钱前温柔刹车。

## 本机运行声明

- 餐厅、菜单、菜品图片、优惠券、虚拟地址和订单状态都随 App 打包在本机。
- 不请求定位、相机、通讯录、麦克风、照片、蓝牙、日历、提醒事项或追踪权限。
- 不发起网络请求，不接后端 API，不上传用户内容。
- 不接真实支付，不连接真实商家，不提供真实配送。
- 用户名、主题、购物车、虚拟余额和历史复盘只保存在本机 `UserDefaults`。

## App Store Connect 隐私问卷建议

数据收集：

> Data Not Collected

说明口径：

> The app runs entirely on device. It does not collect, transmit, sell, share, or track user data. Virtual usernames, wallet balances, cart state, and reflection history are stored locally on the user's device only.

跟踪：

> No, we do not track users.

广告标识符：

> No.

第三方 SDK：

> None.

## 隐私 Manifest

iOS target 已包含 `PrivacyInfo.xcprivacy`：

- `NSPrivacyCollectedDataTypes`: 空数组
- `NSPrivacyTracking`: false
- `NSPrivacyTrackingDomains`: 空数组
- `NSPrivacyAccessedAPITypes`: `NSPrivacyAccessedAPICategoryUserDefaults`
- Required reason: `CA92.1`

`CA92.1` 用于说明 App 只访问自身的本机 `UserDefaults`，保存用户在 App 内的设置和模拟状态。

## TestFlight 测试信息

建议 Beta App Review Notes：

> This is an on-device food-delivery simulation app for impulse-spending reduction. It does not provide real food delivery, payment, merchant, rider, map, or address services. All restaurants, menu items, images, order states, wallet balances, and reflection history are local mock data bundled with the app or stored only on device. No network requests are made and no user data is collected or transmitted.

建议测试账号：

> No login required.

建议测试步骤：

1. Open the app and browse restaurants.
2. Add menu items to the cart.
3. Go to the profile tab and create a local username with a virtual wallet balance.
4. Start a virtual order from the cart.
5. Wait until the reflection action appears, then finish the expectation.
6. Review the local savings/reflection history.

## App Review 风险点与处理

真实外卖误解：

> 所有提审文案都要强调“模拟”“虚拟”“本机”，避免让审核员以为 App 提供真实外卖、真实支付或真实配送。

金融/充值误解：

> App 内“充值”和“余额”必须解释为虚拟情绪预算，不涉及真实货币，不销售数字内容，不需要 In-App Purchase。

健康/医疗误解：

> 避免宣称治疗成瘾、焦虑或饮食障碍。使用“帮助冲动消费前降温”“情绪缓冲工具”等低风险表述。

地址/地图误解：

> 虚拟地址只保留昵称，不要求真实地址；追踪动画不是地图服务。

## 构建设置

当前 iOS target 默认设置：

- Bundle ID: `com.hongchaoma.DopamineDelivery`
- Display Name: `多巴胺外卖`
- Version: `1.0`
- Build: `1`
- Target device family: iPhone
- Suggested primary category: Lifestyle
- Deployment target: iOS 17.0
- Signing: Automatic
- Development Team: `8MLV26CCG2`

归档命令示例：

```bash
xcodebuild \
  -project ios/DopamineDelivery.xcodeproj \
  -scheme DopamineDelivery \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/DopamineDelivery.xcarchive \
  archive
```

上传建议优先用 Xcode Organizer 的 `Distribute App`，选择 `App Store Connect`。
