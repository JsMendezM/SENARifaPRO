import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    // We will just do a dummy update or check the table columns
    const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_message_template')
        .limit(1);

    if (error) {
        console.error("Error fetching whatsapp_message_template from profiles:");
        console.error(error);
    } else {
        console.log("whatsapp_message_template exists. Data:", data);
    }
}

testUpdate();
