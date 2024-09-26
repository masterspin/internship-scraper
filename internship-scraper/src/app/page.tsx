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


const supabase = supabaseBrowser();

export default function Home() {
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const { customJobPosts, setCustomJobPosts } = useSharedFormState();
  const [filteredJobPosts, setFilteredJobPosts] = useState<any[]>([]);
  const [shownPosts, setShownPosts] = useState<any[]>([]);
  const [hasStatus, setHasStatus] = useState(false);
  const [selectedButton, setSelectedButton] = useState(0);
  const [filterOption, setFilterOption] = useState("All");

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

  //NEED TO DO 'thiS
  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    jobId: string
  ) => {
    const newStatus = e.target.value;
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
              const dateA: any = new Date(`${a.date} ${currentYear}`);
              const dateB: any = new Date(`${b.date} ${currentYear}`);
              return dateB - dateA;
            });
          break;
        case 2:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "Ouckah")
            .sort((a, b) => {
              const dateA: any = new Date(`${a.date} ${currentYear}`);
              const dateB: any = new Date(`${b.date} ${currentYear}`);
              return dateB - dateA;
            });
          break;
        case 3:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "PittCSC Off-Season")
            .sort((a, b) => {
              const dateA: any = new Date(`${a.date} ${currentYear}`);
              const dateB: any = new Date(`${b.date} ${currentYear}`);
              return dateB - dateA;
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
              const dateA: any = new Date(`${a.date} ${currentYear}`);
              const dateB: any = new Date(`${b.date} ${currentYear}`);
              return dateB - dateA;
            });
          break;
        case 8:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "airtable" && jobPost.job_type === "EE")
            .sort((a, b) => {
              const dateA: any = new Date(`${a.date} ${currentYear}`);
              const dateB: any = new Date(`${b.date} ${currentYear}`);
              return dateB - dateA;
            });
          break;
        case 9:
          filteredData = jobPosts
            .filter((jobPost) => jobPost.source === "airtable" && jobPost.job_type === "Hardware")
            .sort((a, b) => {
              const dateA: any = new Date(`${a.date} ${currentYear}`);
              const dateB: any = new Date(`${b.date} ${currentYear}`);
              return dateB - dateA;
            });
          break;
        default:
          filteredData = [...jobPosts];
          break;
      }
      setFilterOption("All");
      setFilteredJobPosts(filteredData);
    }
    setHasStatus(true);
  };

  const handleFilterClick = (value: string) => {
    setFilterOption(value);
    setHasStatus(false);
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

  return (
    <div>
      <Header />
      {hasStatus && (
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex flex-col md:flex-row justify-start space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex overflow-x-auto rounded-lg space-x-4">
                <div className="flex divide-x divide-blue-900">
                  <button
                    onClick={() => handleSourceClick(0)}
                    className="flex items-center space-x-2 align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-blue-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-r-none border-r-0"
                    type="button"
                  >
                    <FaLinkedin size={16} />
                    <span>SWE</span>
                  </button>
                  <button
                    onClick={() => handleSourceClick(5)}
                    className="flex items-center align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-blue-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-r-none border-r-0 rounded-l-none"
                    type="button"
                  >
                    QUANT
                  </button>
                  <button
                    onClick={() => handleSourceClick(6)}
                    className="flex items-center align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-blue-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-l-none"
                    type="button"
                  >
                    BUS
                  </button>
                </div>
                <div className="flex divide-x divide-green-900">
                  <button
                    onClick={() => handleSourceClick(1)}
                    className="flex items-center space-x-2 align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-green-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-r-none border-r-0"
                    type="button"
                  >
                    <FaGithub size={16} />
                    <span>PittCSC</span>
                  </button>
                  <button
                    onClick={() => handleSourceClick(2)}
                    className="flex items-center align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-green-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-r-none border-r-0 rounded-l-none"
                    type="button"
                  >
                    Ouckah
                  </button>
                  <button
                    onClick={() => handleSourceClick(3)}
                    className="flex items-center align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-green-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-r-none rounded-l-none"
                    type="button"
                  >
                    PittCSC Off-Season
                  </button>
                  <button
                    onClick={() => handleSourceClick(7)}
                    className="flex items-center align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-green-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-l-none"
                    type="button"
                  >
                    PittCSC New Grad
                  </button>
                </div>
                <div className="flex divide-x divide-sky-800">
                  <button
                    onClick={() => handleSourceClick(8)}
                    className="flex items-center space-x-2 align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-sky-600 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none border-r-0 rounded-r-none"
                    type="button"
                  >
                    <FaBoltLightning size={16} />
                    <span>EE</span>
                  </button>
                  <button
                    onClick={() => handleSourceClick(9)}
                    className="flex items-center space-x-2 align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-sky-600 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none border-r-0 rounded-l-none"
                    type="button"
                  >
                    <span>Hardware</span>
                  </button>
                </div>
                <div className="flex divide-x divide-red-900">
                  {data && (
                    <button
                      onClick={() => handleSourceClick(4)}
                      className="flex items-center space-x-2 align-middle select-none font-sans font-bold text-center transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-2 rounded-lg bg-red-700 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none rounded-r-none border-r-0"
                      type="button"
                    >
                      <FaFile size={16} />
                      <span>Personal Applications</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {data && selectedButton === 4 && <Form />}
          </div>
          <div>
            {data && (
              <div className="flex flex-col md:flex-row justify-start relative my-4 max-w-40">
                <select
                  value={filterOption}
                  onChange={(e) => handleFilterClick(e.target.value)}
                  id="underline_select"
                  className="block py-2.5 px-0 w-full text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 peer"
                >
                  <option value="All">All</option>
                  <option value="Not Applied">Not Applied</option>
                  <option value="Applied">Applied</option>
                  <option value="OA Received">OA Received</option>
                  <option value="Interview Scheduled">Interview(s)</option>
                  <option value="Waitlisted">Waitlisted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Offer Received">Offer Received</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Will Not Apply">Will Not Apply</option>
                </select>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  {data && selectedButton === 4 && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"></th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Location
                  </th>
                  {selectedButton == 3 && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Term
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  {data && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {shownPosts.map((shownPosts: any) => (
                  <tr key={shownPosts.id} className="dark:border-gray-700">
                    {data && selectedButton === 4 && (
                      <div className="flex space-x-4">
                        <DeleteForm jobPost={shownPosts} />
                        <EditForm jobPost={shownPosts} />
                      </div>
                    )}
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        href={shownPosts.job_link}
                        target="_blank"
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {shownPosts.job_role}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {shownPosts.company_name}
                    </td>
                    <td className="px-4 py-3 text-sm">{shownPosts.location}</td>
                    {selectedButton == 3 && (
                      <td className="px-4 py-3 text-sm">{shownPosts.term}</td>
                    )}
                    <td className="px-4 py-3 text-sm">{shownPosts.date}</td>
                    {data && (
                      <td className="px-4 py-3 text-sm font-medium">
                        <select
                          className={`max-w-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-1 outline-none focus:outline-none transition duration-150 ease-in-out
                          ${
                            shownPosts.status === "Not Applied"
                              ? "text-gray-600"
                              : ""
                          }
                          ${
                            shownPosts.status === "Applied"
                              ? "text-gray-700 dark:text-gray-300"
                              : ""
                          }
                          ${
                            shownPosts.status === "OA Received"
                              ? "text-purple-400"
                              : ""
                          }
                          ${
                            shownPosts.status === "Interview Scheduled"
                              ? "text-blue-400"
                              : ""
                          }
                          ${
                            shownPosts.status === "Waitlisted"
                              ? "text-yellow-400"
                              : ""
                          }
                          ${
                            shownPosts.status === "Rejected"
                              ? "text-red-400"
                              : ""
                          }
                          ${
                            shownPosts.status === "Offer Received"
                              ? "text-green-400"
                              : ""
                          }
                          ${
                            shownPosts.status === "Accepted"
                              ? "text-emerald-600"
                              : ""
                          }
                          ${
                            shownPosts.status === "Will Not Apply"
                              ? "text-amber-800"
                              : ""
                          }`}
                          value={shownPosts.status}
                          onChange={(e) =>
                            handleStatusChange(e, shownPosts.job_link)
                          }
                        >
                          <option value="Not Applied">Not Applied</option>
                          <option value="Applied">Applied</option>
                          <option value="OA Received">OA Received</option>
                          <option value="Interview Scheduled">
                            Interview(s)
                          </option>
                          <option value="Waitlisted">Waitlisted</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Offer Received">Offer Received</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Will Not Apply">Will Not Apply</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!hasStatus && (
        <div>
          <div className="flex justify-center items-center h-32">
            <h1 className="text-blue-500 text-3xl font-bold">Loading...</h1>
          </div>
          <div className="flex justify-center items-center">
            <p className="text-gray-300">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
