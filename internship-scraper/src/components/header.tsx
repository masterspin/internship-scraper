"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import Routes from "./routes";
import { ThemeToggle } from "@/components/theme-toggle";
import useUser from "@/app/hook/useUser";

// Import shadcn components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const handleLoginWithOauth = (provider: "google") => {
    const supabase = supabaseBrowser();

    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: location.origin + "/auth/callback",
      },
    });
  };

  const { isFetching, data } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (isFetching) {
    return <></>;
  }

  const handleLogOut = async () => {
    const supabase = supabaseBrowser();
    queryClient.clear();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Internships
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {!data?.id ? (
            <Button
              onClick={() => handleLoginWithOauth("google")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FcGoogle className="w-5 h-5" />
              Track Applications
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  {data?.email}
                  <svg
                    className="w-2.5 h-2.5 ms-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={Routes.Home}>Opportunities</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={Routes.Analytics}>Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogOut}
                  className="flex items-center"
                >
                  Sign out <FaArrowRightFromBracket className="ml-2" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
