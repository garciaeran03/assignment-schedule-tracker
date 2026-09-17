const SUPABASE_URL = "https://mukfujnqbmtlhexzvway.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a2Z1am5xYm10bGhleHp2d2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MTEyMjgsImV4cCI6MjEwNTE4NzIyOH0.sRUPOWYQ6hYj7NVNK4E8i-XTBDk5zdx8gLLLSUfSs3A";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
