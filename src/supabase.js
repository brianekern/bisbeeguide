import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqdtpqhspxclikybkbyw.supabase.co'
const supabaseKey = 'sb_publishable_5ad5qIP1RVTmr0pG7mcGRA_KxmXLjFT'

export const supabase = createClient(supabaseUrl, supabaseKey)
