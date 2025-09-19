import { Job } from "@/types/entities";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// JobCard - updated per spec:
// - Horizontal chips (up to 4 visible) with overflow indicator when more.
// - Entire card visually differentiable when `applied` (left accent + subtle background).

type Props = {
  job: Job;
  onPress?: (job: Job) => void;
  onLongPress?: (job: Job) => void;
  /** whether the current user already applied to this job */
  applied?: boolean;
};

function formatDate(iso?: string | Date | null) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `${min}m`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

const getCandidatesBgColor = (count: number) => {
  if (count < 5) return "#4caf50"; // green
  if (count < 10) return "#8bc34a"; // light green
  if (count < 15) return "#cddc39"; // lime
  if (count < 20) return "#ffeb3b"; // yellow
  if (count < 25) return "#ffc107"; // amber
  if (count < 30) return "#ff9800"; // orange
  if (count < 35) return "#ff5722"; // deep orange
  if (count < 40) return "#f44336"; // red
  if (count < 50) return "#e91e63"; // pink
  return "#9c27b0"; // purple
};

const statusColor = (status?: string) => {

  switch ((status || "").toLowerCase()) {
    case "open":
      return "#00bcd4"; // cyan - distinguishable from green candidates
    case "closed":
      return "#607d8b"; // blue gray - distinguishable from gray
    case "draft":
      return "#795548"; // brown - distinguishable from amber/orange
    default:
      return "#673ab7"; // deep purple - distinguishable from your purple
  }
};

const JobCard: React.FC<Props> = ({ job, onPress, onLongPress }) => {
  const isClosed = (job.status.name || "").toLowerCase() === "closed";
  const skills = job.skills ?? [];
  const showOverflow = skills.length > 4;

  return (
    <View style={styles.cardContainer}>
      <View
        style={[
          styles.shadowWrapper,
          isClosed && styles.cardClosedWrapper,
          job.applied && styles.cardAppliedWrapperGray,
          styles.cardContainer,
        ]}
      >
        <Pressable
          android_ripple={{ color: "#ffffff08" }}
          onPress={() => onPress?.(job)}
          onLongPress={() => onLongPress?.(job)}
          style={({ pressed }) => [
            pressed && styles.cardPressed,
            isClosed && styles.cardClosed,
          ]}
        >
          {/* left accent for applied */}
          {job.applied && <View style={styles.appliedAccent} />}

          <View style={styles.cardContent}>
            <Text
              style={[styles.cardTitle, isClosed && styles.textClosed, job.applied && !isClosed && styles.textAppliedGray]}
              numberOfLines={2}
            >
              {job.title}
            </Text>

            <Text
              style={[styles.cardDescription, isClosed && styles.textClosed, job.applied && !isClosed && styles.textAppliedGray]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {job.description ?? "No description provided."}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.leftFooter}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor(job.status.name) },
                    job.applied && { backgroundColor: "#999" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      (job.status.name || "").toLowerCase() === "open"
                        ? "briefcase-check"
                        : "briefcase"
                    }
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.statusText}>
                    {(job.status.name || "open").toUpperCase()}
                  </Text>
                </View>

                <View style={styles.dateWrap}>
                  <Text
                     style={[styles.dateText, isClosed && styles.textClosed, job.applied && !isClosed && styles.textAppliedGray]}
                  >
                    • {formatDate(job.created_at)}
                  </Text>
                </View>
              </View>

              {job.nb_candidates !== null && (
                <View style={[
                  styles.candidatesWrap,
                  { backgroundColor: getCandidatesBgColor(job.nb_candidates || 0)}
                ]}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={13}
                    color={isClosed ? "#9e9e9e" : "#fff"}
                  />
                  <Text
                    style={[styles.nb_candidatesText, isClosed && styles.textClosed]}
                  >
                    {job.nb_candidates}
                  </Text>
                </View>
              )}

              {/* Applied pill when candidate already applied
              {job.applied ? (
                <View style={styles.appliedPill}>
                  <Text style={styles.appliedPillText}>APPLIED</Text>
                </View>
              ) : null */}
            </View>
          </View>
        </Pressable>

        {/* Skills chips - horizontal scroll, non-pressable */}
        <View style={styles.chipsRow}>
          <View pointerEvents="box-none">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
              keyboardShouldPersistTaps="handled"
              onStartShouldSetResponder={() => false}
              onMoveShouldSetResponder={(evt: any) => {
                const { dx, dy } = evt.nativeEvent;
                return Math.abs(dx) > Math.abs(dy);
              }}
            >
              {skills.slice(0, 4).map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.chip, 
                    isClosed && styles.chipClosed,
                    job.applied && !isClosed && styles.chipAppliedGray
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText, 
                      isClosed && styles.chipTextClosed,
                      job.applied && !isClosed && styles.chipTextAppliedGray
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {s.name}
                  </Text>
                </View>
              ))}

              {/* overflow indicator if >4 */}
              {showOverflow ? (
                <View style={[styles.chip, styles.overflowChip, job.applied && styles.chipAppliedGray]}>
                  <Text style={[styles.chipText , job.applied && styles.chipTextAppliedGray]}>+{skills.length - 4}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

export default React.memo(JobCard);

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shadowWrapper: {
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
    backgroundColor: "#252f51", // Move bg color here to cover clipped shadow
    overflow: "hidden", // overflow hidden here, not in card
  },
  cardClosedWrapper: {},
  cardAppliedWrapperGray: {
    backgroundColor: "#2a2a2a",
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    // NO borderRadius or overflow here
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardClosed: {
    backgroundColor: "#2b2b35",
  },
  appliedAccent: {
    width: 6,
    backgroundColor: "#4caf50",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#fafafa",
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 12,
    color: "#cfcfba",
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
  },
  statusText: {
    marginLeft: 8,
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  dateWrap: {
    justifyContent: "center",
  },
  dateText: {
    color: "#bdbdbd",
    fontSize: 12,
  },
  appliedPill: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: "center",
  },
  appliedPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  chipsRow: {
    marginTop: 12,
  },
  chipsScroll: {
    alignItems: "center",
    paddingRight: 8,
  },
  chip: {
    backgroundColor: "#ede7f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 120,
  },
  chipText: {
    color: "#7c4dff",
    fontWeight: "700",
    fontSize: 13,
  },
  overflowChip: {
    backgroundColor: "#d1c4e9",
  },
  chipClosed: {
    backgroundColor: "#444",
  },
  chipTextClosed: {
    color: "#b0b0b0",
  },
  textClosed: {
    color: "#9e9e9e",
  },
  candidatesWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 32,
    justifyContent: "center",
  },
  nb_candidatesText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
  },
  cardAppliedGray: {
    backgroundColor: "#2a2a2a", // gray background for applied
  },
  textAppliedGray: {
    color: "#888888", // gray text
  },
  chipAppliedGray: {
    backgroundColor: "#404040", // gray chip background
  },
  chipTextAppliedGray: {
    color: "#aaaaaa", // gray chip text
  },
});
