import {
  BadgePercent,
  BarChart3,
  Bike,
  ChevronLeft,
  Clock3,
  Heart,
  History,
  Home,
  MapPin,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  addToCart,
  calculateCartTotals,
  createReflection,
  createSimulatedOrder,
  data,
  decrementCart,
  removeFromCart,
  resolveCartLines,
  statusForElapsed,
  statusProgress,
  summarizeHistory,
} from './domain';
import type { CartItem, ReflectionSummary, Restaurant, SimulatedOrder, VirtualAddress } from './types';

type Page = 'home' | 'cart' | 'tracking' | 'reflection' | 'history';

const cartKey = 'dopamine.delivery.cart';
const addressKey = 'dopamine.delivery.address';
const historyKey = 'dopamine.delivery.history';
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

  function addItem(restaurantId: string, menuItemId: string) {
    setCart((current) => addToCart(current, restaurantId, menuItemId));
  }

  function beginExpectation() {
    if (!cart.length) return;
    const order = createSimulatedOrder(cart, address);
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
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Food Never Comes, but gentler</p>
          <h1>多巴胺外卖</h1>
        </div>
        <button className="ghost-button address-pill" onClick={() => setPage('cart')} aria-label="打开虚拟地址">
          <MapPin size={18} />
          <span>{address.label}</span>
        </button>
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
            address={address}
            setAddress={setAddress}
            onAdd={addItem}
            onMinus={(restaurantId, menuItemId) => setCart((current) => decrementCart(current, restaurantId, menuItemId))}
            onRemove={(restaurantId, menuItemId) => setCart((current) => removeFromCart(current, restaurantId, menuItemId))}
            onBegin={beginExpectation}
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
            <img src={restaurant.imageUrl} alt="" />
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
        <img src={restaurant.imageUrl} alt="" />
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
                  <img src={item.imageUrl} alt="" />
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

function CartPage({ lines, totals, cart, address, setAddress, onAdd, onMinus, onRemove, onBegin }: {
  lines: ReturnType<typeof resolveCartLines>;
  totals: ReturnType<typeof calculateCartTotals>;
  cart: CartItem[];
  address: VirtualAddress;
  setAddress: (address: VirtualAddress) => void;
  onAdd: (restaurantId: string, menuItemId: string) => void;
  onMinus: (restaurantId: string, menuItemId: string) => void;
  onRemove: (restaurantId: string, menuItemId: string) => void;
  onBegin: () => void;
}) {
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
                <img src={line.item.imageUrl} alt="" />
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
        <dl className="totals">
          <div><dt>商品小计</dt><dd>{money(totals.subtotal)}</dd></div>
          <div><dt>虚拟配送</dt><dd>{money(totals.deliveryFee)}</dd></div>
          <div><dt>冲动折扣</dt><dd>-{money(totals.discount)}</dd></div>
          <div className="total"><dt>如果真点了</dt><dd>{money(totals.total)}</dd></div>
        </dl>
        <button className="primary-button" onClick={onBegin} disabled={cart.length === 0} data-testid="begin-expectation">
          <Sparkles size={19} /> 开始期待
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

