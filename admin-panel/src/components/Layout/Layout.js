import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NavbarMenu, NavbarMenuItem } from '../NavbarMenu';
import {
  Home,
  Package,
  FolderOpen,
  User,
  LogOut,
  Menu,
  X,
  Code,
  Image,
  Users
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Categories', href: '/categories', icon: FolderOpen },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Hero Image', href: '/hero', icon: Image },
    { name: 'Collection Section', href: '/collection', icon: FolderOpen },
    { name: 'API Testing', href: '/api-test', icon: Code },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-900">
              Aphrodite Admin
            </h1>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 transition-colors ${
                      isActive(item.href)
                        ? 'text-primary-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Account
            </div>
            <Link
              to="/profile"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <User className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Sign out
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            {/* Animated Navbar Menu */}
            <div className="hidden lg:flex">
              <NavbarMenu className="mx-auto">
                <NavbarMenuItem href="/" isActive={location.pathname === '/'}>
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </NavbarMenuItem>
                <NavbarMenuItem href="/products" isActive={location.pathname.startsWith('/products')}>
                  <Package className="h-4 w-4 mr-1" />
                  Products
                </NavbarMenuItem>
                <NavbarMenuItem href="/categories" isActive={location.pathname.startsWith('/categories')}>
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Categories
                </NavbarMenuItem>
                <NavbarMenuItem href="/api-test" isActive={location.pathname.startsWith('/api-test')}>
                  <Code className="h-4 w-4 mr-1" />
                  API Testing
                </NavbarMenuItem>
              </NavbarMenu>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome back, <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;