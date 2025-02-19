import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../config/supabase';
import { toast } from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';

function Messages({ messages: initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageFilter, setMessageFilter] = useState('all');
  const [replyContent, setReplyContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);

  const handleMarkAsRead = async (messageId, currentReadStatus) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read: !currentReadStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, read: !currentReadStatus }
            : msg
        )
      );

      toast.success(`Message marked as ${!currentReadStatus ? 'read' : 'unread'}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  const handleReplySubmit = async (messageId) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      // Update message as replied in database
      const { error: messageError } = await supabase
        .from('messages')
        .update({ 
          replied: true,
          reply_content: replyContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (messageError) throw messageError;

      // Send email using Email.js
      const templateParams = {
        to_email: selectedMessage.email,
        to_name: selectedMessage.name,
        message: replyContent,
        reply_to: "contact@dar-ichkeul.com",
        from_name: "Dar Ichkeul"
      };

      emailjs.send(
        'service_2jep9xp',
        'template_j9bgl6g',
        templateParams,
        'iBg4R45RwW4X3Jbwi'
      ).then(
        (result) => {
          console.log('Email sent successfully:', result.text);
          toast.success('Reply email sent successfully');
        },
        (error) => {
          console.error('Error sending email:', error);
          toast.error('Failed to send reply email');
        }
      );

      // Update local state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, replied: true, reply_content: replyContent }
            : msg
        )
      );

      setReplyContent('');
      setIsMessageModalOpen(false);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const getFilteredMessages = () => {
    return messages.filter(message => {
      switch (messageFilter) {
        case 'pending':
          return !message.read && !message.replied;
        case 'read':
          return message.read && !message.replied;
        case 'responded':
          return message.replied;
        default:
          return true;
      }
    });
  };

  const handleUpdateMessageStatus = async (messageId, newStatus) => {
    try {
      const updates = {
        read: newStatus === 'read' || newStatus === 'responded',
        replied: newStatus === 'responded',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, ...updates }
            : msg
        )
      );

      toast.success(`Message marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      toast.error('Failed to update message status');
    }
  };

  return (
    <div className="space-y-6">
    {/* Filtering options */}
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setMessageFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            messageFilter === 'all'
              ? 'bg-[#1B4965] text-white'
              : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setMessageFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            messageFilter === 'pending'
              ? 'bg-[#FFC107] text-white'
              : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setMessageFilter('read')}
          className={`px-4 py-2 rounded-lg ${
            messageFilter === 'read'
              ? 'bg-[#62B6CB] text-white'
              : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
          }`}
        >
          Read
        </button>
        <button
          onClick={() => setMessageFilter('responded')}
          className={`px-4 py-2 rounded-lg ${
            messageFilter === 'responded'
              ? 'bg-[#4CAF50] text-white'
              : 'bg-gray-100 text-[#1B4965] hover:bg-gray-200'
          }`}
        >
          Responded
        </button>
      </div>
    </div>

    {/* Messages list */}
    <div className="grid gap-6">
      {getFilteredMessages().map((message) => (
        <div
          key={message.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#1B4965]">
                  {message.subject}
                </h3>
                <p className="text-gray-500 text-sm">
                  From: {message.name} ({message.email})
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  message.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : message.status === 'read'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 line-clamp-2">{message.message}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {new Date(message.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              <div className="flex space-x-3">
                {message.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateMessageStatus(message.id, 'read')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark as Read
                  </button>
                )}
                {(message.status === 'pending' || message.status === 'read') && (
                  <button
                    onClick={() => handleUpdateMessageStatus(message.id, 'responded')}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Mark as Responded
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedMessage(message)
                    setIsMessageModalOpen(true)
                  }}
                  className="text-sm text-[#1B4965] hover:text-[#62B6CB]"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {getFilteredMessages().length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No messages found</p>
        </div>
      )}
    </div>

    {/* Message Details Modal */}
    {isMessageModalOpen && selectedMessage && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-[#1B4965]">
                Message Details
              </h3>
              <button
                onClick={() => {
                  setSelectedMessage(null)
                  setIsMessageModalOpen(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message Content */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">From</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-[#1B4965]">{selectedMessage.name}</p>
                  <p className="text-gray-600">{selectedMessage.email}</p>
                  {selectedMessage.phone && (
                    <p className="text-gray-600">{selectedMessage.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Subject</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[#1B4965]">{selectedMessage.subject}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-medium">Received:</span>{' '}
                    {new Date(selectedMessage.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`inline-block px-2 py-1 rounded-full text-sm text-white ml-2 ${
                      selectedMessage.status === 'pending'
                        ? 'bg-yellow-500'
                        : selectedMessage.status === 'read'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}>
                      {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {selectedMessage.status === 'pending' && (
                <button
                  onClick={() => {
                    handleUpdateMessageStatus(selectedMessage.id, 'read')
                    setIsMessageModalOpen(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark as Read
                </button>
              )}
              {(selectedMessage.status === 'pending' || selectedMessage.status === 'read') && (
                <button
                  onClick={() => {
                    handleUpdateMessageStatus(selectedMessage.id, 'responded')
                    setIsMessageModalOpen(false)
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Responded
                </button>
              )}
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                className="flex-1 px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] text-center"
              >
                Reply via Email
              </a>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}

export default Messages; 