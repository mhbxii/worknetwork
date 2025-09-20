import { supabase } from "@/lib/supabase";
import { create } from "zustand";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  applicationsThisMonth: number;
}

interface UserRegistration {
  date: string;
  count: number;
}

interface ApplicationByStatus {
  status: string;
  count: number;
}

interface JobByCategory {
  name: string;
  value: number;
}

interface ApplicationOverTime {
  date: string;
  count: number;
}

interface AdminState {
  // Loading states
  loading: boolean;

  // Stats data
  stats: AdminStats;
  userRegistrations: UserRegistration[];
  applicationsByStatus: ApplicationByStatus[];
  jobsByCategory: JobByCategory[];
  applicationsOverTime: ApplicationOverTime[];

  // Time range
  timeRange: 7 | 30 | 90;

  // Actions
  setTimeRange: (range: 7 | 30 | 90) => void;
  fetchStats: () => Promise<void>;
  fetchChartData: () => Promise<void>;
  reset: () => void;
}

const initialStats: AdminStats = {
  totalUsers: 0,
  totalJobs: 0,
  applicationsThisMonth: 0,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  loading: false,
  stats: initialStats,
  userRegistrations: [],
  applicationsByStatus: [],
  jobsByCategory: [],
  applicationsOverTime: [],
  timeRange: 30,

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().fetchChartData();
  },

  // In useAdminStore.ts
  fetchStats: async () => {
    try {
      console.log("🔄 Starting fetchStats...");
      set({ loading: true });

      // Total users
      const { count: totalUsers, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Total jobs
      const { count: totalJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true });

      if (jobsError) throw jobsError;

      // Applications this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: applicationsThisMonth, error: appsError } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      if (appsError) throw appsError;

      console.log("✅ Stats loaded:", {
        totalUsers,
        totalJobs,
        applicationsThisMonth,
      });

      set({
        stats: {
          totalUsers: totalUsers || 0,
          totalJobs: totalJobs || 0,
          applicationsThisMonth: applicationsThisMonth || 0,
        },
        loading: false, // ✅ IMPORTANT: Set loading to false
      });
    } catch (error) {
      console.error("❌ Error fetching admin stats:", error);
      set({ loading: false }); // ✅ IMPORTANT: Set loading to false even on error
    }
  },

  fetchChartData: async () => {
    try {
      console.log("🔄 Starting fetchChartData...");
      const { timeRange } = get();
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - timeRange);

      // User registrations over time
      const { data: registrationData } = await supabase
        .from("users")
        .select("created_at")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at");

      const userRegistrations = registrationData?.reduce(
        (acc: Record<string, number>, user) => {
          const date = new Date(user.created_at).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {}
      );

      // Applications by status
      const { data: applicationData } = await supabase
        .from("job_applications")
        .select(
          `
        status_id,
        application_status!inner(name)
      `
        )
        .gte("created_at", daysAgo.toISOString());

      const applicationsByStatus = applicationData?.reduce(
        (acc: Record<string, number>, app) => {
          const status = app.application_status[0]?.name || "Unknown"; // Access first element
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {}
      );

      // Jobs by category
      const { data: jobData } = await supabase
        .from("jobs")
        .select(
          `
        job_category_id,
        job_categories!inner(name)
      `
        )
        .gte("created_at", daysAgo.toISOString());

      const jobsByCategory = jobData?.reduce(
        (acc: Record<string, number>, job) => {
          const category = job.job_categories[0]?.name || "Uncategorized"; // Access first element
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {}
      );

      // Applications over time
      const { data: appTimeData } = await supabase
        .from("job_applications")
        .select("created_at")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at");

      const applicationsOverTime = appTimeData?.reduce(
        (acc: Record<string, number>, app) => {
          const date = new Date(app.created_at).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        },
        {}
      );

      set({
        userRegistrations: Object.entries(userRegistrations || {}).map(
          ([date, count]) => ({
            date,
            count,
          })
        ),
        applicationsByStatus: Object.entries(applicationsByStatus || {}).map(
          ([status, count]) => ({
            status,
            count,
          })
        ),
        jobsByCategory: Object.entries(jobsByCategory || {}).map(
          ([name, value]) => ({
            name,
            value,
          })
        ),
        applicationsOverTime: Object.entries(applicationsOverTime || {}).map(
          ([date, count]) => ({
            date,
            count,
          })
        ),
      });
      console.log("✅ Chart data loaded");
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  },

  reset: () => {
    set({
      stats: initialStats,
      userRegistrations: [],
      applicationsByStatus: [],
      jobsByCategory: [],
      applicationsOverTime: [],
      timeRange: 30,
    });
  },
}));
