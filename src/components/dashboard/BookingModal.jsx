import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { formatTND } from '../../utils/formatters';
import { supabase } from '../../config/supabase';
import { toast } from 'react-hot-toast';

function BookingModal({ booking, onClose, onUpdate, isLoading }) {
  const [formData, setFormData] = useState({
    start_date: booking.start_date,
    end_date: booking.end_date,
    total_price: booking.total_price,
    status: booking.status,
    notes: booking.notes || ''
  });
  const [existingBookings, setExistingBookings] = useState([]);
  const [houseData, setHouseData] = useState(null);

  // Fetch house data and existing bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch house data with monthly prices
        const { data: house, error: houseError } = await supabase
          .from('accommodations')
          .select(`
            *,
            prices (
              month,
              price_per_day
            )
          `)
          .eq('id', booking.accommodation_id)
          .single();

        if (houseError) throw houseError;
        
        // Transform monthly prices
        const monthlyPrices = house.prices?.map(p => ({
          month: parseInt(p.month),
          price: p.price_per_day
        })) || [];
        
        setHouseData({ ...house, monthly_prices: monthlyPrices });

        // Fetch existing bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('start_date, end_date')
          .eq('accommodation_id', booking.accommodation_id)
          .in('status', ['confirmed', 'pending'])
          .neq('id', booking.id); // Exclude current booking

        if (bookingsError) throw bookingsError;
        setExistingBookings(bookings);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load booking data');
      }
    };

    fetchData();
  }, [booking.accommodation_id, booking.id]);

  const calculateTotalPrice = (startDate, endDate) => {
    if (!houseData) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = new Date(start);
    let totalAmount = 0;

    while (currentDate <= end) {
      const month = currentDate.getMonth() + 1; // Get current month (1-12)
      const monthlyPrice = houseData.monthly_prices.find(p => p.month === month)?.price || houseData.price_per_night;
      totalAmount += monthlyPrice;
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalAmount;
  };

  const isDateAvailable = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return !existingBookings.some(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      return (
        (start <= bookingEnd && start >= bookingStart) ||
        (end <= bookingEnd && end >= bookingStart) ||
        (start <= bookingStart && end >= bookingEnd)
      );
    });
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // If changing dates, check availability and recalculate price
    if (name === 'start_date' || name === 'end_date') {
      const newDates = {
        start_date: name === 'start_date' ? value : formData.start_date,
        end_date: name === 'end_date' ? value : formData.end_date
      };

      // Only proceed if both dates are valid
      if (newDates.start_date && newDates.end_date) {
        // Check if the new dates are available
        if (!isDateAvailable(newDates.start_date, newDates.end_date)) {
          toast.error('These dates are not available');
          return;
        }

        // Calculate new total price
        const newTotalPrice = calculateTotalPrice(newDates.start_date, newDates.end_date);

        setFormData(prev => ({
          ...prev,
          [name]: value,
          total_price: newTotalPrice
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(booking.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black/25 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Booking</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Price</label>
            <input
              type="number"
              name="total_price"
              value={formData.total_price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal; 