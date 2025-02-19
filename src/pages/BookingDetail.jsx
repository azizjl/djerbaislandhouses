import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { LocationOutline } from 'react-ionicons'
import useAuthStore from '../stores/authStore'
import { useReactToPrint } from 'react-to-print'

const formatTND = (amount) => {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const BookingDetail = () => {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [uploadedReceipt, setUploadedReceipt] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [paidAmount, setPaidAmount] = useState('')
  const { user, role } = useAuthStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [currencies, setCurrencies] = useState([
    { code: 'TND', rate: 1, name: 'Tunisian Dinar' },
    { code: 'EUR', rate: 0.29, name: 'Euro' },
    { code: 'USD', rate: 0.32, name: 'US Dollar' }
  ])
  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('selectedCurrency') || 'TND'
  )
  const [lastUpdated, setLastUpdated] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  
  // Add URL parameter handling
  const searchParams = new URLSearchParams(window.location.search)
  const paymentStatus = searchParams.get('payment')
  const paymentRef = searchParams.get('payment_ref')

  const printRef = useRef();
  const [showPrintModal, setShowPrintModal] = useState(false);


  console.log('user : ', user)

//   const handlePrint = useReactToPrint({
//     content: () => printRef.current,
//     documentTitle: `Booking Receipt - ${booking?.confirmation_code || ''}`,
//     onAfterPrint: () => setShowPrintModal(false),
//   });

  const handlePrint = () => {
    // setShowPrintModal(true)
    window.print();
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            accommodations (
              name,
              location,
              images (url)
            ),
            profiles (
              full_name,
              phone_number,
              email
            )
          `)
          .eq('id', id)
          .single()

        if (error) throw error

        if (!currentUser || (data.user_id !== currentUser.id && role !== 'admin')) {
          toast.error('Unauthorized to view this booking')
          navigate('/bookings')
          return
        }

        setBooking(data)
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast.error('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchBooking()
    }
  }, [id, currentUser, role])

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (paymentRef) {
        try {
          const response = await fetch(`https://api.konnect.network/api/v2/payments/${paymentRef}`, {
            headers: {
              'x-api-key': '67ae61fe36b56de39bd4a533:b0GSRqXrIeTgvYwX7xiseEW9CO'
            }
          });


          if (!response.ok) throw new Error('Payment check failed');
          
          const data = await response.json();
          console.log("data de payment konnect", data);
          if (data.payment.status === 'completed') {
            console.log("completed payment konnect", data);
            // Update booking status in Supabase 
            const { error } = await supabase
              .from('bookings')
              .update({ 
                status: 'confirmed',
                payed_amount: data.payment.amount / 1000,
                payment_method: 'online_transfer',
                payment_ref: paymentRef,
                // payment_status: data.payment.status,
                updated_at: new Date().toISOString()
              })
              .eq('id', id);

            if (error) throw error;
            
            setBooking(prev => ({ ...prev, status: 'confirmed' }));
            toast.success('Payment successful!');
          } else if (paymentStatus === 'failed' || data.payment.status === 'failed') {
            toast.error('Payment failed. Please try again.');
          }
        } catch (error) {
          console.error('Error checking payment:', error);
          toast.error('Error verifying payment status');
        }
      }
    };

    checkPaymentStatus();
  }, [paymentRef, id, paymentStatus]);

  useEffect(() => {
    if (booking?.receipt_url) {
      getReceiptUrl(booking.receipt_url).then(url => setReceiptUrl(url));
    }
  }, [booking?.receipt_url]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('currencies, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (error) {
          console.error('Error fetching currencies:', error)
          return
        }
        
        if (data?.currencies && data.currencies.length > 0) {
          setCurrencies(data.currencies)
          setLastUpdated(data.updated_at)
        }
      } catch (error) {
        console.error('Error fetching currencies:', error)
      }
    }

    fetchCurrencies()
  }, [])

  const formatPrice = (priceInTND) => {
    if (!priceInTND) return '0 TND'
    
    const currency = currencies.find(c => c.code === selectedCurrency)
    if (!currency) return `${priceInTND} TND`
    
    const convertedPrice = priceInTND * currency.rate
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(convertedPrice)
  }

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value
    setSelectedCurrency(newCurrency)
    localStorage.setItem('selectedCurrency', newCurrency)
  }

  const handleReceiptUpload = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      if (!paidAmount || paidAmount <= 0) {
        toast.error('Please enter the amount you paid')
        return
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${booking.id}_${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('booking-receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Update booking with receipt info and paid amount
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          receipt_url: filePath,
          payment_method: 'bank_transfer',
          payed_amount: paidAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)

      if (updateError) throw updateError

      setUploadedReceipt(filePath)
      toast.success('Receipt uploaded successfully')
      setShowBankModal(false)
      // Refresh booking data to show updated status
      setBooking(prev => ({ 
        ...prev, 
        receipt_url: filePath,
        payment_method: 'bank_transfer',
        payed_amount: paidAmount
      }))
    } catch (error) {
      console.error('Error uploading receipt:', error)
      toast.error('Failed to upload receipt')
    } finally {
      setUploading(false)
    }
  }

  const getReceiptUrl = async (path) => {
    try {
      const { data, error } = await supabase.storage
        .from('booking-receipts')
        .getPublicUrl(path);
      
      if (error) throw error;
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting receipt URL:', error);
      return null;
    }
  };

  const handlePartialPayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to make payment');
        return;
      }

      if (booking.user_id !== user.id) {
        toast.error('Unauthorized to make payment for this booking');
        return;
      }

      const paymentData = {
        receiverWalletId: "67ae620236b56de39bd4a5a1",
        token: "TND",
        amount: (booking.total_price * 0.3) * 1000,
        type: "immediate",
        description: `30% Advance payment for booking ${booking.id} at ${booking.accommodations.name}`,
        acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
        lifespan: 10,
        checkoutForm: true,
        addPaymentFeesToAmount: true,
        firstName: user.user_metadata?.first_name || "Guest",
        lastName: user.user_metadata?.last_name || "User",
        phoneNumber: user.user_metadata?.phone_number || "",
        email: user.email,
        orderId: booking.id,
        webhook: `${window.location.origin}/bookings/${booking.id}`,
        silentWebhook: true,
        successUrl: `${window.location.origin}/bookings/${booking.id}?payment=success`,
        failUrl: `${window.location.origin}/bookings/${booking.id}?payment=failed`,
        theme: "dark"
      };

      const response = await fetch('https://api.konnect.network/api/v2/payments/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '67ae61fe36b56de39bd4a533:b0GSRqXrIeTgvYwX7xiseEW9CO'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) throw new Error('Payment initialization failed');
      const paymentResponse = await response.json();
      window.location.href = paymentResponse.payUrl;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const handleFullPayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to make payment');
        return;
      }

      if (booking.user_id !== user.id) {
        toast.error('Unauthorized to make payment for this booking');
        return;
      }

      console.log("selectedCurrency", selectedCurrency)
      console.log("booking.total_price", booking.total_price)
      console.log("formatPrice(booking.total_price)", formatPrice(booking.total_price))
      console.log("num:", Number(formatPrice(booking.total_price).replace(/\D/g, '')))
      // return false;

      const paymentData = {
        receiverWalletId: "67ae620236b56de39bd4a5a1",
        token: selectedCurrency === 'TND' ? 'TND' : 'EUR',
        amount: selectedCurrency === 'TND' 
          ? booking.total_price * 1000
          :Number(formatPrice(booking.total_price).replace(/\D/g, '')) * 100,
          // : Math.floor((formatPrice(booking.total_price).replace(/\D/g, '')*3.4)*1000),
        type: "immediate",
        description: `Full payment for booking ${booking.id} at ${booking.accommodations.name}`,
        acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
        lifespan: 10,
        checkoutForm: true,
        addPaymentFeesToAmount: true,
        firstName: user.user_metadata?.first_name || "Guest",
        lastName: user.user_metadata?.last_name || "User",
        phoneNumber: user.user_metadata?.phone_number || "",
        email: user.email,
        orderId: booking.id,
        webhook: `${window.location.origin}/bookings/${booking.id}`,
        silentWebhook: true,
        successUrl: `${window.location.origin}/bookings/${booking.id}?payment=success`,
        failUrl: `${window.location.origin}/bookings/${booking.id}?payment=failed`,
        theme: "dark"
      };

      const response = await fetch('https://api.konnect.network/api/v2/payments/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '67ae61fe36b56de39bd4a533:b0GSRqXrIeTgvYwX7xiseEW9CO'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) throw new Error('Payment initialization failed');
      const paymentResponse = await response.json();
      window.location.href = paymentResponse.payUrl;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to cancel booking');
        return;
      }

      if (booking.user_id !== user.id) {
        toast.error('Unauthorized to cancel this booking');
        return;
      }

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking.id)
        .single();

      console.log('booking data', data)
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
      
      if (error) throw error;
      
      toast.success('Booking cancelled successfully');
      setBooking(prev => ({ ...prev, status: 'cancelled' }));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1B4965]">Booking not found</h2>
          <Link to="/bookings" className="mt-4 text-[#62B6CB] hover:text-[#1B4965] transition-colors">
            View all bookings
          </Link>
        </div>
      </div>
    )
  }

  const BankTransferModal = () => (
    <div className={`fixed inset-0 bg-black/25 backdrop-blur-sm z-99999999 flex items-center justify-center ${showBankModal ? '' : 'hidden'}`}>
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-[#1B4965]">Bank Transfer Details</h3>
          <button 
            onClick={() => setShowBankModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {booking.payed_amount ? (
          // Show payment details if payment exists
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 font-medium">Payment Received</p>
              </div>
              <div className="mt-4">
                <p className="text-gray-600">Amount Paid:</p>
                <p className="text-xl font-bold text-[#1B4965]">{formatPrice(booking.payed_amount)}</p>
              </div>
              {booking.payment_method && (
                <div className="mt-2">
                  <p className="text-gray-600">Payment Method:</p>
                  <p className="text-lg font-medium text-[#1B4965] capitalize">
                    {booking.payment_method.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>

            {booking.receipt_url && (
              <div>
                <h4 className="text-lg font-semibold text-[#1B4965] mb-3">Transfer Receipt</h4>
                <img 
                  src={receiptUrl}
                  alt="Transfer Receipt"
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowBankModal(false)}
                className="px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Please complete the bank transfer within 3 days to avoid automatic booking cancellation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#F0F7FF] p-6 rounded-xl space-y-4">
              <h4 className="text-lg font-semibold text-[#1B4965]">Bank Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bank Name</p>
                  <p className="font-medium text-[#1B4965]">Arab Tunisian Bank</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Name</p>
                  <p className="font-medium text-[#1B4965]">DJERBA ISLAND HOUSES</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IBAN</p>
                  <p className="font-medium text-[#1B4965] font-mono">TN59 0109 9133 1100 0078 9002</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SWIFT/BIC</p>
                  <p className="font-medium text-[#1B4965] font-mono">ATBKTNTT</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F0F7FF] p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-[#1B4965] mb-4">Select Payment Amount</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaidAmount(booking.total_price * 0.3)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paidAmount === booking.total_price * 0.3
                      ? 'border-[#1B4965] bg-[#1B4965] text-white'
                      : 'border-gray-200 hover:border-[#1B4965] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">30% Deposit</span>
                    {paidAmount === booking.total_price * 0.3 && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{formatPrice(booking.total_price * 0.3)}</p>
                  <p className={`text-sm mt-2 ${paidAmount === booking.total_price * 0.3 ? 'text-white/80' : 'text-gray-500'}`}>
                    Pay 30% now and the rest upon arrival
                  </p>
                </button>

                <button
                  onClick={() => setPaidAmount(booking.total_price)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    paidAmount === booking.total_price
                      ? 'border-[#1B4965] bg-[#1B4965] text-white'
                      : 'border-gray-200 hover:border-[#1B4965] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Full Amount</span>
                    {paidAmount === booking.total_price && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{formatPrice(booking.total_price)}</p>
                  <p className={`text-sm mt-2 ${paidAmount === booking.total_price ? 'text-white/80' : 'text-gray-500'}`}>
                    Pay the full amount now
                  </p>
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-[#1B4965] mb-4">Upload Transfer Receipt</h4>
              <div className="space-y-4">
                {uploadedReceipt ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <p className="text-green-600 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Receipt uploaded successfully
                      </p>
                    </div>
                    {receiptUrl && (
                      <img 
                        src={receiptUrl}
                        alt="Transfer Receipt"
                        className="w-full h-auto rounded-xl shadow-md"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleReceiptUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-[#1B4965] file:text-white
                        hover:file:bg-[#62B6CB]
                        file:cursor-pointer"
                      disabled={!paidAmount || uploading}
                    />
                    {uploading && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1B4965]"></div>
                        <p className="text-sm text-gray-600">Uploading receipt...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowBankModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {uploadedReceipt && paidAmount > 0 && (
                <button
                  onClick={() => setShowBankModal(false)}
                  className="px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB]"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const PrintModal = () => (
    <div
      className={`fixed inset-0 bg-black/25 backdrop-blur-sm z-9999999 flex items-center justify-center ${
        showPrintModal ? '' : 'hidden'
      }`}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#1B4965]">Recipt</h3>
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Imprimer
            </button>
            <button onClick={() => setShowPrintModal(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="p-8">
          <div className="max-w-3xl mx-auto">
            {/* Company Information */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#1B4965]">DJERBA ISLAND HOUSES</h1>
              <p className="text-gray-600">002, Mohamed Badra, Montplaisir, Tunis 1073</p>
              <p className="text-gray-600">N° Fiscal: 1886464/T</p>
            </div>

            {/* Invoice Header */}
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-[#1B4965]">Facture N°: INV-{booking?.id}</h2>
                <p className="text-gray-600">Date d'émission: {format(new Date(), 'dd/MM/yyyy')}</p>
                <p className="text-gray-600">Date de réservation: {format(new Date(booking?.created_at), 'dd/MM/yyyy')}</p>
                <p className="text-gray-600">Code de confirmation: {booking?.confirmation_code}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#1B4965] capitalize">
                  Statut: {booking?.status === 'confirmed' ? 'Payée' : 
                          booking?.status === 'pending' ? 'En attente' : 'Annulée'}
                </p>
                {booking?.payment_method && (
                  <p className="text-gray-600 capitalize">
                    Mode de paiement: {booking?.payment_method.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>

            {/* Client Information */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-[#1B4965] mb-2">Information Client</h3>
              <p><strong>Nom:</strong> {booking?.profiles?.full_name}</p>
              <p><strong>Email:</strong> {booking?.profiles?.email}</p>
              {booking?.profiles?.phone_number && (
                <p><strong>Téléphone:</strong> {booking?.profiles?.phone_number}</p>
              )}
            </div>

            {/* Property Information */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#1B4965] mb-2">Détails de la Réservation</h3>
              <div className="border-t border-b py-4">
                <p><strong>Propriété:</strong> {booking?.accommodations?.name}</p>
                <p><strong>Localisation:</strong> {booking?.accommodations?.location}</p>
                <p><strong>Check-in:</strong> {format(new Date(booking?.start_date), 'dd/MM/yyyy')}</p>
                <p><strong>Check-out:</strong> {format(new Date(booking?.end_date), 'dd/MM/yyyy')}</p>
                <p><strong>Nombre de jours:</strong> {Math.ceil((new Date(booking?.end_date) - new Date(booking?.start_date)) / (1000 * 60 * 60 * 24))} jours</p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#1B4965] mb-4">Détails Financiers</h3>
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Prix total (HT)</td>
                    <td className="text-right">{formatPrice(booking?.total_price * 0.81)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">TVA (19%)</td>
                    <td className="text-right">{formatPrice(booking?.total_price * 0.19)}</td>
                  </tr>
                  <tr className="border-b font-bold">
                    <td className="py-2">Total TTC</td>
                    <td className="text-right">{formatPrice(booking?.total_price)}</td>
                  </tr>
                  <tr className="border-b text-green-600">
                    <td className="py-2">Montant payé</td>
                    <td className="text-right">{formatPrice(booking?.payed_amount || 0)}</td>
                  </tr>
                  <tr className="font-bold text-[#1B4965]">
                    <td className="py-2">Reste à payer</td>
                    <td className="text-right">{formatPrice(Math.max(0, booking?.total_price - (booking?.payed_amount || 0)))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600 mt-12 pt-8 border-t">
              <p>DJERBA ISLAND HOUSES</p>
              <p>002, Mohamed Badra, Montplaisir, Tunis 1073</p>
              <p>Tél: +216 22 441 889 - Email: contact@djerbaislandhouses.com</p>
              <p>N° Fiscal: 1886464/T</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PrintButton = () => (
    <button
      onClick={() => setShowPrintModal(true)}
      className="flex items-center px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors duration-300"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print Receipt
    </button>
  );

  return (
    <>
      <PrintModal />
      
      <nav className="bg-white/90 backdrop-blur-md py-4 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className={`text-3xl font-light tracking-tight ${isScrolled ? 'text-[#1B4965]' : 'text-[#1B4965]'}`}>
                DjerbaIsland<span className="font-bold text-[#62B6CB]">Houses</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-white/80'} transition-colors`}>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1m-6 0h6"/>
                </svg>
                Home
              </Link>
              <Link to="/houses" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                Properties
              </Link>
              <Link to="/contact" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Contact
              </Link>
              {role === 'admin' && (
                <Link to="/dashboard" className={`flex items-center ${isScrolled ? 'text-[#1B4965] hover:text-[#62B6CB]' : 'text-[#1B4965] hover:text-[#1B4965]/80'} transition-colors`}>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>
              )}
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center space-x-2 p-2 rounded-full border ${
                      isScrolled 
                        ? 'border-gray-200 hover:shadow-md' 
                        : 'border-white/30 hover:border-white'
                    } transition-all duration-300`}
                  >
                    <svg className={`w-5 h-5 ${isScrolled ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                    <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${
                      isScrolled ? 'bg-gray-200' : 'bg-white/20'
                    }`}>
                      {user?.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className={`w-5 h-5 ${isScrolled ? 'text-gray-600' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg py-2 border border-[#F5F5F5]">
                      <div className="px-4 py-3 border-b border-[#F5F5F5]">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                          Profile
                        </Link>
                        
                        <Link
                          to="/bookings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          My Bookings
                        </Link>

                        {role === 'admin' && (
                          <Link
                            to="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                            Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#F5F5F5]">
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut()
                            navigate('/')
                            setIsMenuOpen(false)
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <BankTransferModal />
      
      <div className="min-h-screen bg-gradient-to-b from-[#CAE9FF] to-white print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Content Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            {/* Status Banner */}
            <div className="bg-gradient-to-r from-[#1B4965] to-[#62B6CB] px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`w-4 h-4 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-400' :
                    booking.status === 'pending' ? 'bg-amber-400' :
                    'bg-red-400'
                  } animate-pulse`}></span>
                  <h1 className="text-2xl font-bold tracking-wide">
                    Booking {booking.status === 'confirmed' ? 'Confirmed' :
                            booking.status === 'pending' ? 'Pending Confirmation' :
                            'Cancelled'}
                  </h1>
                </div>
                {booking.status === 'confirmed' && <PrintButton />}
              </div>
            </div>

            {/* Property Details */}
            <div className="p-8">
              <div className="flex items-start gap-8">
                <div className="w-48 h-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={booking.accommodations.images[0]?.url}
                    alt={booking.accommodations.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-[#1B4965] mb-4">
                    {booking.accommodations.name}
                  </h1>
                  <p className="text-gray-600 flex items-center text-lg bg-[#F0F7FF] px-4 py-2 rounded-full inline-flex">
                    <LocationOutline
                      color={'#62B6CB'}
                      height="24px"
                      width="24px"
                      className="mr-2"
                    />
                    {booking.accommodations.location}
                  </p>
                </div>
              </div>

              {/* Booking Details Grid */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-[#1B4965] mb-8 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Détails de la Réservation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Check-in</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {format(new Date(booking.start_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Check-out</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Nombre de jours</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} jours
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Total Price</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {formatPrice(booking.total_price)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Amount Paid</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {formatPrice(booking.payed_amount || 0)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Booking ID</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {booking.id}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Confirmation Code</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {booking.confirmation_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Details Section */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-[#1B4965] mb-8 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Guest Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Full Name</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {booking.profiles?.full_name}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Phone Number</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {booking.profiles?.phone_number || 'Not provided'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-2xl shadow-sm border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-sm text-[#62B6CB] font-medium uppercase tracking-wider">Email</p>
                    <p className="text-xl font-bold text-[#1B4965] mt-2">
                      {booking.profiles?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Actions Section */}
              {booking.status === 'pending' && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold text-[#1B4965] mb-8 flex items-center">
                    <svg className="w-7 h-7 mr-3 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Select Payment Method
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Partial Payment Card */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <svg className="w-8 h-8 text-[#1B4965]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">30% Deposit</span>
                        </div>
                        <h4 className="text-xl font-bold text-[#1B4965] mb-2">Partial Payment</h4>
                        <p className="text-gray-600 text-sm mb-4">Pay 30% now and the remaining balance upon arrival</p>
                        <div className="mb-6">
                          <p className="text-2xl font-bold text-[#1B4965]">{formatPrice(booking.total_price * 0.3)}</p>
                          <p className="text-sm text-gray-500">Due now</p>
                        </div>
                        <button 
                          onClick={handlePartialPayment}
                          className="w-full px-6 py-3 bg-[#1B4965] text-white rounded-xl hover:bg-[#62B6CB] transition-colors duration-300"
                        >
                          Pay Deposit
                        </button>
                      </div>
                    </div>

                    {/* Full Payment Card */}
                    <div className="bg-white rounded-2xl shadow-md border-2 border-[#62B6CB] overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
                      <div className="absolute top-4 right-4">
                        <span className="bg-[#62B6CB] text-white px-3 py-1 rounded-full text-sm font-medium">Recommended</span>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-xl font-bold text-[#1B4965] mb-2">Full Payment</h4>
                        <p className="text-gray-600 text-sm mb-4">Pay the entire amount now and enjoy peace of mind</p>
                        <div className="mb-6">
                          <p className="text-2xl font-bold text-[#1B4965]">{formatPrice(booking.total_price)}</p>
                          <p className="text-sm text-gray-500">Total amount</p>
                        </div>
                        <button 
                          onClick={handleFullPayment}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors duration-300"
                        >
                          Pay Full Amount
                        </button>
                      </div>
                    </div>

                    {/* Bank Transfer Card */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                              </svg>
                            </div>
                          </div>
                          <h4 className="text-xl font-bold text-[#1B4965] mb-2">Bank Transfer</h4>
                          <p className="text-gray-600 text-sm mb-4">Transfer directly to our bank account</p>
                          <div className="mb-6">
                            <p className="text-sm text-gray-500">View bank details and upload receipt</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowBankModal(true)}
                          className="w-full px-6 py-3 bg-[#1B4965] text-white rounded-xl hover:bg-[#62B6CB] transition-colors duration-300"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Booking */}
                  <div className="mt-8 text-center">
                    <button 
                      onClick={handleCancelBooking}
                      className="text-red-500 hover:text-red-600 font-medium transition-colors duration-300 flex items-center justify-center mx-auto"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Booking
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Section */}
            {booking.receipt_url && (
              <div className="mt-8 border-t border-gray-100 pt-8 pb-12 px-8">
                <h3 className="text-xl font-bold text-[#1B4965] mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[#62B6CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Transfer Receipt
                </h3>
                {receiptUrl && (
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={receiptUrl}
                      alt="Transfer Receipt"
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BookingDetail 