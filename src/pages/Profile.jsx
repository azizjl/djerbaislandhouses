import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    avatar_url: ''
  })
  const [updating, setUpdating] = useState(false)
  const [countryCode, setCountryCode] = useState('+1')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          navigate('/auth')
          return
        }

        setUser(user)

        // Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            address: data.address || '',
            avatar_url: data.avatar_url || ''
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Error loading profile')
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [navigate])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error updating profile')
    } finally {
      setUpdating(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      
      toast.success('Avatar uploaded successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Error uploading avatar')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setChangingPassword(true)

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password updated successfully')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Error updating password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4965]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl bg-white p-1 mb-8 shadow-md">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-[#1B4965] text-white shadow'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profile
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
              activeTab === 'security'
                ? 'bg-[#1B4965] text-white shadow'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </div>
          </button>
        </div>

        {/* Tab Panels */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {activeTab === 'profile' ? (
            <>
              <h1 className="text-3xl font-bold text-[#1B4965] mb-8">Profile Settings</h1>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || user.email}&background=1B4965&color=fff`}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#62B6CB]"
                    />
                    <label className="absolute bottom-0 right-0 bg-[#1B4965] rounded-full p-2 cursor-pointer hover:bg-[#62B6CB] transition-colors">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{profile.full_name || 'Add your name'}</h2>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-3 py-3 rounded-l-lg border border-r-0 border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      >
                        <option value="+93">+93 (Afghanistan)</option>
                        <option value="+355">+355 (Albania)</option>
                        <option value="+213">+213 (Algeria)</option>
                        <option value="+376">+376 (Andorra)</option>
                        <option value="+244">+244 (Angola)</option>
                        <option value="+54">+54 (Argentina)</option>
                        <option value="+374">+374 (Armenia)</option>
                        <option value="+61">+61 (Australia)</option>
                        <option value="+43">+43 (Austria)</option>
                        <option value="+994">+994 (Azerbaijan)</option>
                        <option value="+973">+973 (Bahrain)</option>
                        <option value="+880">+880 (Bangladesh)</option>
                        <option value="+375">+375 (Belarus)</option>
                        <option value="+32">+32 (Belgium)</option>
                        <option value="+501">+501 (Belize)</option>
                        <option value="+229">+229 (Benin)</option>
                        <option value="+975">+975 (Bhutan)</option>
                        <option value="+591">+591 (Bolivia)</option>
                        <option value="+387">+387 (Bosnia and Herzegovina)</option>
                        <option value="+267">+267 (Botswana)</option>
                        <option value="+55">+55 (Brazil)</option>
                        <option value="+359">+359 (Bulgaria)</option>
                        <option value="+226">+226 (Burkina Faso)</option>
                        <option value="+257">+257 (Burundi)</option>
                        <option value="+855">+855 (Cambodia)</option>
                        <option value="+237">+237 (Cameroon)</option>
                        <option value="+1">+1 (Canada)</option>
                        <option value="+236">+236 (Central African Republic)</option>
                        <option value="+235">+235 (Chad)</option>
                        <option value="+56">+56 (Chile)</option>
                        <option value="+86">+86 (China)</option>
                        <option value="+57">+57 (Colombia)</option>
                        <option value="+269">+269 (Comoros)</option>
                        <option value="+506">+506 (Costa Rica)</option>
                        <option value="+385">+385 (Croatia)</option>
                        <option value="+53">+53 (Cuba)</option>
                        <option value="+357">+357 (Cyprus)</option>
                        <option value="+420">+420 (Czech Republic)</option>
                        <option value="+45">+45 (Denmark)</option>
                        <option value="+253">+253 (Djibouti)</option>
                        <option value="+1">+1 (Dominican Republic)</option>
                        <option value="+670">+670 (East Timor)</option>
                        <option value="+593">+593 (Ecuador)</option>
                        <option value="+20">+20 (Egypt)</option>
                        <option value="+503">+503 (El Salvador)</option>
                        <option value="+240">+240 (Equatorial Guinea)</option>
                        <option value="+291">+291 (Eritrea)</option>
                        <option value="+372">+372 (Estonia)</option>
                        <option value="+251">+251 (Ethiopia)</option>
                        <option value="+679">+679 (Fiji)</option>
                        <option value="+358">+358 (Finland)</option>
                        <option value="+33">+33 (France)</option>
                        <option value="+241">+241 (Gabon)</option>
                        <option value="+220">+220 (Gambia)</option>
                        <option value="+995">+995 (Georgia)</option>
                        <option value="+49">+49 (Germany)</option>
                        <option value="+233">+233 (Ghana)</option>
                        <option value="+30">+30 (Greece)</option>
                        <option value="+502">+502 (Guatemala)</option>
                        <option value="+224">+224 (Guinea)</option>
                        <option value="+592">+592 (Guyana)</option>
                        <option value="+509">+509 (Haiti)</option>
                        <option value="+504">+504 (Honduras)</option>
                        <option value="+852">+852 (Hong Kong)</option>
                        <option value="+36">+36 (Hungary)</option>
                        <option value="+354">+354 (Iceland)</option>
                        <option value="+91">+91 (India)</option>
                        <option value="+62">+62 (Indonesia)</option>
                        <option value="+98">+98 (Iran)</option>
                        <option value="+964">+964 (Iraq)</option>
                        <option value="+353">+353 (Ireland)</option>
                        <option value="+972">+972 (Israel)</option>
                        <option value="+39">+39 (Italy)</option>
                        <option value="+225">+225 (Ivory Coast)</option>
                        <option value="+1">+1 (Jamaica)</option>
                        <option value="+81">+81 (Japan)</option>
                        <option value="+962">+962 (Jordan)</option>
                        <option value="+7">+7 (Kazakhstan)</option>
                        <option value="+254">+254 (Kenya)</option>
                        <option value="+82">+82 (South Korea)</option>
                        <option value="+965">+965 (Kuwait)</option>
                        <option value="+996">+996 (Kyrgyzstan)</option>
                        <option value="+856">+856 (Laos)</option>
                        <option value="+371">+371 (Latvia)</option>
                        <option value="+961">+961 (Lebanon)</option>
                        <option value="+266">+266 (Lesotho)</option>
                        <option value="+231">+231 (Liberia)</option>
                        <option value="+218">+218 (Libya)</option>
                        <option value="+423">+423 (Liechtenstein)</option>
                        <option value="+370">+370 (Lithuania)</option>
                        <option value="+352">+352 (Luxembourg)</option>
                        <option value="+853">+853 (Macau)</option>
                        <option value="+389">+389 (Macedonia)</option>
                        <option value="+261">+261 (Madagascar)</option>
                        <option value="+265">+265 (Malawi)</option>
                        <option value="+60">+60 (Malaysia)</option>
                        <option value="+960">+960 (Maldives)</option>
                        <option value="+223">+223 (Mali)</option>
                        <option value="+356">+356 (Malta)</option>
                        <option value="+222">+222 (Mauritania)</option>
                        <option value="+230">+230 (Mauritius)</option>
                        <option value="+52">+52 (Mexico)</option>
                        <option value="+373">+373 (Moldova)</option>
                        <option value="+377">+377 (Monaco)</option>
                        <option value="+976">+976 (Mongolia)</option>
                        <option value="+382">+382 (Montenegro)</option>
                        <option value="+212">+212 (Morocco)</option>
                        <option value="+258">+258 (Mozambique)</option>
                        <option value="+95">+95 (Myanmar)</option>
                        <option value="+264">+264 (Namibia)</option>
                        <option value="+977">+977 (Nepal)</option>
                        <option value="+31">+31 (Netherlands)</option>
                        <option value="+64">+64 (New Zealand)</option>
                        <option value="+505">+505 (Nicaragua)</option>
                        <option value="+227">+227 (Niger)</option>
                        <option value="+234">+234 (Nigeria)</option>
                        <option value="+47">+47 (Norway)</option>
                        <option value="+968">+968 (Oman)</option>
                        <option value="+92">+92 (Pakistan)</option>
                        <option value="+970">+970 (Palestine)</option>
                        <option value="+507">+507 (Panama)</option>
                        <option value="+675">+675 (Papua New Guinea)</option>
                        <option value="+595">+595 (Paraguay)</option>
                        <option value="+51">+51 (Peru)</option>
                        <option value="+63">+63 (Philippines)</option>
                        <option value="+48">+48 (Poland)</option>
                        <option value="+351">+351 (Portugal)</option>
                        <option value="+974">+974 (Qatar)</option>
                        <option value="+40">+40 (Romania)</option>
                        <option value="+7">+7 (Russia)</option>
                        <option value="+250">+250 (Rwanda)</option>
                        <option value="+966">+966 (Saudi Arabia)</option>
                        <option value="+221">+221 (Senegal)</option>
                        <option value="+381">+381 (Serbia)</option>
                        <option value="+248">+248 (Seychelles)</option>
                        <option value="+232">+232 (Sierra Leone)</option>
                        <option value="+65">+65 (Singapore)</option>
                        <option value="+421">+421 (Slovakia)</option>
                        <option value="+386">+386 (Slovenia)</option>
                        <option value="+252">+252 (Somalia)</option>
                        <option value="+27">+27 (South Africa)</option>
                        <option value="+211">+211 (South Sudan)</option>
                        <option value="+34">+34 (Spain)</option>
                        <option value="+94">+94 (Sri Lanka)</option>
                        <option value="+249">+249 (Sudan)</option>
                        <option value="+597">+597 (Suriname)</option>
                        <option value="+268">+268 (Swaziland)</option>
                        <option value="+46">+46 (Sweden)</option>
                        <option value="+41">+41 (Switzerland)</option>
                        <option value="+963">+963 (Syria)</option>
                        <option value="+886">+886 (Taiwan)</option>
                        <option value="+992">+992 (Tajikistan)</option>
                        <option value="+255">+255 (Tanzania)</option>
                        <option value="+66">+66 (Thailand)</option>
                        <option value="+228">+228 (Togo)</option>
                        <option value="+216">+216 (Tunisia)</option>
                        <option value="+90">+90 (Turkey)</option>
                        <option value="+993">+993 (Turkmenistan)</option>
                        <option value="+256">+256 (Uganda)</option>
                        <option value="+380">+380 (Ukraine)</option>
                        <option value="+971">+971 (United Arab Emirates)</option>
                        <option value="+44">+44 (United Kingdom)</option>
                        <option value="+1">+1 (United States)</option>
                        <option value="+598">+598 (Uruguay)</option>
                        <option value="+998">+998 (Uzbekistan)</option>
                        <option value="+58">+58 (Venezuela)</option>
                        <option value="+84">+84 (Vietnam)</option>
                        <option value="+967">+967 (Yemen)</option>
                        <option value="+260">+260 (Zambia)</option>
                        <option value="+263">+263 (Zimbabwe)</option>
                      </select>
                      <input
                        type="tel"
                        value={profile.phone_number}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                        className="w-full px-4 py-3 rounded-r-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      placeholder="Enter your address"
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-3 bg-[#1B4965] hover:bg-[#62B6CB] text-white font-medium rounded-lg transition-colors duration-300 flex items-center"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-[#1B4965] mb-8">Security Settings</h1>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#62B6CB] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-3 bg-[#1B4965] hover:bg-[#62B6CB] text-white font-medium rounded-lg transition-colors duration-300 flex items-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile 