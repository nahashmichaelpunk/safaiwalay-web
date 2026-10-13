import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'

/** Payload Razorpay passes to the checkout `handler` after a successful payment. */
interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayPaymentFailure {
  error?: { code?: string; description?: string; reason?: string }
}

interface RazorpayOptions {
  key: string | undefined
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  handler: (response: RazorpayPaymentResponse) => Promise<void>
  prefill: { email?: string }
  theme: { color: string }
}

interface RazorpayInstance {
  open: () => void
  on: (event: 'payment.failed', callback: (response: RazorpayPaymentFailure) => void) => void
}

interface RazorpayCheckoutProps {
  amount: number
  bookingId: string
  onSuccess: (data: RazorpayPaymentResponse & { booking_id: string }) => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

function mapFriendlyEdgeMessage(raw: string): string {
  const trimmed = raw.trim()
  if (
    trimmed.includes('Amount mismatch for booking total') ||
    trimmed.includes('Payment amount mismatch for booking total')
  ) {
    return 'Payment amount does not match your booking. Refresh the page or try again.'
  }
  if (trimmed === 'Booking not found') return 'Booking not found. Please start checkout again.'
  if (trimmed === 'Forbidden booking access') return 'You can only pay for your own bookings.'
  if (trimmed === 'Booking is already paid') return 'This booking is already paid.'
  if (trimmed === 'Order does not match booking') return 'Payment session expired. Please try paying again.'
  if (trimmed === 'Payment record not found') return 'Payment could not be verified. Please contact support.'
  return trimmed
}

async function parseEdgeFunctionError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as { message: string; context?: { body?: ReadableStream } }
    const body = e.context?.body
    if (body && typeof body.getReader === 'function') {
      try {
        const reader = body.getReader()
        const { value } = await reader.read()
        const errorText = new TextDecoder().decode(value)
        const parsed = JSON.parse(errorText) as { error?: string }
        if (parsed.error) return mapFriendlyEdgeMessage(String(parsed.error))
      } catch {
        /* fall through */
      }
    }
    return mapFriendlyEdgeMessage(e.message)
  }
  return 'Something went wrong. Please try again.'
}

export default function RazorpayCheckout({ amount, bookingId, onSuccess, onError }: RazorpayCheckoutProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      if (window.Razorpay) {
        logger.debug('Razorpay loaded')
      }
    }
    script.onerror = () => logger.error('Razorpay failed to load')
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async () => {
    try {
      setIsSubmitting(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const amountRupees = Number(amount)
      if (isNaN(amountRupees) || amountRupees <= 0) {
        throw new Error('Invalid amount: must be a positive number')
      }
      const amountInPaise = Math.round(amountRupees * 100)
      if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
        throw new Error('Invalid amount after conversion')
      }

      const response = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount: amountRupees,
          booking_id: bookingId,
        },
      })

      if (response.error) {
        const msg = await parseEdgeFunctionError(response.error)
        throw new Error(msg)
      }

      const { data } = response
      if (!data?.order_id) throw new Error('No order ID received')

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: 'INR',
        order_id: data.order_id,
        name: 'Safaiwala',
        description: 'Cleaning Service Booking',
        handler: async function (razorpayResponse: RazorpayPaymentResponse) {
          const { error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
            body: {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
              booking_id: bookingId,
            },
          })

          if (verifyError) {
            const msg = await parseEdgeFunctionError(verifyError)
            console.error('Verification failed:', verifyError)
            toast({
              variant: 'destructive',
              title: 'Payment Verification Failed',
              description: msg,
            })
            onError(msg)
            return
          }

          toast({
            title: 'Payment Successful',
            description: 'Your booking has been confirmed.',
          })
          onSuccess({ ...razorpayResponse, booking_id: bookingId })
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#0f172a',
        },
      }

      if (!window.Razorpay) throw new Error('Payment gateway failed to load. Please refresh and try again.')
      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', function (failResponse) {
        console.error('Payment failed:', failResponse.error)
      })

      setIsSubmitting(false)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      const message =
        error instanceof Error ? error.message : await parseEdgeFunctionError(error)
      const friendly = mapFriendlyEdgeMessage(message)
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: friendly,
      })
      onError(friendly)
      setIsSubmitting(false)
    }
  }

  return (
    <Button onClick={handlePayment} className="w-full" disabled={isSubmitting}>
      {isSubmitting ? 'Processing…' : `Pay ₹${amount}`}
    </Button>
  )
}
