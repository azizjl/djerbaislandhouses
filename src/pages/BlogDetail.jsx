import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { format } from 'date-fns'

const BlogDetail = () => {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('slug', slug)
        .single()

      if (error) throw error
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800">Post not found</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-6 left-6 z-10 px-4 py-2 flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>Back</span>
      </button>

      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Hero Image */}
        {post.cover_image && (
          <div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0">
            <div className="relative h-[50vh] lg:h-full">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 to-black/30" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12">
                {/* Category and Date */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-[#1B4965] text-sm font-medium rounded-full">
                    {post.categories.name}
                  </span>
                  <span className="text-white/90 text-sm">
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {/* Title */}
                <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                  {post.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Content */}
        <div className="lg:w-1/2 px-4 lg:px-12 py-12 lg:py-16">
          <div className="max-w-xl mx-auto">
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#1B4965] prose-img:rounded-xl prose-img:shadow-lg [&_p]:whitespace-pre-wrap">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogDetail 