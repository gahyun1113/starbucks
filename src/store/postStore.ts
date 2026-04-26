import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Post {
  id: string;
  type: 'promotion' | 'event' | 'notice';
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  title: string;
  content: string;
  cautions?: string;
  images?: string[];
}

interface PostStore {
  posts: Post[];
  isLoading: boolean;
  fetchPosts: () => Promise<void>;
  addPost: (post: Omit<Post, 'id'>) => Promise<void>;
  updatePost: (id: string, post: Partial<Omit<Post, 'id'>>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  isLoading: false,

  fetchPosts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchPosts error:', error);
    } else {
      set({ posts: data as Post[] });
    }
    set({ isLoading: false });
  },

  addPost: async (postData) => {
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();

    if (error) {
      console.error('addPost error:', error);
      throw error;
    }
    set((state) => ({ posts: [data as Post, ...state.posts] }));
  },

  updatePost: async (id, postData) => {
    const { data, error } = await supabase
      .from('posts')
      .update(postData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('updatePost error:', error);
      throw error;
    }
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? (data as Post) : p)),
    }));
  },

  deletePost: async (id) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      console.error('deletePost error:', error);
      throw error;
    }
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }));
  },
}));
