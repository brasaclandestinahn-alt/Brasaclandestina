import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dttzcmwxtdxmnttituov.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dHpjbXd4dGR4bW50dGl0dW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTUwODYsImV4cCI6MjA5MjE5MTA4Nn0.em8ani9304qw1QQJxgcQE7-AQnFglXtpbvEOEDCKdaA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
