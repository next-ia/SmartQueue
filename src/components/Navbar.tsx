"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Home, Shield, HelpCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const isActive = (path: string) => pathname === path;

  const handleDashboardAccess = () => {
    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1122') {
      setShowPinModal(false);
      console.log('Navigation vers /dashboard-secretaire (PIN valide)');
      router.push('/dashboard-secretaire');
    } else {
      setPinError('Code PIN incorrect');
      setPin('');
    }
  };

  const navLinks = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '#', label: 'Dashboard', icon: Shield, onClick: handleDashboardAccess },
    { href: '#', label: 'Aide/Contact', icon: HelpCircle, onClick: () => alert('Contact: support@smartqueue.ma') },
  ];

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">SmartQueue</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                    link.href !== '#'
                      ? isActive(link.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    link.onClick?.();
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition ${
                    link.href !== '#'
                      ? isActive(link.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <link.icon className="w-5 h-5 mr-3" />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* PIN Modal for Dashboard */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="text-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full inline-flex mb-3">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Accès Dashboard</h3>
              <p className="text-sm text-gray-500">Entrez le code PIN pour accéder</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Code PIN (1122)"
                maxLength={4}
                className="w-full px-4 py-3 text-center text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tracking-widest"
                autoFocus
              />
              {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
