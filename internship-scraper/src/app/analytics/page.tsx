"use client";
import { useEffect, useState } from "react";
import Header from "@/components/header";
import useSharedFormState from "@/app/hook/useCustomJobPosts";
import { supabaseBrowser } from "@/lib/supabase/browser";
import useUser from "@/app/hook/useUser";

// Import shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoIcon } from "lucide-react";

// Import Recharts for better chart integration with React
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";

const supabase = supabaseBrowser();

export default function Analytics() {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customApplications, setCustomApplications] = useState<any[]>([]);

  const { isFetching, data } = useUser();

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

  // Prepare data for status chart
  const getStatusChartData = () => {
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

    const statusColors = [
      "#6B7280", // Applied (gray)
      "#C084FC", // OA Received (purple)
      "#60A5FA", // Interview Scheduled (blue)
      "#FBBF24", // Waitlisted (yellow)
      "#F87171", // Rejected (red)
      "#4ADE80", // Offer Received (green)
      "#10B981", // Accepted (emerald)
      "#92400E", // Will Not Apply (amber)
    ];

    const data = statusLabels
      .map((label, index) => {
        const count =
          statuses.filter((status) => status.status === label).length +
          customApplications.filter((app) => app.status === label).length;

        return {
          name: label,
          value: count,
          color: statusColors[index],
        };
      })
      .filter((item) => item.value > 0);

    return { data, colors: statusColors };
  };

  // Prepare data for source chart
  const getSourceChartData = () => {
    const sourceLabels = [
      "LinkedIn Applications",
      "GitHub Applications",
      "Personal Applications",
    ];

    const sourceColors = [
      "#0C84FC", // LinkedIn
      "#22C55E", // GitHub
      "#F87171", // Personal
    ];

    const counts = [
      statuses.filter(
        (status) =>
          status.status !== "Not Applied" &&
          status.status !== "Will Not Apply" &&
          new URL(status.job).hostname === "www.linkedin.com"
      ).length,
      statuses.filter(
        (status) =>
          status.status !== "Not Applied" &&
          status.status !== "Will Not Apply" &&
          new URL(status.job).hostname !== "www.linkedin.com"
      ).length,
      customApplications.filter((status) => status.status !== "Not Applied")
        .length,
    ];

    const data = sourceLabels
      .map((label, index) => ({
        name: label,
        value: counts[index],
        color: sourceColors[index],
      }))
      .filter((item) => item.value > 0);

    return { data, colors: sourceColors };
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    name: string;
  }) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="container mx-auto">
      <Header />

      {data && !loading ? (
        <div className="py-8">
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="status">Application Statuses</TabsTrigger>
              <TabsTrigger value="source">Application Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Application Status Distribution</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          This may be an overestimate due to duplicates
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStatusChartData().data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getStatusChartData().data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                        <RechartsTooltip
                          formatter={(value, name) => [
                            `${value} applications`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="source">
              <Card>
                <CardHeader>
                  <CardTitle>Application Source Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getSourceChartData().data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getSourceChartData().data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                        <RechartsTooltip
                          formatter={(value, name) => [
                            `${value} applications`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : data && loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center py-24">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-primary">
                Please Sign In to View Analytics
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
