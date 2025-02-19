import { format } from 'date-fns';
import { formatTND } from '../../utils/formatters';
import { Link } from 'react-router-dom';

function Overview({ bookings, listings, handleBookingClick }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Bookings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {bookings.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Active Listings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {listings.length}
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
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Today's Checkouts</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {bookings.filter(booking => {
              const endDate = new Date(booking.end_date)
              const today = new Date()
              return endDate.toDateString() === today.toDateString()
            }).length}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-[#1B4965]">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .map(booking => (
                  <tr 
                    key={booking.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleBookingClick(booking)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.profiles.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.accommodations.name}</div>
                      <div className="text-sm text-gray-500">{booking.accommodations.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.start_date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(booking.end_date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTND(booking.total_price)}
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
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-6">Today's Schedule</h3>
        <div className="space-y-4">
          {bookings
            .filter(booking => {
              const startDate = new Date(booking.start_date)
              const endDate = new Date(booking.end_date)
              const today = new Date()
              return (
                startDate.toDateString() === today.toDateString() ||
                endDate.toDateString() === today.toDateString()
              )
            })
            .map(booking => (
              <div
                key={booking.id}
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleBookingClick(booking)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      new Date(booking.start_date).toDateString() === new Date().toDateString()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {new Date(booking.start_date).toDateString() === new Date().toDateString()
                        ? 'Check-in'
                        : 'Check-out'
                      }
                    </span>
                    <span className="font-medium text-[#1B4965]">{booking.profiles.full_name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {booking.accommodations.name} - {booking.accommodations.location}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(booking.start_date), 'PP')} - {format(new Date(booking.end_date), 'PP')}
                </div>
              </div>
            ))}
          
          {bookings.filter(booking => {
            const startDate = new Date(booking.start_date)
            const endDate = new Date(booking.end_date)
            const today = new Date()
            return (
              startDate.toDateString() === today.toDateString() ||
              endDate.toDateString() === today.toDateString()
            )
          }).length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500">No check-ins or check-outs scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Overview; 