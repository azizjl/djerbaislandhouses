import { create } from 'zustand'
import { supabase } from '../config/supabase'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  role: null,
  setRole: (role) => set({ role }),
  
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },


  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null })
    } catch (error) {
      console.error('Error signing out:', error.message)
    }
  }
}))

export default useAuthStore 