"use client";
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useQuery } from '@tanstack/react-query'

export default function useUser() {
  return useQuery({
    queryKey:["user"],
    queryFn: async ()=>{
        const supabase = supabaseBrowser();
        const { data } = await supabase.auth.getSession();
        if(data.session?.user){
            const {data:user} = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
            return user;
        }
        return null;
    },
  })
}
