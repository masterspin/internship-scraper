"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/header";
import Form from "@/components/modal";
import EditForm from "@/components/editModal";
import DeleteForm from "@/components/deleteModal";
import useSharedFormState from "@/app/hook/useCustomJobPosts";
import Chart, {
  ChartConfiguration,
  ChartOptions,
  ChartType,
} from "chart.js/auto"; // Import Chart.js types

import { supabaseBrowser } from "@/lib/supabase/browser";
import useUser from "@/app/hook/useUser";
import { FaFile, FaGithub, FaLinkedin } from "react-icons/fa";

const supabase = supabaseBrowser();

export default function Analytics() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Initialize loading state as true
  const [customApplications, setCustomApplications] = useState<any[]>([]);

  const { isFetching, data } = useUser();

  const chartRef = useRef<Chart<"pie", any[], any> | null>(null);
  const sourceChartRef = useRef<Chart<"pie", any[], any> | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (data) {
        try {
          let { data: statusData, error: statusError } = await supabase
            .from("statuses")
            .select("*")
            .eq("user", data.id);

          if (statusError) {
            console.log(statusError.message);
          } else {
            setStatuses(statusData as any[]);
          }

          let { data: customAppData, error: customAppError } = await supabase
            .from("custom_applications")
            .select("*")
            .eq("user", data.id);

          if (customAppError) {
            console.log(customAppError.message);
          } else {
            setCustomApplications(customAppData as any[]);
          }
        } catch (error: any) {
          console.log(error.message);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [data]);

  useEffect(() => {
    setLoading(true);
    createOrUpdatePieChart();
    sourcePieChart();
    setLoading(false);
  }, [statuses, customApplications]);

  const createOrUpdatePieChart = () => {
    if (data) {
      const ctx = document.getElementById("myPieChart") as HTMLCanvasElement;
      if (!ctx) return;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const statusLabels = [
        "Applied",
        "OA Received",
        "Interview Scheduled",
        "Waitlisted",
        "Rejected",
        "Offer Received",
        "Accepted",
        "Will Not Apply",
      ];
      const statusCounts = [];

      for (let i = 0; i < statusLabels.length; i++) {
        const statusCount =
          statuses.filter((status) => status.status === statusLabels[i])
            .length +
          customApplications.filter((app) => app.status === statusLabels[i])
            .length;
        statusCounts.push(statusCount);
      }

      const data = {
        labels: [...statusLabels],
        datasets: [
          {
            label: "Applications",
            data: [...statusCounts],
            backgroundColor: [
              "rgba(75, 85, 99, 0.9)", // Applied (gray)
              "rgba(192, 132, 252, 0.9)", // OA Received (purple)
              "rgba(96, 165, 250, 0.9)", // Interview Scheduled (blue)
              "rgba(251, 191, 36, 0.9)", // Waitlisted (yellow)
              "rgba(248, 113, 113, 0.9)", // Rejected (red)
              "rgba(74, 222, 128, 0.9)", // Offer Received (green)
              "rgba(16, 185, 129, 0.9)", // Accepted (emerald)
              "rgba(146, 64, 14, 0.9)", // Will Not Apply (amber)
            ],
            borderWidth: 0,
          },
        ],
      };

      const options: ChartOptions<"pie"> = {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            align: "start",
            labels: {
              color: "white",
              font: {
                size: 12,
              },
            },
          },
        },
      };

      chartRef.current = new Chart(ctx, {
        type: "pie",
        data: data,
        options: options,
      });
    }
  };

  const sourcePieChart = () => {
    if (data) {
      const ctx = document.getElementById(
        "sourcePieChart"
      ) as HTMLCanvasElement;
      if (!ctx) return;

      if (sourceChartRef.current) {
        sourceChartRef.current.destroy();
      }

      const statusLabels = ["Platform Applications", "Personal Applications"];
      const statusCounts = [];

      statusCounts.push(
        statuses.filter((status) => status.status !== "Not Applied").length
      );
      statusCounts.push(
        customApplications.filter((status) => status.status !== "Not Applied")
          .length
      );

      const data = {
        labels: [...statusLabels],
        datasets: [
          {
            label: "Applications",
            data: [...statusCounts],
            backgroundColor: [
              "rgba(12, 132, 252, 0.9)",
              "rgba(248, 113, 113, 0.9)",
            ],
            borderWidth: 0,
          },
        ],
      };

      const options: ChartOptions<"pie"> = {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            align: "start",
            labels: {
              color: "white",
              font: {
                size: 12,
              },
            },
          },
        },
      };

      sourceChartRef.current = new Chart(ctx, {
        type: "pie",
        data: data,
        options: options,
      });
    }
  };

  return (
    <div>
      <Header />
      {data && !loading && (
        <div>
          <div className="relative bg-gray-900 pt-4 pb-2 text-center rounded-t-lg shadow-sm font-semibold text-2xl mt-8 mx-4">
            Application Statuses
            <div
              className="inline-block ml-2 relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button className="text-stone-400 hover:text-stone-600 focus:outline-none">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {showTooltip && (
                <div className="text-left font-normal absolute bottom-full left-0 w-64 p-2 bg-stone-900 text-white text-xs rounded-lg shadow-lg">
                  This may be an overstimate due to duplicates
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between grid grid-cols-2 gap-2 p-4 pb-8 bg-gray-900 rounded-b-lg mx-4 shadow-md">
            <div className="flex-grow flex justify-center items-end">
              <div className="w-full h-full bg-gray-800 p-6 text-center rounded-lg shadow-sm font-semibold text-lg">
                <canvas id="myPieChart" className="w-full h-full"></canvas>
              </div>
            </div>
            <div className="bg-gray-800 p-6 text-center rounded-lg shadow-sm font-semibold text-lg">
              <canvas id="sourcePieChart" className="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      )}
      {data && loading && (
        <div>
          <div className="flex justify-center items-center h-32">
            <h1 className="text-blue-500 text-3xl font-bold">Loading...</h1>
          </div>
          <div className="flex justify-center items-center">
            <p className="text-gray-300">This may take a few moments</p>
          </div>
        </div>
      )}
      {!data && (
        <div>
          <div className="flex justify-center items-center h-32">
            <h1 className="text-blue-500 text-3xl font-bold">
              Please Sign In to View Analytics
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}
