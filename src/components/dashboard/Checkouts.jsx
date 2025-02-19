import { format } from 'date-fns';
import { formatTND } from '../../utils/formatters';
import { useState } from 'react';

function Checkouts({ bookings, onBookingClick }) {
  // Add state for date filter
  const [daysFilter, setDaysFilter] = useState(7);

  // Get today's checkouts
  const today = new Date();
  const checkouts = bookings
    .filter(booking => {
      const endDate = new Date(booking.end_date);
      return endDate.toDateString() === today.toDateString();
    })
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

  // Update upcoming checkouts filter
  const upcomingCheckouts = bookings
    .filter(booking => {
      const endDate = new Date(booking.end_date);
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= daysFilter;
    })
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Today's Checkouts</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{checkouts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Upcoming Checkouts (7 days)</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{upcomingCheckouts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              [...checkouts, ...upcomingCheckouts].reduce((sum, booking) => sum + booking.total_price, 0)
            )}
          </p>
        </div>
      </div>

      {/* Today's Checkouts */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Checkouts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {checkouts.map((booking) => (
            <div
              key={booking.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => onBookingClick(booking)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-[#1B4965] flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {booking.profiles.full_name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {booking.profiles.full_name}
                    </h4>
                    <p className="text-sm text-gray-500">{booking.profiles.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Checkout at {format(new Date(booking.end_date), 'p')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.accommodations.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {checkouts.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No checkouts scheduled for today
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Checkouts */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Checkouts</h3>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-[#1B4965] focus:ring-[#1B4965] text-sm"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
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
                  Checkout Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {upcomingCheckouts.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onBookingClick(booking)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.profiles.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.profiles.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.accommodations.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.accommodations.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(booking.end_date), 'PP')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(booking.end_date), 'p')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.ceil(
                      (new Date(booking.end_date) - new Date(booking.start_date)) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    nights
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatTND(booking.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {upcomingCheckouts.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No upcoming checkouts in the next 7 days
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkouts; 