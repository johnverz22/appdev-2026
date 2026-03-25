import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ShoppingBag, ArrowLeft, Tag, Box, AlertCircle,
    Loader2, Plus, Pencil, Trash2, X, Check, ShoppingCart,
} from 'lucide-react';
import phpApi from '../config/phpApi';
import { useAuth } from '../hooks/useAuth';

const categoryColors = {
    Electronics: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
    Furniture:   'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    Footwear:    'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300',
    Accessories: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-300',
    Sports:      'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
};

const EMPTY_FORM = { name: '', price: '', category: '', stock: '', image_url: '' };

// ── Product Form Modal ────────────────────────────────────────────────────────
const ProductModal = ({ initial, onSave, onClose }) => {
    const [form, setForm] = useState(initial ?? EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const isEdit = !!initial;

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (isEdit) {
                const { data } = await phpApi.put(`/products/${initial.id}`, form);
                onSave(data);
            } else {
                const { data } = await phpApi.post('/products', form);
                onSave(data);
            }
        } catch (err) {
            const msg = err.response?.data?.fields?.join(', ')
                || err.response?.data?.error
                || 'Save failed.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const field = (label, key, type = 'text') => (
        <div>
            <label className="block text-xs text-slate-400 mb-1">{label}</label>
            <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                required={key !== 'image_url'}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-800 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-white font-semibold text-lg">
                        {isEdit ? 'Edit Product' : 'New Product'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {field('Name', 'name')}
                    {field('Price', 'price', 'number')}
                    {field('Category', 'category')}
                    {field('Stock', 'stock', 'number')}
                    {field('Image URL (optional)', 'image_url')}

                    {error && (
                        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-2 text-sm bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center gap-2 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isEdit ? 'Save Changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, isAdmin, onEdit, onDelete }) => {
    const colors = categoryColors[product.category]
        || 'from-slate-500/20 to-slate-400/20 border-slate-500/30 text-slate-300';

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
            <div className="relative h-48 overflow-hidden bg-slate-800">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300/1e293b/94a3b8?text=No+Image'; }}
                />
                <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r border backdrop-blur-md ${colors}`}>
                        {product.category}
                    </span>
                </div>
                {/* Admin action buttons */}
                {isAdmin && (
                    <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(product)}
                            className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-violet-600 text-white flex items-center justify-center transition-colors"
                            title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(product)}
                            className="w-7 h-7 rounded-lg bg-slate-900/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                            title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-5">
                <h3 className="text-white font-semibold text-base leading-snug mb-3 line-clamp-2">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <Tag className="w-4 h-4" />
                        <span className="text-xl font-bold">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Box className="w-4 h-4" />
                        <span>{product.stock} in stock</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Catalog Page ──────────────────────────────────────────────────────────────
const Catalog = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ROLE_ADMIN';

    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);   // null | 'create' | product object (edit)
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        phpApi.get('/products')
            .then(({ data }) => setProducts(data))
            .catch((err) => {
                if (err.response?.status === 401) {
                    setError('Authentication failed. Please log out and log back in.');
                } else {
                    setError(err.response?.data?.error || 'Failed to load products.');
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleSaved = (saved) => {
        setProducts(prev => {
            const exists = prev.find(p => p.id === saved.id);
            return exists
                ? prev.map(p => p.id === saved.id ? saved : p)
                : [saved, ...prev];
        });
        setModal(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await phpApi.delete(`/products/${deleteTarget.id}`);
            setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30 text-white">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Product Catalog</h1>
                            <p className="text-slate-400 text-sm mt-0.5">
                                Served by PHP microservice · JWT authenticated
                                {isAdmin && <span className="ml-2 text-violet-400">· Admin mode</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <button onClick={() => setModal('create')}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl transition-all">
                                <Plus className="w-4 h-4" /> Add Product
                            </button>
                        )}
                        {!isAdmin && (
                            <Link to="/checkout"
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all">
                                <ShoppingCart className="w-4 h-4" /> Checkout
                            </Link>
                        )}
                        <Link to="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                        <p>Fetching products…</p>
                    </div>
                )}

                {/* Error */}
                {!isLoading && error && (
                    <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Error</p>
                            <p className="text-sm mt-0.5 text-red-400/80">{error}</p>
                        </div>
                    </div>
                )}

                {/* Grid */}
                {!isLoading && !error && (
                    <>
                        <p className="text-slate-500 text-sm mb-6">{products.length} products found</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isAdmin={isAdmin}
                                    onEdit={(p) => setModal(p)}
                                    onDelete={(p) => setDeleteTarget(p)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Create / Edit modal */}
            {modal && (
                <ProductModal
                    initial={modal === 'create' ? null : modal}
                    onSave={handleSaved}
                    onClose={() => setModal(null)}
                />
            )}

            {/* Delete confirm dialog */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-slate-800 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-white font-semibold mb-2">Delete product?</h2>
                        <p className="text-slate-400 text-sm mb-5">
                            "{deleteTarget.name}" will be permanently removed.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center gap-2 transition-all">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalog;
