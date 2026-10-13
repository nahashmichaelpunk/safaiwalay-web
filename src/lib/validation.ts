import { z } from 'zod';

export const bookingSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  price: z.string().regex(/^₹\d+$/, "Invalid price format"),
  date: z.string().refine(date => {
    const selected = new Date(date);
    const now = new Date();
    return selected > now;
  }, "Cannot book for past dates"),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
});

export type BookingFormData = z.infer<typeof bookingSchema>;