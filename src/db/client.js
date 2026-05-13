import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config.js';

let client = null;

export function getDb() {
    if (!client) {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return client;
}
