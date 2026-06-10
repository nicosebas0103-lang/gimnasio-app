import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kxmiivheqzizimhceiep.supabase.co'
const supabaseKey = 'sb_publishable_pHW-rlgOXEJFle-11Shpyg_nxl3bw0b'

export const supabase = createClient(supabaseUrl, supabaseKey)