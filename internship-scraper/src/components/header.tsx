"use client";
import React from 'react';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Button } from '@nextui-org/button';
import useUser from '@/app/hook/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';


const Header = () => {

  const handleLoginWithOauth = (provider:"google")=>{
    const supabase = supabaseBrowser();
    
    supabase.auth.signInWithOAuth({
        provider,
        options:{
        redirectTo: location.origin + '/auth/callback'
      }
    })
  }

  const { isFetching, data } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  if(isFetching){
    return <></>
  }

  const handleLogOut  = async () => {
    const supabase = supabaseBrowser();
    queryClient.clear();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <header className="bg-white-800 py-4">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-white text-xl font-bold">
            2025 SWE/Quant/Bus Internships
          </Link>
          <div>
            {!data?.id ?
              <Button onClick={() => handleLoginWithOauth("google")} className="cursor-center flex items-center py-2 px-2 rounded-3xl text-white font-medium shadow-sm hover:bg-gray-800 border-blue-800 border-solid border-2">
                <FcGoogle className="w-5 h-5 mr-2" />
                Sign In
              </Button>:
              <Button onClick={() => handleLogOut()} className="cursor-center flex flex-col items-center py-2 px-2 rounded-3xl text-white font-medium shadow-sm hover:bg-gray-800 border-blue-800 border-solid border-2">
                <div className="text-center text-sm font-bold">
                  {data?.email}
                </div>
                <div className="text-xs text-gray-300">
                  Log Out
                </div>
              </Button>
            }
            
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
