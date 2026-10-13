import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCart, useAuth } from '@/lib/store';
import { Trash2 } from 'lucide-react';
import { trackEvent, trackMetaInitiateCheckout } from '@/lib/monitoring/events';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (items.length > 0) {
      const value = items.reduce((acc, item) => acc + item.price, 0);
      trackEvent('begin_checkout', {
        cart_size: items.length,
        value,
      });
      trackMetaInitiateCheckout({
        contentIds: items.map((item) => item.serviceId),
        contents: items.map((item) => ({
          id: item.serviceId,
          quantity: 1,
          item_price: item.price,
        })),
        value,
        numItems: items.length,
      });
    }
  }, [items]);

  const handleCheckout = () => {
    trackEvent('click_service_cta', { location: 'cart', target: 'proceed_to_checkout' });
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container py-24">
        <h1 className="sr-only">Shopping cart</h1>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <Button onClick={() => navigate('/services')}>Browse Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-24">
      <h1 className="sr-only">Your cart</h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{item.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.date} at {item.time}
                    </p>
                    <p className="text-sm">{item.address}</p>
                    {item.pricingSummary && (
                      <p className="text-xs text-muted-foreground mt-1">{item.pricingSummary}</p>
                    )}
                    {item.pricingMetadata && (
                      <ul className="text-xs text-muted-foreground mt-1 list-disc pl-4 space-y-0.5">
                        {item.pricingMetadata.quantity != null && (
                          <li>Units: {item.pricingMetadata.quantity}</li>
                        )}
                        {item.pricingMetadata.sqft != null && (
                          <li>Area: {item.pricingMetadata.sqft} sq.ft</li>
                        )}
                        {item.pricingMetadata.kw != null && (
                          <li>Capacity: {item.pricingMetadata.kw} KW</li>
                        )}
                        {(item.pricingMetadata.tankType != null ||
                          item.pricingMetadata.capacityLiters != null) && (
                          <li>
                            Tank: {item.pricingMetadata.tankType ?? '—'}
                            {item.pricingMetadata.capacityLiters != null
                              ? `, ${item.pricingMetadata.capacityLiters} L`
                              : ''}
                            {item.pricingMetadata.waterTankBlocks10000 != null
                              ? ` (${item.pricingMetadata.waterTankBlocks10000} × ₹1499 blocks)`
                              : ''}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">₹{item.price}</p>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        trackEvent('remove_from_cart', {
                          service_id: item.serviceId,
                          service_name: item.serviceName,
                          value: item.price,
                        });
                        removeItem(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-sm text-muted-foreground">
                    {items.length} items
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  ₹{items.reduce((acc, item) => acc + item.price, 0)}
                </p>
              </div>

              {user ? (
                <Button className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">Proceed to Checkout</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sign in Required</DialogTitle>
                      <DialogDescription>
                        Please sign in to complete your booking
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => navigate('/signin')}>
                        Sign In
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
