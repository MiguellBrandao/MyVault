import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://wobdvufqmkjiaonstzno.supabase.co'
// A anon key é pública por desenho; a segurança vem das políticas RLS.
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYmR2dWZxbWtqaWFvbnN0em5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTAxMTUsImV4cCI6MjA5OTE2NjExNX0.Zz5qy9lhb-moRgT1RkuXfy_IncZxGMqkf3GBfdl-Cr4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
