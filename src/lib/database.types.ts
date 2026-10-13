export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone_number: string | null
          shipping_address: string | null
          latitude: number | null
          longitude: number | null
          user_role: 'user' | 'admin' | 'cleaning_partner'
          profile_image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          shipping_address?: string | null
          latitude?: number | null
          longitude?: number | null
          user_role?: 'user' | 'admin' | 'cleaning_partner'
          profile_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          shipping_address?: string | null
          latitude?: number | null
          longitude?: number | null
          user_role?: 'user' | 'admin' | 'cleaning_partner'
          profile_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          price_description: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          price_description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          price_description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          service_id: string
          service_name: string
          booking_date: string
          booking_time: string
          address: string
          price: string
          customer_name: string
          customer_email: string
          customer_phone: string
          location_lat: string
          location_lng: string
          status: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | ''
          razorpay_payment_id: string | null
          razorpay_order_id: string | null
          created_at: string | null
          updated_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          payment_status: 'paid' | 'partial' | 'pending' | ''
          cancellation_reason: string | null
          advance_amount: string | null
          assigned_partner_id: string | null
          service_address: string | null
          time_slot: string | null
          total_amount: string | null
          remaining_amount: string | null
          payment_type: 'advance' | 'pay_later' | 'full'
          special_instructions: string | null
          payment_method: 'razorpay' | 'cash' | 'cod' | ''
          quantity_value: number | null
          quantity_unit: string | null
          metadata: Record<string, unknown> | null
          tank_material: string | null
          vehicle_tier: string | null
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          service_name: string
          booking_date: string
          booking_time: string
          address: string
          price: string
          customer_name: string
          customer_email: string
          customer_phone: string
          location_lat: string
          location_lng: string
          status?: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | ''
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          payment_status?: 'paid' | 'partial' | 'pending' | ''
          cancellation_reason?: string | null
          advance_amount?: string | null
          assigned_partner_id?: string | null
          service_address?: string | null
          time_slot?: string | null
          total_amount?: string | null
          remaining_amount?: string | null
          payment_type?: 'advance' | 'pay_later' | 'full'
          special_instructions?: string | null
          payment_method?: 'razorpay' | 'cash' | 'cod' | ''
          quantity_value?: number | null
          quantity_unit?: string | null
          metadata?: Record<string, unknown> | null
          tank_material?: string | null
          vehicle_tier?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          service_name?: string
          booking_date?: string
          booking_time?: string
          address?: string
          price?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          location_lat?: string
          location_lng?: string
          status?: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | ''
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          payment_status?: 'paid' | 'partial' | 'pending' | ''
          cancellation_reason?: string | null
          advance_amount?: string | null
          assigned_partner_id?: string | null
          service_address?: string | null
          time_slot?: string | null
          total_amount?: string | null
          remaining_amount?: string | null
          payment_type?: 'advance' | 'pay_later' | 'full'
          special_instructions?: string | null
          payment_method?: 'razorpay' | 'cash' | 'cod' | ''
          quantity_value?: number | null
          quantity_unit?: string | null
          metadata?: Record<string, unknown> | null
          tank_material?: string | null
          vehicle_tier?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          booking_id: string
          rating: number
          comment: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_id: string
          rating: number
          comment: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: string
          rating?: number
          comment?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
