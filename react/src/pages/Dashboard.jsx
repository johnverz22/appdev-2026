import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, LogOut, User, ShoppingBag,
    ShoppingCart, Package, Shield, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';

// ── Nav card shared component ─────────────────────────────────────────────────
const NavCard = ({ to, gradient, shadow, icon: Icon, label, description }) => (
    <Link
        to={to}
        className={`w-full py-4 px-5 mb-3 bg-gradient-to-r ${gradient} text-white font-medium rounded-xl shadow-lg ${shadow} flex items-center gap-3 transition-all active:scale-[0.98] hover:brightness-110`}
    >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <div className="text-left">
            <p className="text-sm font-semibold leading-tight">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{description}</p>
        </div>
    </Link>
);

// ── User dashboard ────────────────────────────────────────────────────────────
const UserDashboard = ({ user }) => (
    <>
        <p className="text-slate-400 text-sm mb-6">
            Browse products and place orders. Your session persists via HttpOnly cookie. 🍪
        </p>
        <NavCard
            to="/catalog"
            gradient="from-violet-600 to-cyan-600"
            shadow="shadow-violet-500/25"
            icon={ShoppingBag}
            label="Browse Catalog"
            description="View all available products · PHP service"
        />
        <NavCard
            to="/checkout"
            gradient="from-emerald-600 to-teal-600"
            shadow="shadow-emerald-500/25"
            icon={ShoppingCart}
            label="Checkout"
            description="Place an order · Django service"
        />
    </>
);

// ── Admin dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = ({ user }) => (
    <>
        <p className="text-slate-400 text-sm mb-6">
            You have admin access. Manage products and view all system data.
        </p>
        <NavCard
            to="/catalog"
            gradient="from-violet-600 to-fuchsia-600"
            shadow="shadow-violet-500/25"
            icon={Package}
            label="Manage Products"
            description="Create, edit, delete products · PHP service"
        />
        <NavCard
            to="/orders"
            gradient="from-amber-600 to-orange-600"
            shadow="shadow-amber-500/25"
            icon={ShoppingCart}
            label="All Orders"
            description="View every order placed · Django service"
        />
    </>
);

// ── Dashboard page ────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { user, isAdmin, logout } = useAuth();
    usePageTitle(isAdmin ? 'Admin Panel' : 'Dashboard');
    const location = useLocation();
    const forbidden = location.state?.forbidden;

    const roleColor   = isAdmin ? 'from-violet-400 to-fuchsia-400' : 'from-emerald-400 to-teal-400';
    const iconGradient = isAdmin ? 'from-violet-500 to-fuchsia-500' : 'from-emerald-400 to-teal-500';
    const iconShadow   = isAdmin ? 'shadow-violet-500/30' : 'shadow-emerald-500/30';

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className={`fixed top-[-15%] right-[-10%] w-[40%] h-[40%] ${isAdmin ? 'bg-violet-600/20' : 'bg-emerald-600/20'} rounded-full blur-[140px] pointer-events-none`} />
            <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr ${iconGradient} mb-4 shadow-lg ${iconShadow} text-white`}>
                    {isAdmin ? <Shield className="w-8 h-8" /> : <LayoutDashboard className="w-8 h-8" />}
                </div>

                <h1 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${roleColor} mb-2`}>
                    {isAdmin ? 'Admin Panel' : 'Dashboard'}
                </h1>

                {user && (
                    <div className="flex items-center justify-center gap-2 text-slate-300 text-sm mt-1 mb-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>
                            Logged in as{' '}
                            <span className={`font-semibold bg-clip-text text-transparent bg-gradient-to-r ${roleColor}`}>
                                {user.username}
                            </span>
                        </span>
                    </div>
                )}

                {/* Role badge */}
                <div className="flex justify-center mb-6">
                    <span className={`text-xs px-3 py-1 rounded-full border ${isAdmin ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                        {isAdmin ? 'ROLE_ADMIN' : 'ROLE_USER'}
                    </span>
                </div>

                {/* Forbidden notice (redirected from AdminRoute) */}
                {forbidden && (
                    <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 text-left">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        That page requires admin access.
                    </div>
                )}

                {isAdmin ? <AdminDashboard user={user} /> : <UserDashboard user={user} />}

                <button
                    onClick={logout}
                    className="w-full py-3 px-4 mt-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
