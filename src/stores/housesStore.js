import { create } from 'zustand'
import { supabase } from '../config/supabase'

const useHousesStore = create((set) => ({
  houses: [],
  currentHouse: null,
  loading: false,
  error: null,

  fetchHouses: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
      
      if (error) throw error
      set({ houses: data, error: null })
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchHouseById: async (id) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      set({ currentHouse: data, error: null })
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  clearCurrentHouse: () => {
    set({ currentHouse: null })
  }
}))

export default useHousesStore 