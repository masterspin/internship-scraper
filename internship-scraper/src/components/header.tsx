"use client";
import React from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@nextui-org/button";
import useUser from "@/app/hook/useUser";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import Routes from "./routes";

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

  const [isOpen, setIsOpen] = useState(false); // State variable to track dropdown visibility

  const toggleDropdown = () => {
    setIsOpen(!isOpen); // Toggle visibility on button click
  };

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
    <header className="bg-white-800 py-4">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-white text-xl font-bold">
            2025 SWE/Quant/EE Internships
          </Link>
          <div>
            {
              !data?.id ? (
                <Button
                  onClick={() => handleLoginWithOauth("google")}
                  className="cursor-center flex items-center py-2 px-2 rounded-lg text-white font-medium shadow-sm hover:bg-gray-800 border-gray-800 border-solid border-2"
                >
                  <FcGoogle className="w-5 h-5 mr-2" />
                  Track Applications
                </Button>
              ) : (
                <div className="relative">
                  <button
                    id="dropdownInformationButton"
                    className="text-white font-medium rounded-lg text-sm px-3 py-2.5 text-center inline-flex items-center dark:bg-gray-700 dark:hover:bg-gray-600"
                    type="button"
                    onClick={toggleDropdown} // Call toggle function on click
                  >
                    {data?.email}
                    <svg
                      className="w-2.5 h-2.5 ms-3"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  </button>
                  {isOpen && ( // Render dropdown content only when isOpen is true
                    <div
                      id="dropdownInformation"
                      className="z-10 absolute top-full left-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-w-44 dark:bg-gray-700 dark:divide-gray-600"
                    >
                      <ul
                        className="py-2 text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="dropdownInformationButton"
                      >
                        <li>
                          <Link
                            href={Routes.Home}
                            className="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                          >
                            Opportunities
                          </Link>
                        </li>
                        <li>
                          <Link
                            href={Routes.Analytics}
                            className="block px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                          >
                            Analytics
                          </Link>
                        </li>
                      </ul>
                      <div className="py-2">
                        <button
                          onClick={() => handleLogOut()}
                          className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          <span className="flex items-center">
                            Sign out
                            <FaArrowRightFromBracket className="ml-2 mr-12"></FaArrowRightFromBracket>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
