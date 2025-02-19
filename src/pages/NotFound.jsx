import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="h-[100vh] flex items-center justify-center relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4965] via-[#62B6CB] to-[#BEE9E8] opacity-20"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-9xl font-bold text-[#1B4965] mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-[#1B4965] mb-6">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-block bg-[#1B4965] text-white px-6 py-3 rounded-lg hover:bg-[#62B6CB] transition-colors duration-300"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound 