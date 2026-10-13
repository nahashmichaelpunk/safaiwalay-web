import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  booking: {
    service: {
      name: string;
    };
  };
}

interface ReviewResponse {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  } | null;
  booking: {
    service: {
      name: string;
    } | null;
  } | null;
}

export default function BusinessReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user:user_id (
            first_name,
            last_name
          ),
          booking:booking_id (
            service:service_id (
              name
            )
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      const processedReviews = ((data || []) as unknown as ReviewResponse[]).map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user: {
          first_name: review.user?.first_name || 'Anonymous',
          last_name: review.user?.last_name || ''
        },
        booking: {
          service: {
            name: review.booking?.service?.name || 'Service'
          }
        }
      }));

      // Separate the three most recent reviews
      const recentReviews = processedReviews.slice(0, 3);
      const otherReviews = processedReviews.slice(3);

      // Combine them: recent reviews first, then others
      setReviews([...recentReviews, ...otherReviews]);

    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Customer Reviews
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            See what our customers are saying about our services
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {reviews.length === 0 ? (
            <div className="text-center text-gray-500">
              No reviews yet. Be the first to leave a review!
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white shadow rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {review.user.first_name?.[0] || 'A'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {review.user.first_name} {review.user.last_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {review.booking.service.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-600">{review.comment}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified Customer
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 