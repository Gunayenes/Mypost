import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Özellikler', href: '/ozellikler' },
  { label: 'Fiyatlandırma', href: '/fiyatlandirma' },
  { label: 'İletişim', href: '/iletisim' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/Logom.jpg" alt="KasaPlus" className="w-9 h-9 rounded-xl object-cover shadow-lg group-hover:shadow-primary-500/40 transition-shadow" />
            <span className="text-xl font-bold text-slate-900">
              Kasa<span className="text-primary-600">Plus</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.href
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/kayit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-violet-600 rounded-xl hover:from-primary-700 hover:to-violet-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
            >
              Ücretsiz Deneyin
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
            >
              Giriş Yap
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 -mr-2 text-slate-700"
            onClick={() => setOpen(!open)}
            aria-label="Menüyü aç"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 border-t border-slate-100' : 'max-h-0'
        }`}
      >
        <div className="bg-white px-4 py-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="block px-4 py-3 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
            <Link
              to="/kayit"
              className="block text-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-violet-600 rounded-xl"
            >
              Ücretsiz Deneyin
            </Link>
            <Link
              to="/login"
              className="block text-center px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
