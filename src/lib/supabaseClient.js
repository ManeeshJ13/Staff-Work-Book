import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pklyecpjduhdqebnvknt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHllY3BqZHVoZHFlYm52a250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNDcyODMsImV4cCI6MjA1ODkyMzI4M30.DMZeos9CJuKYbeDUpDixpO5TwyQR-pT-g3Ex8KhsItc';



export const supabase = createClient(supabaseUrl, supabaseKey);

