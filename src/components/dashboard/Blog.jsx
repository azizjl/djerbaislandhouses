import { useState } from 'react';
import { format } from 'date-fns';

function Blog({ posts, categories, onSavePost }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleNewPost = () => {
    setSelectedPost({
      title: '',
      content: '',
      category_id: categories[0]?.id,
      status: 'draft'
    });
    setIsEditing(true);
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onSavePost(selectedPost);
    setIsEditing(false);
    setSelectedPost(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Total Posts</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{posts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Published</h4>
          <p className="text-2xl font-bold text-green-600">
            {posts.filter(post => post.status === 'published').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Drafts</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {posts.filter(post => post.status === 'draft').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm text-gray-500 mb-1">Categories</h4>
          <p className="text-2xl font-bold text-[#1B4965]">{categories.length}</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header with New Post Button */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#1B4965]">Blog Posts</h2>
          <button
            onClick={handleNewPost}
            className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors"
          >
            New Post
          </button>
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={selectedPost.title}
                onChange={(e) => setSelectedPost({ ...selectedPost, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-[#1B4965] focus:border-[#1B4965]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={selectedPost.content}
                onChange={(e) => setSelectedPost({ ...selectedPost, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-[#1B4965] focus:border-[#1B4965]"
                required
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedPost.category_id}
                  onChange={(e) => setSelectedPost({ ...selectedPost, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-[#1B4965] focus:border-[#1B4965]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedPost.status}
                  onChange={(e) => setSelectedPost({ ...selectedPost, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-[#1B4965] focus:border-[#1B4965]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedPost(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB]"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          /* Posts List */
          <div className="divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {post.title}
                    </h3>
                    <div className="mt-1 flex items-center space-x-3 text-sm text-gray-500">
                      <span>{format(new Date(post.created_at), 'PP')}</span>
                      <span>•</span>
                      <span>{categories.find(c => c.id === post.category_id)?.name}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(post.status || 'draft').charAt(0).toUpperCase() + (post.status || 'draft').slice(1)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditPost(post)}
                    className="ml-4 p-2 text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {posts.length === 0 && !isEditing && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No blog posts found</p>
          <button
            onClick={handleNewPost}
            className="mt-4 px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB]"
          >
            Create Your First Post
          </button>
        </div>
      )}
    </div>
  );
}

export default Blog; 