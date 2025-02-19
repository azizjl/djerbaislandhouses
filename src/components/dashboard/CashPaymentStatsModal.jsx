import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { formatTND } from '../../utils/formatters';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

function CashPaymentStatsModal({ userId, userName, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setCurrentUser({ ...user, ...profile });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    fetchUserCashPayments();
  }, [userId]);

  const fetchUserCashPayments = async () => {
    try {
      // First fetch the bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('cash_payed_by', userId)
        .not('payed_amount_cash', 'is', null);

      if (bookingsError) throw bookingsError;

      // For each booking with a collector, fetch the collector's profile
      const bookingsWithCollectors = await Promise.all(
        bookingsData.map(async (booking) => {
          if (booking.collected_by) {
            const { data: collectorData, error: collectorError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', booking.collected_by)
              .single();

            if (collectorError) {
              console.error('Error fetching collector:', collectorError);
              return booking;
            }

            return {
              ...booking,
              collector: collectorData
            };
          }
          return booking;
        })
      );

      setBookings(bookingsWithCollectors);
    } catch (error) {
      console.error('Error fetching cash payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalAmount = (bookings) => {
    return bookings.reduce((sum, booking) => sum + (booking.payed_amount_cash || 0), 0);
  };

  const getFilteredBookings = (startDate, endDate) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.updated_at);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  };

  const now = new Date();
  const weekBookings = getFilteredBookings(startOfWeek(now), endOfWeek(now));
  const monthBookings = getFilteredBookings(startOfMonth(now), endOfMonth(now));

  const handleCollect = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ has_collected_cash: true, collected_by: currentUser.id })
        .eq('id', bookingId);

      if (error) throw error;
      
      // Update local state to reflect the change
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, has_collected_cash: true, collected_by: currentUser.id }
          : booking
      ));
    } catch (error) {
      console.error('Error updating collection status:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cash Payments - {userName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">Total Collections</h3>
                <p className="text-xl font-bold">{formatTND(getTotalAmount(bookings))}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">This Week</h3>
                <p className="text-xl font-bold">{formatTND(getTotalAmount(weekBookings))}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">This Month</h3>
                <p className="text-xl font-bold">{formatTND(getTotalAmount(monthBookings))}</p>
              </div>
            </div> */}

            {/* Transactions List */}
            <div className="border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(booking.updated_at), 'PP')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {booking.guest_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatTND(booking.payed_amount_cash)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {booking.has_collected_cash ? (
                          <span className="text-green-600 font-medium">
                            Collected by {booking.collector?.full_name || 'Unknown'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCollect(booking.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CashPaymentStatsModal; 