import { useParams } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'

const ReservationPage = () => {
  const { houseId } = useParams()
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // TODO: Implement reservation submission
      toast.success('Reservation submitted successfully!')
    } catch (error) {
      toast.error('Failed to submit reservation')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Make a Reservation</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="checkIn" className="block mb-2">Check-in Date</label>
          <input
            type="date"
            id="checkIn"
            name="checkIn"
            value={formData.checkIn}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="checkOut" className="block mb-2">Check-out Date</label>
          <input
            type="date"
            id="checkOut"
            name="checkOut"
            value={formData.checkOut}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="guests" className="block mb-2">Number of Guests</label>
          <input
            type="number"
            id="guests"
            name="guests"
            min="1"
            value={formData.guests}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit Reservation
        </button>
      </form>
    </div>
  )
}

export default ReservationPage 