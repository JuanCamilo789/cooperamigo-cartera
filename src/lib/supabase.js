import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://tmpcwwprxrnbheodgkve.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtcGN3d3ByeHJuYmhlb2Rna3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTI4NzQsImV4cCI6MjA4NzE2ODg3NH0.CimJjOJb0J3zqfelk-R3ZYJgfzKLsDnmXEiAURvuzIo'

export const sb = createClient(SUPA_URL, SUPA_KEY)
