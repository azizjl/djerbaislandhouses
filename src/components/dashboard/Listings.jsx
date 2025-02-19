import { Link } from 'react-router-dom';
import { formatTND } from '../../utils/formatters';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../config/supabase';

function Listings({ listings, bookings, onDeleteListing }) {
  const [listingView, setListingView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const isAvailableToday = (listingId, bookings) => {
    const today = new Date();
    return !bookings.some(booking => 
      booking.accommodation_id === listingId &&
      new Date(booking.start_date) <= today &&
      new Date(booking.end_date) >= today &&
      booking.status === 'confirmed'
    );
  };

  // Add booking management functions
  const handleVerifyBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Booking confirmed successfully');
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Booking cancelled successfully');
      setIsBookingModalOpen(false);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleCashPayment = async (booking) => {
    const remainingAmount = booking.total_price - (booking.payed_amount || 0);
    
    // Prompt for cash payment amount
    const cashAmount = window.prompt(
      `Remaining amount: ${formatTND(remainingAmount)}\nEnter cash payment amount:`
    );

    // Validate input
    if (cashAmount === null) return; // User cancelled
    
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
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payed_amount_cash: (booking.payed_amount_cash || 0) + amount,
          payed_amount: newPayedAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;
      toast.success(`Cash payment of ${formatTND(amount)} recorded successfully`);
    } catch (error) {
      console.error('Error recording cash payment:', error);
      toast.error('Failed to record cash payment');
    }
  };

  // Add sorting function
  const sortListings = (listings) => {
    return [...listings].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return (b.prices?.[0]?.price_per_day || 0) - (a.prices?.[0]?.price_per_day || 0);
        case 'location':
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });
  };

  // Add filtering function
  const filterListings = (listings) => {
    return listings.filter(listing => {
      const matchesSearch = 
        listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'available' && isAvailableToday(listing.id, bookings)) ||
        (filterStatus === 'occupied' && !isAvailableToday(listing.id, bookings));

      return matchesSearch && matchesStatus;
    });
  };

  // Add delete confirmation
  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      try {
        // Delete images from storage first
        const { data: images } = await supabase
          .from('images')
          .select('url')
          .eq('accommodation_id', listingId);

        if (images) {
          for (const image of images) {
            const path = image.url.split('/').pop();
            await supabase.storage.from('accommodations').remove([path]);
          }
        }

        // Delete the listing and related data
        await onDeleteListing(listingId);
        toast.success('Listing deleted successfully');
      } catch (error) {
        console.error('Error deleting listing:', error);
        toast.error('Failed to delete listing');
      }
    }
  };

  // Filter and sort listings
  const displayedListings = filterListings(sortListings(listings));

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Sort Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4965]"
            />
          </div>
          
          {/* Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4965]"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4965]"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="location">Sort by Location</option>
          </select>
        </div>
      </div>

      {/* View Toggle and Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* View Toggle Buttons */}
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setListingView('grid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                listingView === 'grid'
                  ? 'bg-[#1B4965] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setListingView('table')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                listingView === 'table'
                  ? 'bg-[#1B4965] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add Listing Button */}
        <Link
          to="/add-listing"
          className="px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New Listing</span>
        </Link>
      </div>

      {/* Listing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Listings</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{listings.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Available Now</h4>
          <p className="text-2xl font-bold text-green-600">
            {listings.filter(listing => isAvailableToday(listing.id, bookings)).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Average Daily Rate</h4>
          <p className="text-2xl font-bold text-[#1B4965]">
            {formatTND(
              listings.reduce((acc, listing) => 
                acc + ((listing.prices && listing.prices[0]?.price_per_day) || 0), 
                0
              ) / (listings.length || 1)
            )}
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

      {/* Listings Content */}
      {listingView === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Listing Image */}
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={(listing.images && listing.images[0]?.url) || '/placeholder-property.jpg'}
                  alt={listing.name}
                  className="object-cover w-full h-48"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAvailableToday(listing.id, bookings)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isAvailableToday(listing.id, bookings) ? 'Available' : 'Occupied'}
                  </span>
                </div>
              </div>

              {/* Listing Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B4965] mb-1">
                      {listing.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{listing.location}</p>
                  </div>
                  <p className="text-lg font-bold text-[#1B4965]">
                    {formatTND((listing.prices && listing.prices[0]?.price_per_day) || 0)}
                    <span className="text-sm text-gray-500">/night</span>
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="font-semibold text-[#1B4965]">{listing.bedrooms || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="font-semibold text-[#1B4965]">{listing.bathrooms || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-semibold text-[#1B4965]">{listing.guests || 0}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="flex-1 px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price/Night
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={(listing.images && listing.images[0]?.url) || '/placeholder-property.jpg'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#1B4965]">
                            {listing.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{listing.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#1B4965]">
                        {formatTND((listing.prices && listing.prices[0]?.price_per_day) || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isAvailableToday(listing.id, bookings)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isAvailableToday(listing.id, bookings) ? 'Available' : 'Occupied'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="font-medium">{listing.bedrooms}</span> beds
                        </div>
                        <div>
                          <span className="font-medium">{listing.bathrooms}</span> baths
                        </div>
                        <div>
                          <span className="font-medium">{listing.guests}</span> guests
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/edit-listing/${listing.id}`}
                          className="text-[#1B4965] hover:text-[#62B6CB]"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {displayedListings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No listings found</p>
          <Link
            to="/add-listing"
            className="inline-block mt-4 px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
          >
            Add Your First Listing
          </Link>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-[#1B4965]">Booking Details</h3>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setIsBookingModalOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Guest Information</h4>
                <p className="text-gray-900">{selectedBooking.profiles.full_name}</p>
                <p className="text-gray-600">{selectedBooking.profiles.email}</p>
                <p className="text-gray-600">{selectedBooking.profiles.phone_number}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Booking Details</h4>
                <p className="text-gray-900">Status: {selectedBooking.status}</p>
                <p className="text-gray-900">Total Amount: {formatTND(selectedBooking.total_price)}</p>
                {selectedBooking.payed_amount && (
                  <>
                    <p className="text-gray-900">
                      Paid Amount: {formatTND(selectedBooking.payed_amount)}
                      {selectedBooking.payed_amount_cash > 0 && (
                        <span className="ml-2 text-sm text-gray-500">
                          (Cash: {formatTND(selectedBooking.payed_amount_cash)})
                        </span>
                      )}
                    </p>
                    <p className="text-gray-900">
                      Remaining: {formatTND(selectedBooking.total_price - selectedBooking.payed_amount)}
                    </p>
                  </>
                )}
              </div>

              <div className="flex space-x-4">
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => handleVerifyBooking(selectedBooking.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirm Booking
                  </button>
                )}
                {selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Booking
                  </button>
                )}
                {selectedBooking.total_price - (selectedBooking.payed_amount || 0) > 0 && (
                  <button
                    onClick={() => handleCashPayment(selectedBooking)}
                    className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB]"
                  >
                    Add Cash Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Listings; 