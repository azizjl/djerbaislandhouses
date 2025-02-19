import { format } from 'date-fns';
import { formatTND } from '../../utils/formatters';

function Transactions({ bookings }) {
  // Filter only confirmed bookings and sort by date
  const transactions = bookings
    .filter(booking => booking.status === 'confirmed')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalRevenue = transactions.reduce((sum, booking) => sum + booking.total_price, 0);
  const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{formatTND(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Transactions</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Average Transaction</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{formatTND(averageTransaction)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">#{transaction.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.profiles.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.profiles.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.accommodations.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.accommodations.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(transaction.created_at), 'PP')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(transaction.created_at), 'p')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTND(transaction.total_price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No transactions found</p>
        </div>
      )}
    </div>
  );
}

export default Transactions; 