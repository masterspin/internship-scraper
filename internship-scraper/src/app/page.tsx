"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/header";
import Form from "@/components/modal";
import EditForm from "@/components/editModal";
import DeleteForm from "@/components/deleteModal";
import useSharedFormState from "@/app/hook/useCustomJobPosts";

import { supabaseBrowser } from "@/lib/supabase/browser";
import useUser from "@/app/hook/useUser";
import { FaFile, FaGithub, FaLinkedin } from "react-icons/fa";
import { FaBoltLightning } from "react-icons/fa6";
import { Loader2, X, InfoIcon } from "lucide-react";

// Import Shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useDebounce } from "use-debounce";
import Fuse from "fuse.js";

const supabase = supabaseBrowser();

export default function Home() {
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const { customJobPosts, setCustomJobPosts } = useSharedFormState();
  const [filteredJobPosts, setFilteredJobPosts] = useState<any[]>([]);
  const [shownPosts, setShownPosts] = useState<any[]>([]);
  const [hasStatus, setHasStatus] = useState(false);
  const [selectedButton, setSelectedButton] = useState(0);
  const [filterOption, setFilterOption] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<(string | number)[]>(
    () => {
      // Try to load from localStorage if we're in the browser
      if (typeof window !== "undefined") {
        const savedSources = localStorage.getItem("selectedSources");
        return savedSources ? JSON.parse(savedSources) : [0]; // Default to LinkedIn SWE if nothing saved
      }
      return [0]; // Default for SSR
    }
  );
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    // Try to load search query from localStorage if we're in the browser
    if (typeof window !== "undefined") {
      const savedSearch = localStorage.getItem("searchQuery");
      return savedSearch || ""; // Return saved search or empty string
    }
    return ""; // Default for SSR
  });
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [showBanner, setShowBanner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Show 50 items per page
  const [totalItems, setTotalItems] = useState(0);

  const { isFetching, data } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      setHasStatus(false);

      try {
        // Fetch job posts and custom applications
        const [
          { data: jobData, error: jobError },
          { data: customApplications, error: customAppError },
        ] = await Promise.all([
          supabase.from("posts").select("*"),
          data
            ? supabase
                .from("custom_applications")
                .select("*")
                .eq("user", data.id)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (jobError) throw jobError;
        if (customAppError) throw customAppError;

        let newJobPosts = jobData;

        if (data) {
          // Fetch all statuses for the given userId
          const { data: statuses, error: statusesError } = await supabase
            .from("statuses")
            .select("job, status")
            .eq("user", data.id);

          if (statusesError) throw statusesError;

          // Create a map of statuses for quick lookup
          const statusMap = statuses.reduce((acc: any, { job, status }) => {
            acc[job] = status;
            return acc;
          }, {});

          // Map job posts to their statuses
          newJobPosts = jobData.map((jobPost) => {
            const status = statusMap[jobPost.job_link] || "Not Applied";
            return { ...jobPost, status };
          });
        }

        setJobPosts(newJobPosts);
        setCustomJobPosts(customApplications);
      } catch (error: any) {
        console.error("Error fetching job posts:", error.message);
      } finally {
        setHasStatus(true);
      }
    };

    if (!isFetching) {
      fetchData();
    }
  }, [data]);

  const handleStatusChange = async (value: string, jobId: string) => {
    const newStatus = value;

    // First, update filteredJobPosts to maintain consistency when paging
    setFilteredJobPosts(
      filteredJobPosts.map((post) => {
        if (post.job_link === jobId) {
          return { ...post, status: newStatus };
        }
        return post;
      })
    );

    // Update shownPosts directly to maintain the current page view
    setShownPosts(
      shownPosts.map((post) => {
        if (post.job_link === jobId) {
          return { ...post, status: newStatus };
        }
        return post;
      })
    );

    // Also update the base data stores
    setJobPosts(
      jobPosts.map((jobPost) => {
        if (jobPost.job_link === jobId) {
          return { ...jobPost, status: newStatus };
        }
        return jobPost;
      })
    );

    setCustomJobPosts(
      customJobPosts.map((jobPost) => {
        if (jobPost.job_link === jobId) {
          return { ...jobPost, status: newStatus };
        }
        return jobPost;
      })
    );

    // Don't re-filter or change pagination here

    // Update the database
    if (data && selectedButton !== 4) {
      try {
        const { data: updateData, error } = await supabase
          .from("statuses")
          .upsert({ user: data.id, job: jobId, status: newStatus })
          .select("*");
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error("Error updating job status:", error.message);
      }
    }

    if (data && selectedButton === 4) {
      try {
        const { data: updateData, error } = await supabase
          .from("custom_applications")
          .upsert({ user: data.id, job_link: jobId, status: newStatus })
          .select("*");
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error("Error updating job status:", error.message);
      }
    }
  };

  const handleSourceClick = (index: number) => {
    setSelectedButton(index);
    setHasStatus(false);
    setIsLoading(true);
    let filteredData = [];
    if (jobPosts) {
      const currentYear = new Date().getFullYear();
      switch (index) {
        case 0:
          filteredData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "LinkedIn" && jobPost.job_type === "SWE"
            )
            .sort((a, b) => {
              // First sort by date
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              const dateDiff = dateB - dateA;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 1:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC")
            .sort((a, b) => {
              const parseDate = (date: string) => {
                const match = date.match(/(\d+)([a-z]+)/);
                if (!match) return 0;
                const [_, value, unit] = match;
                const multiplier = unit === "d" ? 1 : unit === "mo" ? 30 : 0;
                return parseInt(value) * multiplier;
              };

              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              return dateA - dateB;
            });
          break;
        case 2:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "CSCareers")
            .sort((a, b) => {
              const monthOrder = (date: string) => {
                const jobDate = new Date(`${date} ${currentYear}`);
                const currentMonth = new Date().getMonth();
                const jobMonth = jobDate.getMonth();
                return (currentMonth - jobMonth + 12) % 12;
              };

              const dateA = monthOrder(a.date);
              const dateB = monthOrder(b.date);
              return dateA - dateB;
            });
          break;
        case 3:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC Off-Season")
            .sort((a, b) => {
              const parseDate = (date: string) => {
                const match = date.match(/(\d+)([a-z]+)/);
                if (!match) return 0;
                const [_, value, unit] = match;
                const multiplier = unit === "d" ? 1 : unit === "mo" ? 30 : 0;
                return parseInt(value) * multiplier;
              };

              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              return dateA - dateB;
            });
          break;
        case 4:
          filteredData = customJobPosts.sort((a, b) => {
            const dateA: any = new Date(a.date);
            const dateB: any = new Date(b.date);
            const dateDiff = dateB - dateA;
            
            // If dates are equal, sort by company name
            if (dateDiff === 0) {
              return a.company_name.localeCompare(b.company_name);
            }
            
            return dateDiff;
          });
          break;
        case 5:
          filteredData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "LinkedIn" && jobPost.job_type === "QUANT"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              const dateDiff = dateB - dateA;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 6:
          filteredData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "LinkedIn" && jobPost.job_type === "BUS"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              const dateDiff = dateB - dateA;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 7:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC New Grad")
            .sort((a, b) => {
              const parseDate = (date: string) => {
                const match = date.match(/(\d+)([a-z]+)/);
                if (!match) return 0;
                const [_, value, unit] = match;
                const multiplier = unit === "d" ? 1 : unit === "mo" ? 30 : 0;
                return parseInt(value) * multiplier;
              };

              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              return dateA - dateB;
            });
          break;
        case 8:
          filteredData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "airtable" && jobPost.job_type === "EE"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              const dateDiff = dateB - dateA;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 9:
          filteredData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "airtable" && jobPost.job_type === "Hardware"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              const dateDiff = dateB - dateA;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 10:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "CSCareers Off-Season")
            .sort((a, b) => {
              const monthOrder = (date: string) => {
                const jobDate = new Date(`${date} ${currentYear}`);
                const currentMonth = new Date().getMonth();
                const jobMonth = jobDate.getMonth();
                return (currentMonth - jobMonth + 12) % 12;
              };

              const dateA = monthOrder(a.date);
              const dateB = monthOrder(b.date);
              return dateA - dateB;
            });
          break;
        default:
          filteredData = [...jobPosts];
          break;
      }
      setFilterOption("All");
      setFilteredJobPosts(filteredData);
    }
    setIsLoading(false);
    setHasStatus(true);
  };

  const handleSourcesChange = (sources: (string | number)[]) => {
    // Save selected sources to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSources", JSON.stringify(sources));
    }
    
    setSelectedSources(sources);
    setHasStatus(false);
    setIsLoading(true);

    // If no sources selected, show empty array
    if (sources.length === 0) {
      setFilteredJobPosts([]);
      setIsLoading(false);
      setHasStatus(true);
      return;
    }

    // Combine data from all selected sources
    let combinedData: any[] = [];
    const currentYear = new Date().getFullYear();

    sources.forEach((sourceId) => {
      let sourceData: any[] = [];
      const index = Number(sourceId);

      switch (index) {
        case 0:
          sourceData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "LinkedIn" && jobPost.job_type === "SWE"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              const dateDiff = dateB - dateA;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 1:
          sourceData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC")
            .sort((a, b) => {
              const parseDate = (date: string) => {
                const match = date.match(/(\d+)([a-z]+)/);
                if (!match) return 0;
                const [_, value, unit] = match;
                const multiplier = unit === "d" ? 1 : unit === "mo" ? 30 : 0;
                return parseInt(value) * multiplier;
              };

              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              
              // Primary sort by date
              const dateDiff = dateA - dateB;
              
              // If dates are equal, sort by company name
              if (dateDiff === 0) {
                return a.company_name.localeCompare(b.company_name);
              }
              
              return dateDiff;
            });
          break;
        case 2:
          sourceData = jobPosts
            .filter((jobPost) => jobPost.source === "CSCareers")
            .sort((a, b) => {
              const monthOrder = (date: string) => {
                const jobDate = new Date(`${date} ${currentYear}`);
                const currentMonth = new Date().getMonth();
                const jobMonth = jobDate.getMonth();
                return (currentMonth - jobMonth + 12) % 12;
              };

              const dateA = monthOrder(a.date);
              const dateB = monthOrder(b.date);
              return dateA - dateB;
            });
          break;
        case 3:
          sourceData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC Off-Season")
            .sort((a, b) => {
              const parseDate = (date: string) => {
                const match = date.match(/(\d+)([a-z]+)/);
                if (!match) return 0;
                const [_, value, unit] = match;
                const multiplier = unit === "d" ? 1 : unit === "mo" ? 30 : 0;
                return parseInt(value) * multiplier;
              };

              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              return dateA - dateB;
            });
          break;
        case 4:
          sourceData = customJobPosts.sort((a, b) => {
            const dateA: any = new Date(a.date);
            const dateB: any = new Date(b.date);
            return dateB - dateA;
          });
          break;
        case 5:
          sourceData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "LinkedIn" && jobPost.job_type === "QUANT"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              return dateB - dateA;
            });
          break;
        case 6:
          sourceData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "LinkedIn" && jobPost.job_type === "BUS"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              return dateB - dateA;
            });
          break;
        case 7:
          sourceData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC New Grad")
            .sort((a, b) => {
              const parseDate = (date: string) => {
                const match = date.match(/(\d+)([a-z]+)/);
                if (!match) return 0;
                const [_, value, unit] = match;
                const multiplier = unit === "d" ? 1 : unit === "mo" ? 30 : 0;
                return parseInt(value) * multiplier;
              };

              const dateA = parseDate(a.date);
              const dateB = parseDate(b.date);
              return dateA - dateB;
            });
          break;
        case 8:
          sourceData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "airtable" && jobPost.job_type === "EE"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              return dateB - dateA;
            });
          break;
        case 9:
          sourceData = jobPosts
            .filter(
              (jobPost) =>
                jobPost.source === "airtable" && jobPost.job_type === "Hardware"
            )
            .sort((a, b) => {
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              return dateB - dateA;
            });
          break;
        case 10:
          sourceData = jobPosts
            .filter((jobPost) => jobPost.source === "CSCareers Off-Season")
            .sort((a, b) => {
              const monthOrder = (date: string) => {
                const jobDate = new Date(`${date} ${currentYear}`);
                const currentMonth = new Date().getMonth();
                const jobMonth = jobDate.getMonth();
                return (currentMonth - jobMonth + 12) % 12;
              };

              const dateA = monthOrder(a.date);
              const dateB = monthOrder(b.date);
              return dateA - dateB;
            });
          break;
      }

      // Only add if there is data
      if (sourceData.length > 0) {
        combinedData = [...combinedData, ...sourceData];
      }
    });

    // Sort the combined data consistently by date first, then alphabetically by company
    combinedData = sortCombinedJobPosts(combinedData);

    // Set most recently selected button for backward compatibility
    if (sources.length > 0) {
      setSelectedButton(Number(sources[0]));
    }

    setFilterOption("All");
    setFilteredJobPosts(combinedData);
    setIsLoading(false);
    setHasStatus(true);
  };

  // Helper function to sort combined job posts consistently
  const sortCombinedJobPosts = (posts: any[]): any[] => {
    const currentYear = new Date().getFullYear();
    const now = new Date();

    // Convert all dates to comparable timestamps for consistent sorting
    const postsWithTimestamps = posts.map((post) => {
      const originalPost = { ...post };

      // Normalize the date to a timestamp
      let timestamp: number;

      if (post.date instanceof Date) {
        timestamp = post.date.getTime();
      } else if (typeof post.date === "string") {
        const dateStr = post.date.trim();

        // MM-DD-YYYY format (e.g. "05-08-2025")
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          const [month, day, year] = dateStr.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          timestamp = date.getTime();
        }
        // YYYY-MM-DD format
        else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          timestamp = new Date(dateStr).getTime();
        }
        // Relative date format like "5d" or "2mo"
        else if (/^(\d+)([a-z]+)$/.test(dateStr)) {
          const match = dateStr.match(/^(\d+)([a-z]+)$/);
          if (match) {
            const [_, value, unit] = match;
            const daysAgo =
              parseInt(value) * (unit === "d" ? 1 : unit === "mo" ? 30 : 0);

            // Create a date that's X days in the past from today
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            timestamp = date.getTime();
          } else {
            // Fallback timestamp (old)
            timestamp = 0;
          }
        }
        // Month name format like "January", "February", etc.
        else if (/^[A-Za-z]+$/.test(dateStr)) {
          try {
            // Parse month name to a date
            const tempDate = new Date(`${dateStr} 1, ${currentYear}`);

            if (!isNaN(tempDate.getTime())) {
              // If the month is in the future, assume it's from last year
              if (tempDate > now) {
                tempDate.setFullYear(currentYear - 1);
              }
              timestamp = tempDate.getTime();
            } else {
              // Fallback timestamp (old)
              timestamp = 0;
            }
          } catch (e) {
            // Fallback timestamp (old)
            timestamp = 0;
          }
        }
        // Month + Day format like "January 15"
        else if (/^[A-Za-z]+ \d+$/.test(dateStr)) {
          try {
            // Parse "Month Day" format
            const tempDate = new Date(`${dateStr}, ${currentYear}`);

            if (!isNaN(tempDate.getTime())) {
              // If the date is in the future, assume it's from last year
              if (tempDate > now) {
                tempDate.setFullYear(currentYear - 1);
              }
              timestamp = tempDate.getTime();
            } else {
              // Fallback timestamp (old)
              timestamp = 0;
            }
          } catch (e) {
            // Fallback timestamp (old)
            timestamp = 0;
          }
        } else {
          // Fallback timestamp (old)
          timestamp = 0;
        }
      } else {
        // Fallback timestamp (old)
        timestamp = 0;
      }

      return {
        ...originalPost,
        _timestamp: timestamp,
        _originalDate: post.date, // Keep original for debugging
        _sortKey: `${post.company_name}_${post.job_role}` // Add a stable sort key that doesn't change with status
      };
    });

    // Sort by timestamp (newest first) then by company name alphabetically for same dates
    return postsWithTimestamps
      .sort((a, b) => {
        // Primary sort by timestamp (newest first)
        const timestampDiff = b._timestamp - a._timestamp;

        // If timestamps are equal, sort alphabetically by company name
        if (timestampDiff === 0) {
          return a.company_name.localeCompare(b.company_name);
        }

        return timestampDiff;
      })
      .map((post) => {
        // Remove the temporary fields
        const { _timestamp, _originalDate, _sortKey, ...cleanPost } = post;
        return cleanPost;
      });
  };

  const handleFilterClick = (value: string, resetPage: boolean = true) => {
    setFilterOption(value);
    setHasStatus(false);
    setIsLoading(true);
    if (resetPage) {
      setCurrentPage(1); // Only reset to first page when explicitly requested
    }

    let filteredData = [];
    if (filteredJobPosts) {
      switch (value) {
        case "Not Applied":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Not Applied"
          );
          break;
        case "Applied":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Applied"
          );
          break;
        case "OA Received":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "OA Received"
          );
          break;
        case "Interview Scheduled":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Interview Scheduled"
          );
          break;
        case "Waitlisted":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Waitlisted"
          );
          break;
        case "Rejected":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Rejected"
          );
          break;
        case "Offer Received":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Offer Recevied"
          );
          break;
        case "Accepted":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Accepted"
          );
          break;
        case "Will Not Apply":
          filteredData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Will Not Apply"
          );
          break;
        default:
          filteredData = filteredJobPosts;
          break;
      }

      // Update total count for pagination
      setTotalItems(filteredData.length);

      // Get current page of data
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex); // Show current page

      setShownPosts(paginatedData);
    }
    setIsLoading(false);
    setHasStatus(true);
  };

  // Add a useEffect to handle pagination changes
  useEffect(() => {
    if (!filteredJobPosts.length || !hasStatus || isLoading) return;

    let dataToPage = filteredJobPosts;

    // Apply status filter if needed
    if (filterOption !== "All" && data) {
      dataToPage = filteredJobPosts.filter(
        (post) => post.status === filterOption
      );
    }

    // Apply search filter if needed
    if (debouncedSearchQuery.trim()) {
      const fuseOptions = {
        keys: ["job_role", "company_name", "location"],
        threshold: 0.33,
        ignoreLocation: true,
        shouldSort: true,
      };

      const fuse = new Fuse(dataToPage, fuseOptions);
      dataToPage = fuse
        .search(debouncedSearchQuery)
        .map((result) => result.item);
    }

    // Update total count
    setTotalItems(dataToPage.length);

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = dataToPage.slice(startIndex, endIndex);

    setShownPosts(paginatedData);
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchQuery,
    filterOption,
    filteredJobPosts,
    hasStatus,
    isLoading,
  ]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of results
    window.scrollTo({
      top: document.getElementById("resultsTop")?.offsetTop || 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    handleSourceClick(selectedButton);
  }, [jobPosts, customJobPosts]);

  useEffect(() => {
    handleFilterClick(filterOption, false); // Don't reset page when re-filtering after status changes
  }, [filteredJobPosts]);

  useEffect(() => {
    // Initialize with the default source when data is loaded
    if (jobPosts.length > 0) {
      handleSourcesChange(selectedSources);
    }
  }, [jobPosts, customJobPosts]);

  // Apply search filter whenever search query changes
  useEffect(() => {
    if (!hasStatus || isLoading) return;

    // If no search query, show all posts based on current filters
    if (!debouncedSearchQuery.trim()) {
      handleFilterClick(filterOption, false); // Don't reset page
      return;
    }

    // Configure Fuse for fuzzy searching
    const fuseOptions = {
      keys: ["job_role", "company_name", "location"],
      threshold: 0.33, // Lower threshold = more strict matching
      ignoreLocation: true,
      shouldSort: true,
    };

    const fuse = new Fuse(filteredJobPosts, fuseOptions);
    const searchResults = fuse
      .search(debouncedSearchQuery)
      .map((result) => result.item);

    // Apply status filter to search results if needed
    let filteredResults = searchResults;
    if (filterOption !== "All" && data) {
      filteredResults = searchResults.filter(
        (post) => post.status === filterOption
      );
    }

    setShownPosts(filteredResults);
  }, [
    debouncedSearchQuery,
    filteredJobPosts,
    filterOption,
    hasStatus,
    isLoading,
  ]);

  if (isFetching) {
    return <></>;
  }

  // Helper function to get status color classes
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "Not Applied":
        return "text-gray-600";
      case "Applied":
        return "text-gray-700 dark:text-gray-300";
      case "OA Received":
        return "text-purple-500";
      case "Interview Scheduled":
        return "text-blue-500";
      case "Waitlisted":
        return "text-yellow-500";
      case "Rejected":
        return "text-red-500";
      case "Offer Received":
        return "text-green-500";
      case "Accepted":
        return "text-emerald-600";
      case "Will Not Apply":
        return "text-amber-800";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div>
      <Header />

      {/* Information Banner */}
      {showBanner && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <InfoIcon className="h-5 w-5 text-white" />
                <div className="text-white">
                  <p className="text-sm font-medium">
                    We are migrating to{" "}
                    <a
                      href="https://internships.ritij.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-white hover:text-gray-200"
                    >
                      internships.ritij.dev
                    </a>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {hasStatus ? (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-8 flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Filter - Multi-select */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Sources</label>
                  <MultiSelect
                    options={[
                      {
                        value: 0,
                        label: "SWE",
                        icon: <FaLinkedin size={16} />,
                      },
                      {
                        value: 5,
                        label: "QUANT",
                        icon: <FaLinkedin size={16} />,
                      },
                      {
                        value: 6,
                        label: "Business",
                        icon: <FaLinkedin size={16} />,
                      },
                      {
                        value: 1,
                        label: "PittCSC",
                        icon: <FaGithub size={16} />,
                      },
                      {
                        value: 2,
                        label: "CSCareers",
                        icon: <FaGithub size={16} />,
                      },
                      {
                        value: 3,
                        label: "PittCSC Off-Season",
                        icon: <FaGithub size={16} />,
                      },
                      {
                        value: 10,
                        label: "CSCareers Off-Season",
                        icon: <FaGithub size={16} />,
                      },
                      {
                        value: 7,
                        label: "PittCSC New Grad",
                        icon: <FaGithub size={16} />,
                      },
                      {
                        value: 8,
                        label: "EE",
                        icon: <FaBoltLightning size={16} />,
                      },
                      {
                        value: 9,
                        label: "Hardware",
                        icon: <FaBoltLightning size={16} />,
                      },
                      ...(data
                        ? [
                            {
                              value: 4,
                              label: "Personal Applications",
                              icon: <FaFile size={16} />,
                            },
                          ]
                        : []),
                    ]}
                    selected={selectedSources}
                    onChange={(sources) => {
                      // Save to localStorage when sources change
                      if (typeof window !== "undefined") {
                        localStorage.setItem(
                          "selectedSources",
                          JSON.stringify(sources)
                        );
                      }
                      handleSourcesChange(sources);
                    }}
                    placeholder="Select sources..."
                  />
                </div>

                {/* Status Filter - Show only when user is logged in */}
                {data && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="status-filter"
                      className="text-sm font-medium"
                    >
                      Status
                    </label>
                    <Select
                      value={filterOption}
                      onValueChange={handleFilterClick}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Not Applied">Not Applied</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="OA Received">OA Received</SelectItem>
                        <SelectItem value="Interview Scheduled">
                          Interview(s)
                        </SelectItem>
                        <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Offer Received">
                          Offer Received
                        </SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Will Not Apply">
                          Will Not Apply
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Search input */}
              <div className="pt-2">
                <label htmlFor="search-filter" className="text-sm font-medium">
                  Search
                </label>
                <div className="relative mt-1">
                  <input
                    id="search-filter"
                    type="text"
                    placeholder="Search jobs by role, company, or location..."
                    value={searchQuery}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSearchQuery(newValue);
                      // Save to localStorage when search changes
                      if (typeof window !== "undefined") {
                        localStorage.setItem("searchQuery", newValue);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        // Also clear from localStorage
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("searchQuery");
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Add Personal Application button - only when user is logged in and personal apps selected */}
            {data && selectedSources.includes(4) && (
              <div className="flex justify-end">
                <Form />
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Top Pagination Controls */}
                  {totalItems > itemsPerPage && (
                    <div
                      id="resultsTop"
                      className="flex justify-between items-center border-b px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Showing{" "}
                          <span className="font-medium">
                            {(currentPage - 1) * itemsPerPage + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                          </span>{" "}
                          of <span className="font-medium">{totalItems}</span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Previous Page</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>

                          {/* Page numbers */}
                          <div className="hidden sm:flex space-x-2">
                            {Array.from({
                              length: Math.min(
                                5,
                                Math.ceil(totalItems / itemsPerPage)
                              ),
                            }).map((_, i) => {
                              // Calculate page numbers to show a window around current page
                              let pageNum: number | undefined;
                              const totalPages = Math.ceil(
                                totalItems / itemsPerPage
                              );

                              if (totalPages <= 5) {
                                // If 5 or fewer pages, show all
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                // Near the start
                                pageNum = i + 1;
                                if (i === 4) pageNum = totalPages;
                                if (i === 3 && totalPages > 5) pageNum = -1; // Ellipsis
                              } else if (currentPage >= totalPages - 2) {
                                // Near the end
                                if (i === 0) pageNum = 1;
                                if (i === 1 && totalPages > 5) pageNum = -1; // Ellipsis
                                if (i >= 2) pageNum = totalPages - (4 - i);
                              } else {
                                // Middle - show current and neighbors
                                if (i === 0) pageNum = 1;
                                if (i === 1) pageNum = -1; // Ellipsis
                                if (i === 2) pageNum = currentPage;
                                if (i === 3) pageNum = -1; // Ellipsis
                                if (i === 4) pageNum = totalPages;
                              }

                              // Render page button or ellipsis
                              if (pageNum === -1) {
                                return (
                                  <span
                                    key={`ellipsis-top-${i}`}
                                    className="px-2 py-1 text-muted-foreground"
                                  >
                                    ...
                                  </span>
                                );
                              }

                              return (
                                <Button
                                  key={`top-${pageNum}`}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    pageNum !== undefined &&
                                    handlePageChange(pageNum)
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={
                              currentPage >=
                              Math.ceil(totalItems / itemsPerPage)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Next Page</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5-4.25a.75.75 0 01-1.06-.02z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="block md:hidden">
                    {/* Mobile view - card-based layout */}
                    {shownPosts.map((shownPost: any) => (
                      <div key={shownPost.id} className="p-4 border-b">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">
                            <Link
                              href={shownPost.job_link}
                              target="_blank"
                              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {shownPost.job_role}
                            </Link>
                          </div>
                          {data && selectedButton === 4 && (
                            <div className="flex space-x-2">
                              <DeleteForm jobPost={shownPost} />
                              <EditForm jobPost={shownPost} />
                            </div>
                          )}
                        </div>
                        <div className="text-sm grid grid-cols-2 gap-2">
                          <div className="text-muted-foreground">Company:</div>
                          <div>{shownPost.company_name}</div>

                          <div className="text-muted-foreground">Location:</div>
                          <div>{shownPost.location}</div>

                          {/* {selectedButton === 3 && (
                            <>
                              <div className="text-muted-foreground">Term:</div>
                              <div>{shownPost.term}</div>
                            </>
                          )} */}

                          <div className="text-muted-foreground">Date:</div>
                          <div>{shownPost.date}</div>

                          {data && (
                            <>
                              <div className="text-muted-foreground">
                                Status:
                              </div>
                              <div>
                                <Select
                                  value={shownPost.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(
                                      value,
                                      shownPost.job_link
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={`w-full ${getStatusColorClass(
                                      shownPost.status
                                    )}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Not Applied">
                                      Not Applied
                                    </SelectItem>
                                    <SelectItem value="Applied">
                                      Applied
                                    </SelectItem>
                                    <SelectItem value="OA Received">
                                      OA Received
                                    </SelectItem>
                                    <SelectItem value="Interview Scheduled">
                                      Interview(s)
                                    </SelectItem>
                                    <SelectItem value="Waitlisted">
                                      Waitlisted
                                    </SelectItem>
                                    <SelectItem value="Rejected">
                                      Rejected
                                    </SelectItem>
                                    <SelectItem value="Offer Received">
                                      Offer Received
                                    </SelectItem>
                                    <SelectItem value="Accepted">
                                      Accepted
                                    </SelectItem>
                                    <SelectItem value="Will Not Apply">
                                      Will Not Apply
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Table className="hidden md:table">
                    <TableHeader className="bg-muted">
                      <TableRow>
                        {data && selectedButton === 4 && (
                          <TableHead className="w-[100px]">Actions</TableHead>
                        )}
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Location</TableHead>
                        {selectedButton === 3 && <TableHead>Term</TableHead>}
                        <TableHead>Date</TableHead>
                        {data && <TableHead>Status</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shownPosts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={data ? (selectedButton === 4 ? 6 : 5) : 4}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {searchQuery
                              ? "No results found. Try a different search term."
                              : "No jobs found."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        shownPosts.map((shownPost: any) => (
                          <TableRow key={shownPost.id}>
                            {data && selectedButton === 4 && (
                              <TableCell>
                                <div className="flex space-x-2">
                                  <DeleteForm jobPost={shownPost} />
                                  <EditForm jobPost={shownPost} />
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <Link
                                href={shownPost.job_link}
                                target="_blank"
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {shownPost.job_role}
                              </Link>
                            </TableCell>
                            <TableCell>{shownPost.company_name}</TableCell>
                            <TableCell>{shownPost.location}</TableCell>
                            {selectedButton === 3 && (
                              <TableCell>{shownPost.term}</TableCell>
                            )}
                            <TableCell>{shownPost.date}</TableCell>
                            {data && (
                              <TableCell>
                                <Select
                                  value={shownPost.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(
                                      value,
                                      shownPost.job_link
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={`w-[140px] ${getStatusColorClass(
                                      shownPost.status
                                    )}`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Not Applied">
                                      Not Applied
                                    </SelectItem>
                                    <SelectItem value="Applied">
                                      Applied
                                    </SelectItem>
                                    <SelectItem value="OA Received">
                                      OA Received
                                    </SelectItem>
                                    <SelectItem value="Interview Scheduled">
                                      Interview(s)
                                    </SelectItem>
                                    <SelectItem value="Waitlisted">
                                      Waitlisted
                                    </SelectItem>
                                    <SelectItem value="Rejected">
                                      Rejected
                                    </SelectItem>
                                    <SelectItem value="Offer Received">
                                      Offer Received
                                    </SelectItem>
                                    <SelectItem value="Accepted">
                                      Accepted
                                    </SelectItem>
                                    <SelectItem value="Will Not Apply">
                                      Will Not Apply
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalItems > itemsPerPage && (
                    <div
                      id="pagination"
                      className="flex justify-between items-center border-t px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Showing{" "}
                          <span className="font-medium">
                            {(currentPage - 1) * itemsPerPage + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                          </span>{" "}
                          of <span className="font-medium">{totalItems}</span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Previous Page</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>

                          {/* Page numbers */}
                          <div className="hidden sm:flex space-x-2">
                            {Array.from({
                              length: Math.min(
                                5,
                                Math.ceil(totalItems / itemsPerPage)
                              ),
                            }).map((_, i) => {
                              // Calculate page numbers to show a window around current page
                              let pageNum: number | undefined;
                              const totalPages = Math.ceil(
                                totalItems / itemsPerPage
                              );

                              if (totalPages <= 5) {
                                // If 5 or fewer pages, show all
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                // Near the start
                                pageNum = i + 1;
                                if (i === 4) pageNum = totalPages;
                                if (i === 3 && totalPages > 5) pageNum = -1; // Ellipsis
                              } else if (currentPage >= totalPages - 2) {
                                // Near the end
                                if (i === 0) pageNum = 1;
                                if (i === 1 && totalPages > 5) pageNum = -1; // Ellipsis
                                if (i >= 2) pageNum = totalPages - (4 - i);
                              } else {
                                // Middle - show current and neighbors
                                if (i === 0) pageNum = 1;
                                if (i === 1) pageNum = -1; // Ellipsis
                                if (i === 2) pageNum = currentPage;
                                if (i === 3) pageNum = -1; // Ellipsis
                                if (i === 4) pageNum = totalPages;
                              }

                              // Render page button or ellipsis
                              if (pageNum === -1) {
                                return (
                                  <span
                                    key={`ellipsis-${i}`}
                                    className="px-2 py-1 text-muted-foreground"
                                  >
                                    ...
                                  </span>
                                );
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    pageNum !== undefined &&
                                    handlePageChange(pageNum)
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={
                              currentPage >=
                              Math.ceil(totalItems / itemsPerPage)
                            }
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Next Page</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5-4.25a.75.75 0 01-1.06-.02z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading job posts...</p>
        </div>
      )}
    </div>
  );
}
