import { useState } from 'react';
import { formatTND } from '../../utils/formatters';

function Rapport({ rapportData }) {
  const [timeframe, setTimeframe] = useState('month'); // month, quarter, year

  const getFilteredData = () => {
    // In a real app, this would filter based on timeframe
    return rapportData;
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#1B4965]">Performance Report</h2>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-[#1B4965] focus:border-[#1B4965]"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(filteredData.revenue)}
          </p>
          <p className={`text-sm ${
            filteredData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {filteredData.revenueGrowth >= 0 ? '+' : ''}{filteredData.revenueGrowth}% from last period
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Bookings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {filteredData.bookings}
          </p>
          <p className={`text-sm ${
            filteredData.bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {filteredData.bookingsGrowth >= 0 ? '+' : ''}{filteredData.bookingsGrowth}% from last period
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Occupancy Rate</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {filteredData.occupancyRate}%
          </p>
          <p className={`text-sm ${
            filteredData.occupancyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {filteredData.occupancyGrowth >= 0 ? '+' : ''}{filteredData.occupancyGrowth}% from last period
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Average Daily Rate</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(filteredData.averageDailyRate)}
          </p>
          <p className={`text-sm ${
            filteredData.adrGrowth >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {filteredData.adrGrowth >= 0 ? '+' : ''}{filteredData.adrGrowth}% from last period
          </p>
        </div>
      </div>

      {/* Property Performance */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Property Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ADR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.properties?.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{property.name}</div>
                    <div className="text-sm text-gray-500">{property.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatTND(property.revenue)}</div>
                    <div className={`text-xs ${
                      property.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {property.revenueGrowth >= 0 ? '+' : ''}{property.revenueGrowth}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.bookings}</div>
                    <div className={`text-xs ${
                      property.bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {property.bookingsGrowth >= 0 ? '+' : ''}{property.bookingsGrowth}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{property.occupancyRate}%</div>
                    <div className={`text-xs ${
                      property.occupancyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {property.occupancyGrowth >= 0 ? '+' : ''}{property.occupancyGrowth}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatTND(property.adr)}</div>
                    <div className={`text-xs ${
                      property.adrGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {property.adrGrowth >= 0 ? '+' : ''}{property.adrGrowth}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Rapport; 