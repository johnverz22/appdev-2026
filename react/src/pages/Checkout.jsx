import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingCart, ArrowLeft, Plus, Minus, Trash2,
    CheckCircle, AlertCircle, Loader2, ClipboardList,
} from 'lucide-react';
import phpApi from '../config/phpApi';
import djangoApi from '../config/djangoApi';

const Checkout = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});          // { productId: qty }
    const [orders, setOrders] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState('');

    // ── Fetch products from PHP API ──────────────────────────────────────────
    useEffect(() => {
        phpApi.get('/products')
            .then(({ data }) => setProducts(data))
            .catch(() => setError('Failed to load products.'))
            .finally(() => setLoadingProducts(false));
    }, []);

    // ── Fetch existing orders from Django API ────────────────────────────────
    useEffect(() => {
        djangoApi.get('/orders')
            .then(({ data }) => setOrders(data))
            .catch(() => {}); // silently ignore on first load
    }, []);

    const addToCart = (product) =>
        setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));

    const removeOne = (id) =>
        setCart(prev => {
            const qty = (prev[id] || 0) - 1;
            if (qty <= 0) { const next = { ...prev }; delete next[id]; return next; }
            return { ...prev, [id]: qty };
        });

    const removeAll = (id) =>
        setCart(prev => { const next = { ...prev }; delete next[id]; return next; });

    const cartItems = products
        .filter(p => cart[p.id])
        .map(p => ({ ...p, qty: cart[p.id] }));

    const total = cartItems.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);

    const placeOrder = async () => {
        setPlacing(true);
        setError('');
        setSuccess(null);
        try {
            const payload = cartItems.map(i => ({
                product_id: i.id,
                name: i.name,
                price: i.price,
                qty: i.qty,
            }));
            const { data } = await djangoApi.post('/checkout', { items: payload });
            setSuccess(data);
            setCart({});
            setOrders(prev => [data, ...prev]);
        } catch (err) {
            setError(err.response?.data?.error || 'Checkout failed.');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="fixed top-[-15%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg text-white">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Checkout</h1>
                            <p className="text-slate-400 text-sm mt-0.5">Served by Django microservice</p>
                        </div>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Product picker */}
                    <div className="lg:col-span-2 space-y-3">
                        <h2 className="text-slate-300 font-semibold mb-2">Select Products</h2>
                        {loadingProducts && (
                            <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
                                <Loader2 className="animate-spin w-6 h-6" /> Loading products…
                            </div>
                        )}
                        {products.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-all">
                                <div>
                                    <p className="text-white text-sm font-medium">{p.name}</p>
                                    <p className="text-emerald-400 text-sm">${Number(p.price).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cart[p.id] ? (
                                        <>
                                            <button onClick={() => removeOne(p.id)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-white w-5 text-center text-sm">{cart[p.id]}</span>
                                            <button onClick={() => addToCart(p)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => removeAll(p.id)} className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-all ml-1">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => addToCart(p)} className="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all">
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart summary */}
                    <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <h2 className="text-slate-300 font-semibold mb-4">Cart</h2>
                            {cartItems.length === 0 ? (
                                <p className="text-slate-500 text-sm">No items yet.</p>
                            ) : (
                                <ul className="space-y-2 mb-4">
                                    {cartItems.map(i => (
                                        <li key={i.id} className="flex justify-between text-sm text-slate-300">
                                            <span className="truncate max-w-[140px]">{i.name} ×{i.qty}</span>
                                            <span className="text-emerald-400">${(Number(i.price) * i.qty).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="border-t border-white/10 pt-3 flex justify-between text-white font-semibold">
                                <span>Total</span>
                                <span className="text-emerald-400">${total.toFixed(2)}</span>
                            </div>

                            {error && (
                                <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> Order #{success.id} confirmed!
                                </div>
                            )}

                            <button
                                onClick={placeOrder}
                                disabled={cartItems.length === 0 || placing}
                                className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Place Order
                            </button>
                        </div>

                        {/* Past orders */}
                        {orders.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold">
                                    <ClipboardList className="w-4 h-4" /> Past Orders
                                </div>
                                <ul className="space-y-2">
                                    {orders.slice(0, 5).map(o => (
                                        <li key={o.id} className="text-sm flex justify-between text-slate-400">
                                            <span>#{o.id} · {o.status}</span>
                                            <span className="text-emerald-400">${Number(o.total).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
