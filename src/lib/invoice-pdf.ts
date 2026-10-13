import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { BRAND_LOGO_SRC } from '@/lib/branding';
import { parseBookingPayableRupees } from '@/lib/pricing';
import { formatBookingDateTimeForDisplay, formatCreatedAtLabel } from '@/lib/safe-dates';

type InvoiceBooking = {
  id: string;
  created_at: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  address: string;
  price: string;
  total_amount?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
};

type InvoiceOptions = {
  pricingSummaryLine?: string | null;
};

let cachedLogoDataUrl: string | null = null;

async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const response = await fetch(BRAND_LOGO_SRC);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read logo blob'));
      reader.readAsDataURL(blob);
    });
    cachedLogoDataUrl = dataUrl || null;
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

export async function downloadBookingInvoice(
  booking: InvoiceBooking,
  options?: InvoiceOptions
) {
  try {
    const doc = new jsPDF();
    const logoDataUrl = await loadLogoDataUrl();

    doc.setTextColor(15, 23, 42);
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 20, 12, 30, 15);
      doc.setFontSize(20);
      doc.text('SafaiWalay', 55, 22);
    } else {
      doc.setFontSize(20);
      doc.text('SafaiWalay', 20, 20);
    }

    doc.setFontSize(12);
    doc.text('Invoice', 20, 32);

    doc.setFontSize(10);
    doc.text(`Invoice No: INV-${booking.id.substring(0, 8)}`, 20, 45);
    doc.text(`Created: ${formatCreatedAtLabel(booking.created_at)}`, 20, 50);
    doc.text(`Payment ID: ${booking.razorpay_payment_id || 'N/A'}`, 20, 55);
    doc.text(`Order ID: ${booking.razorpay_order_id || 'N/A'}`, 20, 60);

    const { dateLabel, timeLabel } = formatBookingDateTimeForDisplay(
      booking.booking_date,
      booking.booking_time
    );
    doc.text('Service Details', 20, 72);
    doc.text(`Service: ${booking.service_name}`, 20, 80);
    doc.text(`Date: ${dateLabel}`, 20, 85);
    doc.text(`Time: ${timeLabel}`, 20, 90);
    doc.text(`Address: ${booking.address}`, 20, 95);

    let tableStartY = 105;
    if (options?.pricingSummaryLine) {
      doc.text(`Booking details: ${options.pricingSummaryLine}`, 20, 102);
      tableStartY = 110;
    }

    const totalAmount = parseBookingPayableRupees(booking);
    const baseAmount = parseFloat(booking.price) || 0;
    const platformFee = Math.max(0, totalAmount - baseAmount);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Amount (INR)']],
      body: [
        ['Service Charge', baseAmount.toFixed(2)],
        ['Platform Fee', platformFee.toFixed(2)],
        ['Total Amount', totalAmount.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
    doc.text('Thank you for choosing SafaiWalay.', 20, finalY + 12);
    doc.text('For help, contact support@safaiwalay.com', 20, finalY + 18);

    doc.save(`SafaiWalay_Invoice_${booking.id.substring(0, 8)}.pdf`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not generate invoice PDF';
    throw new Error(message);
  }
}
