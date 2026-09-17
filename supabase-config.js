const SUPABASE_URL = "https://mukfujnqbmtlhexzvway.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HY5ixDdIar8ESW0u8dOpKA_HD6JVY0G";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
