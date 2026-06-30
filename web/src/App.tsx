import {
  BadgePercent,
  BarChart3,
  Bike,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Heart,
  History,
  Home,
  MapPin,
  Minus,
  Palette,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  UserRound,
  WalletCards,
  WandSparkles,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  addToCart,
  calculateCartTotals,
  chargeProfile,
  createReflection,
  createSimulatedOrder,
  data,
  defaultUserProfile,
  decrementCart,
  dopaminePalettes,
  paletteFor,
  rechargeAmounts,
  rechargeProfile,
  registerProfile,
  removeFromCart,
  resolveCartLines,
  statusForElapsed,
  statusProgress,
  suggestedUsernames,
  summarizeHistory,
} from './domain';
import type { CartItem, DopamineColorId, ReflectionSummary, Restaurant, SimulatedOrder, UserProfile, VirtualAddress } from './types';

type Page = 'home' | 'cart' | 'tracking' | 'reflection' | 'history' | 'profile';

const cartKey = 'dopamine.delivery.cart';
const addressKey = 'dopamine.delivery.address';
const historyKey = 'dopamine.delivery.history';
const profileKey = 'dopamine.delivery.profile';
const readySeconds = new URLSearchParams(window.location.search).has('fast') ? 3 : 90;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function money(value: number) {
  return `¥${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
}

function foodImageSrc(imageName: string) {
  return `/food-images/${imageName}.jpg`;
}

export function App() {
  const [page, setPage] = useState<Page>('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(cartKey, []));
  const [address, setAddress] = useState<VirtualAddress>(() => {
    const storedId = readStorage<string | null>(addressKey, null);
    return data.addresses.find((candidate) => candidate.id === storedId) ?? data.addresses[0];
  });
  const [activeOrder, setActiveOrder] = useState<SimulatedOrder | null>(null);
  const [reflection, setReflection] = useState<ReflectionSummary | null>(null);
  const [history, setHistory] = useState<ReflectionSummary[]>(() => readStorage(historyKey, []));
  const [profile, setProfile] = useState<UserProfile>(() => ({
    ...defaultUserProfile(),
    ...readStorage<Partial<UserProfile>>(profileKey, {}),
  }));
  const [walletNotice, setWalletNotice] = useState('');

  const categories = useMemo(() => ['全部', ...Array.from(new Set(data.restaurants.map((item) => item.category)))], []);
  const filteredRestaurants = useMemo(() => {
    const term = query.trim().toLowerCase();
    return data.restaurants.filter((restaurant) => {
      const matchesCategory = category === '全部' || restaurant.category === category;
      const haystack = `${restaurant.name} ${restaurant.category} ${restaurant.tags.join(' ')}`.toLowerCase();
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [category, query]);
  const lines = useMemo(() => resolveCartLines(cart), [cart]);
  const totals = useMemo(() => calculateCartTotals(cart), [cart]);
  const historySummary = useMemo(() => summarizeHistory(history), [history]);

  useEffect(() => window.localStorage.setItem(cartKey, JSON.stringify(cart)), [cart]);
  useEffect(() => window.localStorage.setItem(addressKey, JSON.stringify(address.id)), [address]);
  useEffect(() => window.localStorage.setItem(historyKey, JSON.stringify(history)), [history]);
  useEffect(() => window.localStorage.setItem(profileKey, JSON.stringify(profile)), [profile]);

  const backgroundPalette = paletteFor(profile.backgroundColor);
  const iconPalette = paletteFor(profile.iconColor);
  const fontPalette = paletteFor(profile.fontColor);
  const themeStyle = {
    '--app-bg': backgroundPalette.soft,
    '--accent': iconPalette.color,
    '--accent-soft': iconPalette.soft,
    '--text-color': fontPalette.contrast,
    '--theme-border': iconPalette.color,
  } as CSSProperties;

  function addItem(restaurantId: string, menuItemId: string) {
    setCart((current) => addToCart(current, restaurantId, menuItemId));
  }

  function beginExpectation() {
    if (!cart.length) return;
    if (!profile.isRegistered) {
      setWalletNotice('先给自己取个能劝住钱包的名字，再开始期待。');
      setPage('profile');
      return;
    }

    const charged = chargeProfile(profile, totals.total);
    if (!charged.ok) {
      setWalletNotice(`储值余额还差 ${money(Math.max(0, totals.total - profile.balance))}，先充值再让骑手进入想象。`);
      setPage('profile');
      return;
    }

    const order = createSimulatedOrder(cart, address);
    setProfile(charged.profile);
    setWalletNotice(`已从情绪储值扣除 ${money(totals.total)}，真实账户依然没有动静。`);
    setActiveOrder(order);
    setReflection(null);
    setPage('tracking');
  }

  function finishExpectation() {
    if (!activeOrder) return;
    const summary = createReflection(activeOrder);
    setReflection(summary);
    setHistory((current) => [summary, ...current].slice(0, 20));
    setCart([]);
    setActiveOrder(null);
    setPage('reflection');
  }

  function openRestaurant(restaurant: Restaurant) {
    setSelectedRestaurant(restaurant);
    setPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell" style={themeStyle}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Food Never Comes, but gentler</p>
          <h1>多巴胺外卖</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button wallet-pill" onClick={() => setPage('profile')} aria-label="打开我的钱包">
            <WalletCards size={18} />
            <span>{profile.isRegistered ? `${profile.username} · ${money(profile.balance)}` : '注册/储值'}</span>
          </button>
          <button className="ghost-button address-pill" onClick={() => setPage('cart')} aria-label="打开虚拟地址">
            <MapPin size={18} />
            <span>{address.label}</span>
          </button>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="主导航">
        <button className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}>
          <Home size={18} /> 首页
        </button>
        <button className={page === 'cart' ? 'active' : ''} onClick={() => setPage('cart')} data-testid="cart-tab">
          <ShoppingBag size={18} /> 购物车
          {cart.length > 0 ? <span className="count">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span> : null}
        </button>
        <button className={page === 'history' ? 'active' : ''} onClick={() => setPage('history')}>
          <History size={18} /> 记录
        </button>
        <button className={page === 'profile' ? 'active' : ''} onClick={() => setPage('profile')} data-testid="profile-tab">
          <Settings size={18} /> 我的
        </button>
      </nav>

      <main>
        {page === 'home' && (
          selectedRestaurant ? (
            <RestaurantDetail
              restaurant={selectedRestaurant}
              cart={cart}
              onBack={() => setSelectedRestaurant(null)}
              onAdd={addItem}
            />
          ) : (
            <HomeFeed
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              categories={categories}
              restaurants={filteredRestaurants}
              onOpen={openRestaurant}
            />
          )
        )}

        {page === 'cart' && (
          <CartPage
            lines={lines}
            totals={totals}
            cart={cart}
            profile={profile}
            walletNotice={walletNotice}
            address={address}
            setAddress={setAddress}
            onAdd={addItem}
            onMinus={(restaurantId, menuItemId) => setCart((current) => decrementCart(current, restaurantId, menuItemId))}
            onRemove={(restaurantId, menuItemId) => setCart((current) => removeFromCart(current, restaurantId, menuItemId))}
            onBegin={beginExpectation}
            onRecharge={(amount) => {
              setProfile((current) => rechargeProfile(current, amount));
              setWalletNotice(`已补充 ${money(amount)} 情绪储值，钱包收到了彩色安慰。`);
            }}
          />
        )}

        {page === 'tracking' && activeOrder && (
          <TrackingPage order={activeOrder} onFinish={finishExpectation} />
        )}

        {page === 'reflection' && reflection && (
          <ReflectionPage
            reflection={reflection}
            onHome={() => {
              setSelectedRestaurant(null);
              setPage('home');
            }}
            onAgain={() => {
              setSelectedRestaurant(null);
              setPage('home');
            }}
          />
        )}

        {page === 'history' && <HistoryPage history={history} summary={historySummary} />}

        {page === 'profile' && (
          <ProfilePage
            profile={profile}
            notice={walletNotice}
            setNotice={setWalletNotice}
            onRegister={(name, amount) => setProfile((current) => registerProfile(current, name, amount))}
            onRecharge={(amount) => setProfile((current) => rechargeProfile(current, amount))}
            onThemeChange={(part, color) => setProfile((current) => ({ ...current, [part]: color }))}
          />
        )}
      </main>

      {page === 'home' && cart.length > 0 && (
        <button className="floating-cart" onClick={() => setPage('cart')}>
          <ShoppingBag size={20} />
          <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} 件差点拥有</span>
          <strong>{money(totals.total)}</strong>
        </button>
      )}
    </div>
  );
}

interface HomeFeedProps {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  restaurants: Restaurant[];
  onOpen: (restaurant: Restaurant) => void;
}

function HomeFeed({ query, setQuery, category, setCategory, categories, restaurants, onOpen }: HomeFeedProps) {
  return (
    <section className="home-grid">
      <div className="search-panel">
        <label className="search-box">
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜炸鸡、奶茶、那个差点下单的东西" />
        </label>
        <div className="category-row">
          {categories.map((item) => (
            <button key={item} className={item === category ? 'active' : ''} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="restaurant-list">
        {restaurants.map((restaurant) => (
          <button key={restaurant.id} className="restaurant-card" onClick={() => onOpen(restaurant)} data-testid={`restaurant-${restaurant.id}`}>
            <img src={foodImageSrc(restaurant.imageName)} alt="" />
            <div className="restaurant-copy">
              <div className="row-between">
                <h2>{restaurant.name}</h2>
                <span className="rating">★ {restaurant.rating}</span>
              </div>
              <p>{restaurant.tags.join(' · ')}</p>
              <div className="meta-row">
                <span><Clock3 size={15} /> {restaurant.etaMinutes} 分钟</span>
                <span><MapPin size={15} /> {restaurant.distanceKm} km</span>
                <span>配送 {money(restaurant.deliveryFee)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function RestaurantDetail({ restaurant, cart, onBack, onAdd }: {
  restaurant: Restaurant;
  cart: CartItem[];
  onBack: () => void;
  onAdd: (restaurantId: string, menuItemId: string) => void;
}) {
  return (
    <section className="detail-view">
      <button className="ghost-button back-button" onClick={onBack}>
        <ChevronLeft size={18} /> 返回餐厅
      </button>
      <div className="detail-hero">
        <img src={foodImageSrc(restaurant.imageName)} alt="" />
        <div>
          <p className="eyebrow">{restaurant.category} · {restaurant.distanceKm} km</p>
          <h2>{restaurant.name}</h2>
          <p>{restaurant.tags.join(' · ')}</p>
          <div className="meta-row">
            <span>★ {restaurant.rating}</span>
            <span>起送 {money(restaurant.minimumOrder)}</span>
            <span>预计 {restaurant.etaMinutes} 分钟快到</span>
          </div>
        </div>
      </div>
      {restaurant.menuSections.map((section) => (
        <div key={section.id} className="menu-section">
          <h3>{section.title}</h3>
          <div className="menu-grid">
            {section.items.map((item) => {
              const quantity = cart.find((cartItem) => cartItem.restaurantId === restaurant.id && cartItem.menuItemId === item.id)?.quantity ?? 0;
              return (
                <article key={item.id} className="menu-card">
                  <img src={foodImageSrc(item.imageName)} alt="" />
                  <div>
                    <div className="row-between">
                      <h4>{item.name}</h4>
                      <span className="heat">{item.heat}°</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="tag-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <div className="row-between">
                      <strong>{money(item.price)}</strong>
                      <button className="icon-button" onClick={() => onAdd(restaurant.id, item.id)} data-testid={`add-${item.id}`} aria-label={`加入 ${item.name}`}>
                        {quantity > 0 ? <span>{quantity}</span> : <Plus size={18} />}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function CartPage({ lines, totals, cart, profile, walletNotice, address, setAddress, onAdd, onMinus, onRemove, onBegin, onRecharge }: {
  lines: ReturnType<typeof resolveCartLines>;
  totals: ReturnType<typeof calculateCartTotals>;
  cart: CartItem[];
  profile: UserProfile;
  walletNotice: string;
  address: VirtualAddress;
  setAddress: (address: VirtualAddress) => void;
  onAdd: (restaurantId: string, menuItemId: string) => void;
  onMinus: (restaurantId: string, menuItemId: string) => void;
  onRemove: (restaurantId: string, menuItemId: string) => void;
  onBegin: () => void;
  onRecharge: (amount: number) => void;
}) {
  const canAfford = profile.isRegistered && profile.balance >= totals.total;

  return (
    <section className="cart-layout">
      <div className="cart-main">
        <div className="section-title">
          <h2>购物车</h2>
          <p>这里没有付款，只有期待。</p>
        </div>
        {lines.length === 0 ? (
          <div className="empty-state">
            <Utensils size={42} />
            <h3>今晚还没有差点拥有</h3>
            <p>去首页滑一滑，给大脑一点认真挑选的快乐。</p>
          </div>
        ) : (
          <div className="cart-lines">
            {lines.map((line) => (
              <article key={`${line.restaurantId}-${line.menuItemId}`} className="cart-line">
                <img src={foodImageSrc(line.item.imageName)} alt="" />
                <div>
                  <p className="eyebrow">{line.restaurant.name}</p>
                  <h3>{line.item.name}</h3>
                  <strong>{money(line.lineTotal)}</strong>
                </div>
                <div className="stepper">
                  <button onClick={() => onMinus(line.restaurantId, line.menuItemId)} aria-label="减少数量"><Minus size={16} /></button>
                  <span>{line.quantity}</span>
                  <button onClick={() => onAdd(line.restaurantId, line.menuItemId)} aria-label="增加数量"><Plus size={16} /></button>
                </div>
                <button className="ghost-icon" onClick={() => onRemove(line.restaurantId, line.menuItemId)} aria-label="移除">
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="checkout-panel">
        <h2>虚拟结算</h2>
        <p className="privacy-note">只使用虚拟地址昵称，不采集真实地址，也不会请求付款。</p>
        <div className="address-grid">
          {data.addresses.map((candidate) => (
            <button
              key={candidate.id}
              className={candidate.id === address.id ? 'selected' : ''}
              onClick={() => setAddress(candidate)}
            >
              <MapPin size={17} />
              <span>{candidate.label}</span>
              <small>{candidate.detail}</small>
            </button>
          ))}
        </div>
        <div className="coupon-box">
          <BadgePercent size={20} />
          <div>
            <strong>{totals.coupon?.title ?? '再凑一点券'}</strong>
            <p>{totals.coupon?.copy ?? '满 38 会自动帮你减掉一点冲动。'}</p>
          </div>
        </div>
        <div className={`wallet-box ${canAfford ? '' : 'needs-recharge'}`}>
          <WalletCards size={22} />
          <div>
            <strong>{profile.isRegistered ? `${profile.username} 的情绪储值` : '还没有注册情绪钱包'}</strong>
            <p>
              {profile.isRegistered
                ? `当前余额 ${money(profile.balance)}，本次将扣除 ${money(totals.total)}。`
                : '注册后选择一笔预存储值，再开始这次期待。'}
            </p>
            {walletNotice ? <small>{walletNotice}</small> : null}
            {!canAfford && profile.isRegistered ? (
              <div className="mini-recharge-row">
                {rechargeAmounts.map((amount) => (
                  <button key={amount} onClick={() => onRecharge(amount)}>+{money(amount)}</button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <dl className="totals">
          <div><dt>商品小计</dt><dd>{money(totals.subtotal)}</dd></div>
          <div><dt>虚拟配送</dt><dd>{money(totals.deliveryFee)}</dd></div>
          <div><dt>冲动折扣</dt><dd>-{money(totals.discount)}</dd></div>
          <div className="total"><dt>如果真点了</dt><dd>{money(totals.total)}</dd></div>
        </dl>
        <button className="primary-button" onClick={onBegin} disabled={cart.length === 0} data-testid="begin-expectation">
          <Sparkles size={19} /> {profile.isRegistered && !canAfford ? '余额不足，先充值' : '开始期待'}
        </button>
      </aside>
    </section>
  );
}

function TrackingPage({ order, onFinish }: { order: SimulatedOrder; onFinish: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const elapsed = Math.floor((now - new Date(order.createdAt).getTime()) / 1000);
  const status = statusForElapsed(elapsed);
  const progress = statusProgress(elapsed, readySeconds);
  const canReflect = elapsed >= readySeconds;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="tracking-layout">
      <div className="mock-map" aria-label="虚拟骑手地图">
        <div className="street horizontal" />
        <div className="street vertical" />
        <div className="home-pin"><Home size={18} /> 你</div>
        <div className="rider-pin" style={{ left: `${12 + progress * 74}%`, top: `${70 - progress * 48}%` }}>
          <Bike size={20} />
        </div>
      </div>
      <div className="tracking-panel">
        <p className="eyebrow">订单永远不会完成</p>
        <h2>{status.title}</h2>
        <p>{status.detail}</p>
        <div className="eta-card">
          <Clock3 size={22} />
          <div>
            <strong>预计 8 分钟后仍然预计 8 分钟</strong>
            <span>已期待 {elapsed} 秒，真实支出仍为 {money(0)}</span>
          </div>
        </div>
        <ol className="timeline">
          {data.statusEvents.map((event) => (
            <li key={event.status} className={elapsed >= Math.min(event.unlockSecond, readySeconds) ? 'done' : ''}>
              <span />
              <div>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <button className="primary-button" onClick={onFinish} disabled={!canReflect} data-testid="finish-expectation">
          <Heart size={19} /> 我已经不想吃了
        </button>
      </div>
    </section>
  );
}

function ReflectionPage({ reflection, onHome, onAgain }: {
  reflection: ReflectionSummary;
  onHome: () => void;
  onAgain: () => void;
}) {
  return (
    <section className="reflection-view">
      <div className="reflection-card">
        <Sparkles size={36} />
        <p className="eyebrow">情绪复盘</p>
        <h2>你已经拥有了最快乐的那一部分</h2>
        <p>{reflection.copy}</p>
        <div className="saved-amount">{money(reflection.savedAmount)}</div>
        <p>今晚差点拥有：{reflection.itemNames.join('、')}</p>
        <div className="reflection-actions">
          <button className="primary-button" onClick={onHome} data-testid="wallet-rest">
            <ReceiptText size={19} /> 今晚先放过钱包
          </button>
          <button className="ghost-button" onClick={onAgain}>
            <Search size={18} /> 再模拟一单
          </button>
        </div>
      </div>
    </section>
  );
}

function HistoryPage({ history, summary }: { history: ReflectionSummary[]; summary: ReturnType<typeof summarizeHistory> }) {
  return (
    <section className="history-layout">
      <div className="stats-grid">
        <article>
          <BarChart3 size={22} />
          <span>累计避免支出</span>
          <strong>{money(summary.totalSaved)}</strong>
        </article>
        <article>
          <History size={22} />
          <span>期待结束次数</span>
          <strong>{summary.count}</strong>
        </article>
        <article>
          <Utensils size={22} />
          <span>最常幻想品类</span>
          <strong>{summary.topCategory}</strong>
        </article>
      </div>
      <div className="history-list">
        <div className="section-title">
          <h2>我差点吃了什么</h2>
          <p>这些期待被认真经历过，也被温柔放下了。</p>
        </div>
        {history.length === 0 ? (
          <div className="empty-state">
            <History size={40} />
            <h3>还没有复盘记录</h3>
            <p>完成一次虚拟等待后，这里会记录你今晚省下的现实成本。</p>
          </div>
        ) : (
          history.map((item) => (
            <article key={item.id} className="history-item">
              <div>
                <p className="eyebrow">{new Date(item.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <h3>{item.itemNames.join('、')}</h3>
                <p>{item.copy}</p>
              </div>
              <strong>{money(item.savedAmount)}</strong>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ProfilePage({ profile, notice, setNotice, onRegister, onRecharge, onThemeChange }: {
  profile: UserProfile;
  notice: string;
  setNotice: (notice: string) => void;
  onRegister: (name: string, amount: number) => void;
  onRecharge: (amount: number) => void;
  onThemeChange: (part: 'backgroundColor' | 'iconColor' | 'fontColor', color: DopamineColorId) => void;
}) {
  const [draftName, setDraftName] = useState(profile.username);
  const [selectedName, setSelectedName] = useState(suggestedUsernames[0]);
  const [selectedAmount, setSelectedAmount] = useState(rechargeAmounts[1]);
  const displayName = profile.username || selectedName;

  function register() {
    const name = draftName.trim() || selectedName;
    onRegister(name, selectedAmount);
    setNotice(`欢迎 ${name}，已存入 ${money(selectedAmount)} 情绪预算。`);
  }

  function recharge(amount: number) {
    onRecharge(amount);
    setNotice(`已充值 ${money(amount)}，余额又被情绪价值抱了一下。`);
  }

  return (
    <section className="profile-layout">
      <div className="profile-hero">
        <div>
          <p className="eyebrow">我的情绪钱包</p>
          <h2>{profile.isRegistered ? displayName : '先注册一个会劝你的名字'}</h2>
          <p>{profile.isRegistered ? '每次开始期待都会从这里扣除虚拟储值，余额不足时先充值。' : '自定义用户名，或者拿一个系统准备好的劝慰讽刺名。'}</p>
        </div>
        <div className="balance-orb">
          <WalletCards size={26} />
          <span>余额</span>
          <strong>{money(profile.balance)}</strong>
        </div>
      </div>

      {notice ? (
        <div className="profile-notice">
          <WandSparkles size={20} />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="profile-grid">
        <article className="settings-card">
          <div className="settings-title">
            <UserRound size={22} />
            <div>
              <h3>{profile.isRegistered ? '用户信息' : '注册入口'}</h3>
              <p>名字可以认真，也可以让系统替钱包阴阳怪气一下。</p>
            </div>
          </div>
          <label className="profile-input">
            自定义用户名
            <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="例如：今晚不点也很完整" />
          </label>
          <div className="suggested-names">
            {suggestedUsernames.map((name) => (
              <button
                key={name}
                className={selectedName === name ? 'selected' : ''}
                onClick={() => {
                  setSelectedName(name);
                  setDraftName('');
                }}
              >
                {name}
              </button>
            ))}
          </div>
          {!profile.isRegistered ? (
            <>
              <AmountPicker selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount} />
              <button className="primary-button" onClick={register} data-testid="register-profile">
                <CircleDollarSign size={19} /> 注册并存入 {money(selectedAmount)}
              </button>
            </>
          ) : (
            <div className="registered-copy">
              <strong>{displayName}</strong>
              <span>这名字看起来很会把夜宵冲动拦在门外。</span>
            </div>
          )}
        </article>

        <article className="settings-card">
          <div className="settings-title">
            <WalletCards size={22} />
            <div>
              <h3>储值充值</h3>
              <p>余额不足时，先给情绪预算充点彩色空气。</p>
            </div>
          </div>
          <div className="recharge-grid">
            {rechargeAmounts.map((amount) => (
              <button key={amount} onClick={() => recharge(amount)} disabled={!profile.isRegistered}>
                +{money(amount)}
              </button>
            ))}
          </div>
        </article>

        <article className="settings-card theme-card">
          <div className="settings-title">
            <Palette size={22} />
            <div>
              <h3>多巴胺配色</h3>
              <p>背景色、图标色、字体颜色都可以单独选择。</p>
            </div>
          </div>
          <ThemePicker title="背景色" value={profile.backgroundColor} part="backgroundColor" onChange={onThemeChange} />
          <ThemePicker title="图标色" value={profile.iconColor} part="iconColor" onChange={onThemeChange} />
          <ThemePicker title="字体颜色" value={profile.fontColor} part="fontColor" onChange={onThemeChange} />
        </article>
      </div>
    </section>
  );
}

function AmountPicker({ selectedAmount, setSelectedAmount }: { selectedAmount: number; setSelectedAmount: (amount: number) => void }) {
  return (
    <div className="amount-picker">
      <span>选择预存储值</span>
      <div>
        {rechargeAmounts.map((amount) => (
          <button key={amount} className={selectedAmount === amount ? 'selected' : ''} onClick={() => setSelectedAmount(amount)}>
            {money(amount)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemePicker({ title, value, part, onChange }: {
  title: string;
  value: DopamineColorId;
  part: 'backgroundColor' | 'iconColor' | 'fontColor';
  onChange: (part: 'backgroundColor' | 'iconColor' | 'fontColor', color: DopamineColorId) => void;
}) {
  return (
    <div className="theme-picker">
      <span>{title}</span>
      <div className="swatch-row">
        {dopaminePalettes.map((palette) => (
          <button
            key={palette.id}
            className={value === palette.id ? 'selected' : ''}
            onClick={() => onChange(part, palette.id)}
            aria-label={`${title} ${palette.label}`}
          >
            <span style={{ background: palette.color }} />
            {palette.label}
          </button>
        ))}
      </div>
    </div>
  );
}
