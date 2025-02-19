import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../config/supabase';

function Settings({ user }) {
  const [websiteContent, setWebsiteContent] = useState({
    hero: {
      title: '',
      subtitle: ''
    },
    stats: {
      totalUsers: '',
      activeListings: '',
      totalBookings: '',
      satisfaction: ''
    },
    whyChooseUs: {
      title: '',
      features: []
    },
    reviews: {
      title: '',
      subtitle: '',
      stats: {
        totalReviews: '',
        averageRating: '',
        satisfactionRate: ''
      }
    },
    contact: {
      office: {
        address: '',
        phone: '',
        email: '',
        hours: ''
      }
    },
    footer: {
      about: '',
      quickLinks: [],
      services: []
    }
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Fetch website content on component mount
  useEffect(() => {
    const fetchWebsiteContent = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setWebsiteContent(data.website_content);
        }
      } catch (error) {
        console.error('Error fetching website content:', error);
        toast.error('Failed to load website content');
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchWebsiteContent();
  }, []);

  const handleContentChange = (section, field, value) => {
    setWebsiteContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: user.id,
          website_content: websiteContent,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoadingContent) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Hero Section</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={websiteContent.hero.title}
              onChange={(e) => handleContentChange('hero', 'title', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={websiteContent.hero.subtitle}
              onChange={(e) => handleContentChange('hero', 'subtitle', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats Section Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Stats Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(websiteContent.stats).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleContentChange('stats', key, e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Contact Information</h3>
        <div className="space-y-4">
          {Object.entries(websiteContent.contact.office).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const newOffice = { ...websiteContent.contact.office };
                  newOffice[key] = e.target.value;
                  handleContentChange('contact', 'office', newOffice);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-[#1B4965] mb-4">Footer</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Text
            </label>
            <textarea
              value={websiteContent.footer.about}
              onChange={(e) => handleContentChange('footer', 'about', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-[#1B4965] mb-3">Quick Links</h4>
              {websiteContent.footer.quickLinks.map((link, index) => (
                <div key={index} className="flex space-x-4 mb-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => {
                      const newLinks = [...websiteContent.footer.quickLinks];
                      newLinks[index].title = e.target.value;
                      handleContentChange('footer', 'quickLinks', newLinks);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    placeholder="Link Title"
                  />
                  <input
                    type="text"
                    value={link.path}
                    onChange={(e) => {
                      const newLinks = [...websiteContent.footer.quickLinks];
                      newLinks[index].path = e.target.value;
                      handleContentChange('footer', 'quickLinks', newLinks);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    placeholder="Link Path"
                  />
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-lg font-medium text-[#1B4965] mb-3">Services</h4>
              {websiteContent.footer.services.map((service, index) => (
                <div key={index} className="flex space-x-4 mb-2">
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) => {
                      const newServices = [...websiteContent.footer.services];
                      newServices[index].title = e.target.value;
                      handleContentChange('footer', 'services', newServices);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    placeholder="Service Title"
                  />
                  <input
                    type="text"
                    value={service.path}
                    onChange={(e) => {
                      const newServices = [...websiteContent.footer.services];
                      newServices[index].path = e.target.value;
                      handleContentChange('footer', 'services', newServices);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                    placeholder="Service Path"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={isSavingSettings}
          className={`px-6 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors ${
            isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSavingSettings ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save All Settings'
          )}
        </button>
      </div>
    </div>
  );
}

export default Settings; 