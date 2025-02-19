import { format } from 'date-fns';
import { formatTND } from '../../utils/formatters';
import { toast } from 'react-hot-toast';
import { supabase } from '../../config/supabase';
import { useState, useEffect } from 'react';
import BookingModal from './BookingModal';
import CashPaymentStatsModal from './CashPaymentStatsModal';

function Bookings({ bookings, onBookingClick }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cashPaymentUsers, setCashPaymentUsers] = useState({});
  const [selectedCashUser, setSelectedCashUser] = useState(null);
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

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const handleVerifyBooking = async (bookingId) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Booking verified successfully');
      if (onBookingClick) onBookingClick();
    } catch (error) {
      console.error('Error verifying booking:', error);
      toast.error('Failed to verify booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId);

        if (error) throw error;
        toast.success('Booking cancelled successfully');
        if (onBookingClick) onBookingClick();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleCashPayment = async (booking, e) => {
    e.stopPropagation(); // Prevent row click event
    const remainingAmount = booking.total_price - (booking.payed_amount || 0);
    
    const cashAmount = window.prompt(
      `Remaining amount: ${formatTND(remainingAmount)}\nEnter cash payment amount:`
    );

    if (cashAmount === null) return;
    
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > remainingAmount) {
      toast.error(`Amount cannot exceed the remaining balance of ${formatTND(remainingAmount)}`);
      return;
    }

    try {
      const newPayedAmount = (Number(booking.payed_amount) || 0) + amount;
      // get the current user
      const { data: currentUser } = await supabase.auth.getUser();
      console.log(currentUser)
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payed_amount_cash: (booking.payed_amount_cash || 0) + amount,
          payed_amount: newPayedAmount,
          updated_at: new Date().toISOString(),
          cash_payed_by: currentUser.user.id,
        })
        .eq('id', booking.id);

      if (error) throw error;
      toast.success(`Cash payment of ${formatTND(amount)} recorded successfully`);
    } catch (error) {
      console.error('Error recording cash payment:', error);
      toast.error('Failed to record cash payment');
    }
  };

  const handleUpdateBooking = async (bookingId, updatedData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update(updatedData)
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Booking updated successfully');
      if (onBookingClick) onBookingClick();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCashPaymentUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCashPaymentUsers(prev => ({ ...prev, [userId]: data.full_name }));
    } catch (error) {
      console.error('Error fetching cash payment user:', error);
    }
  };

  useEffect(() => {
    bookings.forEach(booking => {
      if (booking.cash_payed_by && !cashPaymentUsers[booking.cash_payed_by]) {
        fetchCashPaymentUser(booking.cash_payed_by);
      }
    });
  }, [bookings, cashPaymentUsers]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Bookings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Confirmed Bookings</h4>
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter(booking => booking.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Pending Bookings</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {bookings.filter(booking => booking.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              bookings
                .filter(booking => booking.status === 'confirmed')
                .reduce((acc, booking) => acc + booking.total_price, 0)
            )}
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.profiles.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.profiles.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.accommodations.name}</div>
                    <div className="text-sm text-gray-500">{booking.accommodations.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(booking.start_date), 'PP')} - {format(new Date(booking.end_date), 'PP')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatTND(booking.total_price)}</div>
                    {booking.payed_amount && (
                      <>
                        <div className="text-sm text-gray-500">
                          Paid: {formatTND(booking.payed_amount)}
                          {booking.payed_amount_cash > 0 && (
                            <span className="ml-1 text-xs">
                              (Cash: {formatTND(booking.payed_amount_cash)}
                              {booking.cash_payed_by && cashPaymentUsers[booking.cash_payed_by] && isAuthorized && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCashUser({
                                      id: booking.cash_payed_by,
                                      name: cashPaymentUsers[booking.cash_payed_by]
                                    });
                                  }}
                                  className="ml-1 text-blue-600 hover:underline"
                                >
                                  by {cashPaymentUsers[booking.cash_payed_by]}
                                </button>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Remaining: {formatTND(booking.total_price - booking.payed_amount)}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyBooking(booking.id);
                            }}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Verify
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelBooking(booking.id);
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.total_price - (booking.payed_amount || 0) > 0 && (
                        booking.status !== 'cancelled' && (
                          <button
                            onClick={(e) => handleCashPayment(booking, e)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Add Payment
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No bookings found</p>
        </div>
      )}

      {/* Add the BookingModal */}
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={handleUpdateBooking}
          isLoading={isLoading}
        />
      )}

      {/* Add the CashPaymentStatsModal */}
      {selectedCashUser && isAuthorized && (
        <CashPaymentStatsModal
          userId={selectedCashUser.id}
          userName={selectedCashUser.name}
          onClose={() => setSelectedCashUser(null)}
        />
      )}
    </div>
  );
}

export default Bookings; 