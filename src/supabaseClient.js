// supabaseClient.js (v1)
// This file connects your React app to your Supabase database.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjzwzcthlxetfsqftacn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqend6Y3RobHhldGZzcWZ0YWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzgzNzgsImV4cCI6MjA2NzgxNDM3OH0.pt_coCjafbBrlrJ0u5cBrBZlTsZbIjx2xaLKi5C4oxQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
