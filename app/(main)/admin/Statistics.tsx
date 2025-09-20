import { useAdminStore } from "@/store/useAdminStore";
import React, { useEffect } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

const StatCard = ({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    {loading ? (
      <ActivityIndicator size="small" color="#3b82f6" />
    ) : (
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
    )}
  </View>
);

const TimeRangeSelector = ({
  activeRange,
  onRangeChange,
}: {
  activeRange: 7 | 30 | 90;
  onRangeChange: (range: 7 | 30 | 90) => void;
}) => (
  <View style={styles.timeRangeContainer}>
    {[7, 30, 90].map((range) => (
      <TouchableOpacity
        key={range}
        style={[
          styles.timeRangeButton,
          activeRange === range && styles.timeRangeButtonActive,
        ]}
        onPress={() => onRangeChange(range as 7 | 30 | 90)}
      >
        <Text
          style={[
            styles.timeRangeText,
            activeRange === range && styles.timeRangeTextActive,
          ]}
        >
          {range}d
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const ChartContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>{title}</Text>
    {children}
  </View>
);

export default function Statistics() {
  console.log("📊 Statistics component rendering...");
  const {
    loading,
    stats,
    userRegistrations,
    applicationsByStatus,
    jobsByCategory,
    applicationsOverTime,
    timeRange,
    setTimeRange,
    fetchStats,
    fetchChartData,
  } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  const handleRefresh = () => {
    fetchStats();
    fetchChartData();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          loading={loading}
        />
        <StatCard
          title="Total Jobs"
          value={stats.totalJobs}
          loading={loading}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          title="Applications This Month"
          value={stats.applicationsThisMonth}
          loading={loading}
        />
      </View>
      {/* Time Range Selector */}
      <TimeRangeSelector activeRange={timeRange} onRangeChange={setTimeRange} />
      {/* Charts */}
      // Replace all ChartContainer sections with:
      <ChartContainer title="User Registrations Over Time">
        <Text style={styles.chartPlaceholder}>
          {userRegistrations.length} registrations in last {timeRange} days
        </Text>
      </ChartContainer>
      <ChartContainer title="Applications by Status">
        <Text style={styles.chartPlaceholder}>
          {applicationsByStatus
            .map((item) => `${item.status}: ${item.count}`)
            .join(", ")}
        </Text>
      </ChartContainer>
      <ChartContainer title="Applications Over Time">
        <Text style={styles.chartPlaceholder}>
          {applicationsOverTime.length} application records
        </Text>
      </ChartContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartPlaceholder: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },

  container: {
    flex: 1,
    backgroundColor: "#0f1724",
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1f2937",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  statTitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  timeRangeButtonActive: {
    backgroundColor: "#3b82f6",
  },
  timeRangeText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  timeRangeTextActive: {
    color: "#fff",
  },
  chartContainer: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
});
