import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday } from 'date-fns';
import BookingModal from './BookingModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

function Calendar({ bookings }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Get the first day of the month
  const monthStart = startOfMonth(currentDate);
  // Get the last day of the month
  const monthEnd = endOfMonth(currentDate);
  // Get the start of the first week
  const calendarStart = startOfWeek(monthStart);
  // Get the end of the last week
  const calendarEnd = endOfWeek(monthEnd);
  
  // Get all days that should be displayed in the calendar
  const calendarDays = eachDayOfInterval({ 
    start: calendarStart, 
    end: calendarEnd 
  });

  const getBookingsForDay = (day) => {
    return bookings.filter(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      return day >= bookingStart && day <= bookingEnd;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  // New helper functions
  const getTodaysCheckouts = () => {
    return bookings.filter(booking => {
      const endDate = new Date(booking.end_date);
      return isToday(endDate);
    });
  };

  const getPendingBookings = () => {
    return bookings.filter(booking => booking.status === 'pending');
  };

  // Add booking status colors
  const getBookingStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-blue-100 text-blue-800';
  };

  const events = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.profiles.full_name} - ${booking.accommodations.name}`,
    start: booking.start_date,
    end: booking.end_date,
    extendedProps: { booking }
  }));

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        {/* <div className="grid grid-cols-2 gap-4">
          {/* Today's Checkouts */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-[#1B4965] mb-3">Today's Checkouts</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {getTodaysCheckouts().map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{booking.profiles.full_name}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(booking.end_date), 'HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{booking.accommodations.name}</div>
                </div>
              ))}
            </div>
          </div> 

          {/* Pending Bookings */}
          {/* <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-lg font-semibold text-[#1B4965] mb-3">Pending Bookings</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {getPendingBookings().map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{booking.profiles.full_name}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{booking.accommodations.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        Calendar Header
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-[#1B4965]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div> */}

        {/* Calendar Grid */}
        {/* <div className="bg-white rounded-xl shadow-sm overflow-hidden"> */}
          {/* Day headers */}
          {/* <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div 
                key={day} 
                className="py-2 text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div> */}

          {/* Calendar days */}
          {/* <div className="grid grid-cols-7 h-[800px]">
            {calendarDays.map((day, dayIdx) => {
              const dayBookings = getBookingsForDay(day);
              return (
                <div
                  key={day.toString()}
                  className={`border-b border-r border-gray-200 p-2 ${
                    !isSameMonth(day, currentDate) ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isSameDay(day, new Date())
                        ? 'bg-[#1B4965] text-white'
                        : isSameMonth(day, currentDate)
                          ? 'text-gray-900'
                          : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1 max-h-[120px] overflow-y-auto">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`px-2 py-1 text-xs rounded truncate ${getBookingStatusColor(booking.status)}`}
                        title={`${booking.profiles.full_name} - ${booking.accommodations.name} (${booking.status})`}
                      >
                        {booking.profiles.full_name} - {booking.accommodations.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div> */}
      
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          setSelectedBooking(info.event.extendedProps.booking);
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
      />
      
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
      </div>
    </>
  );
}

export default Calendar; 