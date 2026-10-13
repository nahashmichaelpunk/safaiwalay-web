import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShoppingCart, User } from 'lucide-react';
import { useCart, useAuth } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, supabase } from '@/lib/supabase';
import { BRAND_LOGO_SRC } from '@/lib/branding';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const cartItems = useCart((state) => state.items);
  const { user } = useAuth();
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCleanerRoute = location.pathname.startsWith('/cleaner');

  const handleLogoClick = () => {
    if (user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'cleaning_partner':
          navigate('/cleaner/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      if (isAdminRoute) {
        navigate('/admin_login');
      } else if (isCleanerRoute) {
        navigate('/cleaner/login');
      } else {
        navigate('/');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // The signOut function now handles the redirect
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload as fallback
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const fetchActiveBookingsCount = async () => {
      if (!user || user.role !== 'user' || isAdminRoute || isCleanerRoute) {
        setActiveBookingsCount(0);
        return;
      }
      try {
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('status', 'eq', 'completed')
          .not('status', 'eq', 'cancelled');
        setActiveBookingsCount(count ?? 0);
      } catch (error) {
        console.error('Failed to fetch active bookings count:', error);
        setActiveBookingsCount(0);
      }
    };

    fetchActiveBookingsCount();
  }, [user?.id, user?.role, isAdminRoute, isCleanerRoute]);

  // Only show these navigation items for regular users
  const navigation =
    !isAdminRoute && !isCleanerRoute
      ? [
          { name: 'Services', href: '/services' },
          { name: 'Areas', href: '/areas' },
          { name: 'Blog', href: '/blog' },
          { name: 'Reviews', href: '/testimonials' },
          { name: 'About', href: '/about' },
          { name: 'Contact', href: '/contact' },
        ]
      : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] w-full h-16 flex items-center justify-between">
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            src={BRAND_LOGO_SRC}
            alt="SafaiWalay logo"
            className="h-9 w-auto max-w-[140px] object-contain"
            width={140}
            height={36}
          />
          <span className="text-xl font-bold font-brand tracking-tight text-foreground">
            SafaiWalay
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
          {user?.role === 'user' && !isAdminRoute && !isCleanerRoute && (
            <Link to="/bookings" className="relative text-sm font-medium transition-colors hover:text-primary">
              My Bookings
              {activeBookingsCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-6 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
                >
                  {activeBookingsCount}
                </Badge>
              )}
            </Link>
          )}
          {!isAdminRoute && !isCleanerRoute && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isAdminRoute && !isCleanerRoute && (
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isAdminRoute &&
            !isCleanerRoute && (
              <Link to="/signin">
                <Button variant="default">Sign In</Button>
              </Link>
            )
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-4 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user?.role === 'user' && !isAdminRoute && !isCleanerRoute && (
                <Link
                  to="/bookings"
                  className="flex items-center space-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  <span>My Bookings</span>
                  {activeBookingsCount > 0 && (
                    <Badge variant="destructive">{activeBookingsCount}</Badge>
                  )}
                </Link>
              )}
              {!isAdminRoute && !isCleanerRoute && (
                <Link
                  to="/cart"
                  className="flex items-center space-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Cart</span>
                  {cartItems.length > 0 && (
                    <Badge variant="destructive">{cartItems.length}</Badge>
                  )}
                </Link>
              )}
              {user ? (
                <>
                  {!isAdminRoute && !isCleanerRoute && (
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                  )}
                  <Button onClick={handleLogout}>Logout</Button>
                </>
              ) : (
                !isAdminRoute &&
                !isCleanerRoute && (
                  <Link to="/signin" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
