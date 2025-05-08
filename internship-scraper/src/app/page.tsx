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
import { Loader2 } from "lucide-react";

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
    // Update the jobPosts state with the new status for the job post with the matching ID
    setJobPosts(
      jobPosts.map((jobPost) => {
        if (jobPost.job_link === jobId) {
          jobPost.status = newStatus;
        }
        return jobPost;
      })
    );

    setCustomJobPosts(
      customJobPosts.map((jobPost) => {
        if (jobPost.job_link === jobId) {
          jobPost.status = newStatus;
        }
        return jobPost;
      })
    );

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
              const dateA: any = new Date(a.date);
              const dateB: any = new Date(b.date);
              return dateB - dateA;
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
            return dateB - dateA;
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
              return dateB - dateA;
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
              return dateB - dateA;
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
              return dateB - dateA;
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
              return dateB - dateA;
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

  const handleFilterClick = (value: string) => {
    setFilterOption(value);
    setHasStatus(false);
    setIsLoading(true);
    let shownData = [];
    if (filteredJobPosts) {
      switch (value) {
        case "Not Applied":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Not Applied"
          );
          break;
        case "Applied":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Applied"
          );
          break;
        case "OA Received":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "OA Received"
          );
          break;
        case "Interview Scheduled":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Interview Scheduled"
          );
          break;
        case "Waitlisted":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Waitlisted"
          );
          break;
        case "Rejected":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Rejected"
          );
          break;
        case "Offer Received":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Offer Recevied"
          );
          break;
        case "Accepted":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Accepted"
          );
          break;
        case "Will Not Apply":
          shownData = filteredJobPosts.filter(
            (jobPost) => jobPost.status === "Will Not Apply"
          );
          break;
        default:
          shownData = filteredJobPosts;
          break;
      }
      setShownPosts(shownData);
    }
    setIsLoading(false);
    setHasStatus(true);
  };

  useEffect(() => {
    handleSourceClick(selectedButton);
  }, [jobPosts, customJobPosts]);

  useEffect(() => {
    handleFilterClick(filterOption);
  }, [filteredJobPosts]);

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
      {hasStatus ? (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-2">
                {/* LinkedIn Group */}
                <div className="flex flex-wrap">
                  <Button
                    variant={selectedButton === 0 ? "default" : "outline"}
                    onClick={() => handleSourceClick(0)}
                    className="rounded-r-none flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <FaLinkedin className="mr-2 md:mr-2" size={16} />
                    <span className="hidden sm:inline">SWE</span>
                    <span className="sm:hidden">SWE</span>
                  </Button>
                  <Button
                    variant={selectedButton === 5 ? "default" : "outline"}
                    onClick={() => handleSourceClick(5)}
                    className="rounded-l-none rounded-r-none border-x-0 flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <span>QUANT</span>
                  </Button>
                  {/* <Button
                    variant={selectedButton === 6 ? "default" : "outline"}
                    onClick={() => handleSourceClick(6)}
                    className="rounded-l-none flex-1 min-w-[80px]"
                    size="sm"
                  >
                    <span>BUS</span>
                  </Button> */}
                </div>

                {/* GitHub Group */}
                <div className="flex flex-wrap">
                  <Button
                    variant={selectedButton === 1 ? "default" : "outline"}
                    onClick={() => handleSourceClick(1)}
                    className="rounded-r-none flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <FaGithub className="mr-2 md:mr-2" size={16} />
                    <span className="hidden sm:inline">Pitt</span>
                    <span className="sm:hidden">Pitt</span>
                  </Button>
                  <Button
                    variant={selectedButton === 2 ? "default" : "outline"}
                    onClick={() => handleSourceClick(2)}
                    className="rounded-none border-x-0 flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <span className="hidden sm:inline">CSCareers</span>
                    <span className="sm:hidden">CSCareers</span>
                  </Button>
                  <Button
                    variant={selectedButton === 3 ? "default" : "outline"}
                    onClick={() => handleSourceClick(3)}
                    className="rounded-none border-r-0 flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <span className="hidden sm:inline">PittCSC Off-Season</span>
                    <span className="sm:hidden">Pitt Off</span>
                  </Button>
                  <Button
                    variant={selectedButton === 10 ? "default" : "outline"}
                    onClick={() => handleSourceClick(10)}
                    className="rounded-none border-r-0 flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <span className="hidden sm:inline">
                      CSCareers Off-Season
                    </span>
                    <span className="sm:hidden">CSC Off</span>
                  </Button>
                  <Button
                    variant={selectedButton === 7 ? "default" : "outline"}
                    onClick={() => handleSourceClick(7)}
                    className="rounded-l-none flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <span className="hidden sm:inline">New Grad</span>
                    <span className="sm:hidden">New Grad</span>
                  </Button>
                </div>

                {/* EE/Hardware Group */}
                <div className="flex flex-wrap">
                  <Button
                    variant={selectedButton === 8 ? "default" : "outline"}
                    onClick={() => handleSourceClick(8)}
                    className="rounded-r-none flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <FaBoltLightning className="mr-2 md:mr-2" size={16} />
                    <span>EE</span>
                  </Button>
                  <Button
                    variant={selectedButton === 9 ? "default" : "outline"}
                    onClick={() => handleSourceClick(9)}
                    className="rounded-l-none flex-1 min-w-[80px]"
                    size="lg"
                  >
                    <span className="hidden sm:inline">Hardware</span>
                    <span className="sm:hidden">Hardware</span>
                  </Button>
                </div>

                {/* Personal Applications */}
                {data && (
                  <Button
                    variant={selectedButton === 4 ? "destructive" : "outline"}
                    onClick={() => handleSourceClick(4)}
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    <FaFile className="mr-2 md:mr-2" size={16} />
                    <span>Personal Applications</span>
                  </Button>
                )}
              </div>
            </div>
            {data && selectedButton === 4 && <Form />}
          </div>

          {data && (
            <div className="mb-6">
              <Select value={filterOption} onValueChange={handleFilterClick}>
                <SelectTrigger className="w-[200px]">
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
                  <SelectItem value="Offer Received">Offer Received</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Will Not Apply">Will Not Apply</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
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
                    <TableHeader>
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
                      {shownPosts.map((shownPost: any) => (
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
                                  handleStatusChange(value, shownPost.job_link)
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
                      ))}
                    </TableBody>
                  </Table>
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
