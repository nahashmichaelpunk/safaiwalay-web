// Add or update the BookingFormData interface to include platform_fee
export interface BookingFormData {
  serviceName: string;
  serviceId: string;
  date: string;
  time: string;
  address: string;
  price: string;
  name: string;
  email: string;
  phone: string;
  basePrice?: number;
  platformFee?: number;
}

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
          first_name: string
          last_name: string
          phone_number: string | null
          shipping_address: string | null
          profile_image: string | null
          user_role: 'user' | 'admin' | 'cleaning_partner'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone_number?: string | null
          shipping_address?: string | null
          profile_image?: string | null
          user_role?: 'user' | 'admin' | 'cleaning_partner'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone_number?: string | null
          shipping_address?: string | null
          profile_image?: string | null
          user_role?: 'user' | 'admin' | 'cleaning_partner'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image: string | null
          duration_minutes: number
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image?: string | null
          duration_minutes: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image?: string | null
          duration_minutes?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          service_id: string
          booking_date: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          booking_date: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          booking_date?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          amount: number
          payment_method: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          amount: number
          payment_method: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          amount?: number
          payment_method?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          rating: number
          comment: string
          is_published: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          rating: number
          comment: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          rating?: number
          comment?: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_bookings: number
          total_revenue: number
          total_reviews: number
          recent_bookings: Json
          recent_payments: Json
        }
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone_number: string
          user_role: string
          created_at: string
        }
      }
      get_all_bookings: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          service_id: string
          booking_date: string
          status: string
          amount: number
          created_at: string
        }
      }
      get_all_payments: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          booking_id: string
          user_id: string
          amount: number
          payment_method: string
          status: string
          created_at: string
        }
      }
      get_all_reviews: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          booking_id: string
          user_id: string
          rating: number
          comment: string
          is_published: boolean
          created_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 