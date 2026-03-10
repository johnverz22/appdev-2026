import React, { useState, useEffect, useCallback } from 'react';

// ── Service URLs ───────────────────────────────────────────────────────────
const PHP_URL = process.env.REACT_APP_PHP_URL || 'http://localhost:8000';
const JAVA_URL = process.env.REACT_APP_JAVA_URL || 'http://localhost:8081';

// ── Product emoji map (cosmetic only) ─────────────────────────────────────
const PRODUCT_EMOJI = { laptop: '💻', mouse: '🖱️', keyboard: '⌨️', monitor: '🖥️', webcam: '📷', headset: '🎧' };
function productEmoji(name) {
    const key = name.toLowerCase().split(' ')[0];
    return PRODUCT_EMOJI[key] || '📦';
}

// ═══════════════════════════════════════════════════════════════════════════
// Component: ProductCard
// ═══════════════════════════════════════════════════════════════════════════
function ProductCard({ product, onAddToCart }) {
    const [added, setAdded] = useState(false);
    function handleAdd() {
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    }
    return (
        <div style={s.card}>
            <div style={s.cardEmoji}>{productEmoji(product.name)}</div>
            <div style={s.cardName}>{product.name}</div>
            <div style={s.cardPrice}>${product.price.toFixed(2)}</div>
            <button style={added ? { ...s.addBtn, ...s.addBtnDone } : s.addBtn} onClick={handleAdd}>
                {added ? '✓ Added' : 'Add to Cart'}
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Component: CartPanel
// ═══════════════════════════════════════════════════════════════════════════
function CartPanel({ cart, onQtyChange, onRemove, onCheckout, checking, checkoutMsg }) {
    const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

    if (cart.length === 0) {
        return (
            <div style={s.cart}>
                <h2 style={s.cartTitle}>🛒 Cart</h2>
                <p style={s.cartEmpty}>Your cart is empty.<br />Add products from the catalog.</p>
            </div>
        );
    }

    return (
        <div style={s.cart}>
            <h2 style={s.cartTitle}>🛒 Cart</h2>

            {cart.map(item => (
                <div key={item.product.id} style={s.cartItem}>
                    <span style={s.cartItemEmoji}>{productEmoji(item.product.name)}</span>
                    <div style={s.cartItemInfo}>
                        <div style={s.cartItemName}>{item.product.name}</div>
                        <div style={s.cartItemSub}>${item.product.price.toFixed(2)} each</div>
                    </div>
                    <div style={s.cartQtyRow}>
                        <button style={s.qtyBtn} onClick={() => onQtyChange(item.product.id, item.qty - 1)}>−</button>
                        <span style={s.qtyVal}>{item.qty}</span>
                        <button style={s.qtyBtn} onClick={() => onQtyChange(item.product.id, item.qty + 1)}>+</button>
                    </div>
                    <button style={s.removeBtn} onClick={() => onRemove(item.product.id)}>×</button>
                </div>
            ))}

            <div style={s.cartDivider} />
            <div style={s.cartTotal}>
                <span>Total</span>
                <span style={s.cartTotalAmt}>${total.toFixed(2)}</span>
            </div>

            {checkoutMsg && (
                <div style={checkoutMsg.ok ? s.msgOk : s.msgErr}>{checkoutMsg.text}</div>
            )}

            <button style={s.checkoutBtn} onClick={onCheckout} disabled={checking}>
                {checking ? 'Placing order…' : 'Place Order →'}
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Component: OrdersTab
// ═══════════════════════════════════════════════════════════════════════════
function OrdersTab({ orders, loading }) {
    if (loading) return <p style={s.hint}>Loading orders…</p>;
    if (orders.length === 0) return <p style={s.hint}>No orders yet. Place one from the Shop tab!</p>;

    return (
        <div style={s.ordersContainer}>
            {[...orders].reverse().map(o => (
                <div key={o.id} style={s.orderCard}>
                    <div style={s.orderEmoji}>{productEmoji(o.productName)}</div>
                    <div style={s.orderInfo}>
                        <div style={s.orderProduct}>{o.productName}</div>
                        <div style={s.orderMeta}>
                            Qty: <strong>{o.quantity}</strong> &nbsp;·&nbsp;
                            Unit: <strong>${o.price.toFixed(2)}</strong> &nbsp;·&nbsp;
                            Total: <strong>${(o.price * o.quantity).toFixed(2)}</strong>
                        </div>
                        <div style={s.orderSvc}>via Java Orders Service &nbsp;·&nbsp; Order #{o.id}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// App root
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [cart, setCart] = useState([]);
    const [tab, setTab] = useState('shop');   // 'shop' | 'orders'
    const [loadProd, setLoadProd] = useState(true);
    const [loadOrd, setLoadOrd] = useState(true);
    const [checking, setChecking] = useState(false);
    const [checkMsg, setCheckMsg] = useState(null);
    const [prodErr, setProdErr] = useState(null);

    // Fetch products
    useEffect(() => {
        fetch(`${PHP_URL}/products`)
            .then(r => r.json())
            .then(data => { setProducts(data); setLoadProd(false); })
            .catch(() => { setProdErr('Could not reach PHP Products service.'); setLoadProd(false); });
    }, []);

    // Fetch orders
    const fetchOrders = useCallback(() => {
        setLoadOrd(true);
        fetch(`${JAVA_URL}/orders`)
            .then(r => r.json())
            .then(data => { setOrders(data); setLoadOrd(false); })
            .catch(() => setLoadOrd(false));
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── Cart helpers ──────────────────────────────────────────────
    function addToCart(product) {
        setCart(prev => {
            const existing = prev.find(i => i.product.id === product.id);
            if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { product, qty: 1 }];
        });
    }

    function changeQty(productId, newQty) {
        if (newQty < 1) { removeFromCart(productId); return; }
        setCart(prev => prev.map(i => i.product.id === productId ? { ...i, qty: newQty } : i));
    }

    function removeFromCart(productId) {
        setCart(prev => prev.filter(i => i.product.id !== productId));
    }

    // ── Checkout ──────────────────────────────────────────────────
    // For each cart item, POST /orders to the Java service.
    // Java service then calls PHP service internally to validate the product.
    async function checkout() {
        setChecking(true);
        setCheckMsg(null);
        try {
            for (const item of cart) {
                const res = await fetch(`${JAVA_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Send only productId + quantity — Java fetches name/price from PHP service
                    body: JSON.stringify({ productId: item.product.id, quantity: item.qty }),
                });
                if (!res.ok) throw new Error(await res.text());
            }
            setCart([]);
            setCheckMsg({ ok: true, text: `✓ Order placed successfully!` });
            fetchOrders();   // refresh orders list
        } catch (e) {
            setCheckMsg({ ok: false, text: `Order failed: ${e.message}` });
        } finally {
            setChecking(false);
        }
    }

    const cartCount = cart.reduce((n, i) => n + i.qty, 0);

    // ═══════════════════════════════════════════════════════════════
    return (
        <div style={s.page}>

            {/* ── Header ───────────────────────────────────────────── */}
            <header style={s.header}>
                <div style={s.headerInner}>
                    <div>
                        <div style={s.logo}>🛍 TechShop</div>
                        <div style={s.logoSub}>Microservices Demo · React + PHP + Java + PostgreSQL</div>
                    </div>
                    <div style={s.headerRight}>
                        <button
                            style={tab === 'shop' ? s.tabActive : s.tabBtn}
                            onClick={() => setTab('shop')}
                        >Shop</button>
                        <button
                            style={tab === 'orders' ? s.tabActive : s.tabBtn}
                            onClick={() => { setTab('orders'); fetchOrders(); }}
                        >My Orders {orders.length > 0 && <span style={s.badge}>{orders.length}</span>}</button>
                    </div>
                </div>
            </header>

            {/* ── Architecture banner ───────────────────────────────── */}
            <div style={s.archBanner}>
                <span style={s.archItem}><b>Browser</b> (React :3000)</span>
                <span style={s.archArrow}>→</span>
                <span style={{ ...s.archItem, ...s.archPhp }}><b>PHP</b> :8000 · products</span>
                <span style={s.archArrow}>↕ REST&nbsp;validation</span>
                <span style={{ ...s.archItem, ...s.archJava }}><b>Java</b> :8081 · orders</span>
                <span style={s.archArrow}>→</span>
                <span style={{ ...s.archItem, ...s.archDb }}><b>PostgreSQL</b> :5433</span>
            </div>

            {/* ── Main content ──────────────────────────────────────── */}
            <main style={s.main}>

                {tab === 'shop' && (
                    <>
                        {/* Product catalog */}
                        <div style={s.catalog}>
                            <div style={s.catalogHeader}>
                                <h2 style={s.catalogTitle}>Product Catalog</h2>
                                <span style={s.svcTag}>PHP Products Service</span>
                            </div>

                            {loadProd && <p style={s.hint}>Loading products…</p>}
                            {prodErr && <p style={{ ...s.hint, color: '#ef4444' }}>{prodErr}</p>}

                            <div style={s.grid}>
                                {products.map(p => (
                                    <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
                                ))}
                            </div>
                        </div>

                        {/* Cart */}
                        <CartPanel
                            cart={cart}
                            onQtyChange={changeQty}
                            onRemove={removeFromCart}
                            onCheckout={checkout}
                            checking={checking}
                            checkoutMsg={checkMsg}
                        />
                    </>
                )}

                {tab === 'orders' && (
                    <div style={s.ordersPage}>
                        <div style={s.catalogHeader}>
                            <h2 style={s.catalogTitle}>Order History</h2>
                            <span style={s.svcTagJava}>Java Orders Service</span>
                        </div>
                        <OrdersTab orders={orders} loading={loadOrd} />
                    </div>
                )}
            </main>

            {/* ── Floating cart badge (visible when on orders tab) ─── */}
            {tab === 'orders' && cartCount > 0 && (
                <button style={s.fab} onClick={() => setTab('shop')}>
                    🛒 {cartCount}
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════
const s = {
    page: { minHeight: '100vh', background: '#f1f5f9' },

    // Header
    header: { background: '#0f172a', padding: '0 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,.3)' },
    headerInner: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' },
    logo: { color: '#f8fafc', fontWeight: 700, fontSize: '1.25rem' },
    logoSub: { color: '#94a3b8', fontSize: '0.72rem', marginTop: '1px' },
    headerRight: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
    tabBtn: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.88rem' },
    tabActive: { background: '#3b82f6', border: '1px solid #3b82f6', color: '#fff', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 600 },
    badge: { background: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.7rem', padding: '1px 6px', marginLeft: '4px' },

    // Architecture banner
    archBanner: { background: '#1e293b', color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.45rem 1rem', flexWrap: 'wrap' },
    archItem: { background: '#334155', padding: '2px 10px', borderRadius: '4px', color: '#e2e8f0' },
    archPhp: { background: '#1e3a5f', color: '#93c5fd' },
    archJava: { background: '#3b1e1e', color: '#fca5a5' },
    archDb: { background: '#14532d', color: '#86efac' },
    archArrow: { color: '#475569' },

    // Main layout
    main: { maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },

    // Catalog
    catalog: { flex: 1 },
    catalogHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
    catalogTitle: { fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' },
    svcTag: { fontSize: '0.7rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '999px', fontWeight: 600 },
    svcTagJava: { fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 10px', borderRadius: '999px', fontWeight: 600 },

    // Product grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' },

    // Product card
    card: { background: '#fff', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)', transition: 'box-shadow .15s', border: '1px solid #e2e8f0' },
    cardEmoji: { fontSize: '2.5rem', lineHeight: 1 },
    cardName: { fontWeight: 600, fontSize: '0.95rem', textAlign: 'center', color: '#1e293b' },
    cardPrice: { color: '#3b82f6', fontWeight: 700, fontSize: '1.05rem' },
    addBtn: { marginTop: '0.4rem', width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.45rem 0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', transition: 'background .15s' },
    addBtnDone: { background: '#22c55e' },

    // Cart panel
    cart: { width: '300px', flexShrink: 0, background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #e2e8f0', position: 'sticky', top: '1.5rem' },
    cartTitle: { fontWeight: 700, fontSize: '1rem', marginBottom: '0.9rem', color: '#0f172a' },
    cartEmpty: { color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, textAlign: 'center', padding: '1rem 0' },
    cartItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' },
    cartItemEmoji: { fontSize: '1.4rem', flexShrink: 0 },
    cartItemInfo: { flex: 1, minWidth: 0 },
    cartItemName: { fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cartItemSub: { color: '#64748b', fontSize: '0.75rem' },
    cartQtyRow: { display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 },
    qtyBtn: { width: '24px', height: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '4px', fontSize: '0.9rem', lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    qtyVal: { fontSize: '0.88rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' },
    removeBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.1rem', padding: '2px 4px' },
    cartDivider: { borderTop: '1px solid #f1f5f9', margin: '0.75rem 0' },
    cartTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' },
    cartTotalAmt: { fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' },
    checkoutBtn: { width: '100%', background: '#0f172a', color: '#f8fafc', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem' },

    // Messages
    msgOk: { background: '#f0fdf4', color: '#16a34a', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.82rem', marginBottom: '0.75rem', border: '1px solid #bbf7d0' },
    msgErr: { background: '#fef2f2', color: '#dc2626', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.82rem', marginBottom: '0.75rem', border: '1px solid #fecaca' },

    // Orders tab
    ordersPage: { flex: 1 },
    ordersContainer: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    orderCard: { background: '#fff', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #e2e8f0' },
    orderEmoji: { fontSize: '2rem', flexShrink: 0 },
    orderInfo: { flex: 1 },
    orderProduct: { fontWeight: 700, fontSize: '1rem', color: '#0f172a' },
    orderMeta: { color: '#475569', fontSize: '0.85rem', marginTop: '2px' },
    orderSvc: { color: '#94a3b8', fontSize: '0.72rem', marginTop: '4px' },

    // FAB
    fab: { position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#0f172a', color: '#f8fafc', border: 'none', borderRadius: '999px', padding: '0.7rem 1.2rem', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 14px rgba(0,0,0,.25)' },

    // Misc
    hint: { color: '#94a3b8', fontSize: '0.9rem', padding: '1rem 0' },
};
