import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { Database } from "../database.types";
// Better to move these to a .env file in a real app
const SUPABASE_URL = "https://rhdlvwyzlqzdeabhvrsf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZGx2d3l6bHF6ZGVhYmh2cnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTUxNDgsImV4cCI6MjA2NDUzMTE0OH0.Qf20nSqah0dl83tCqL5czy6znFoLPvZCtrxGa01N3Uk";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
