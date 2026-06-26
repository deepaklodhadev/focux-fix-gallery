import React, { useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/components/ThemeProvider";
import { useSettingsStore } from "@/store/settings";
import { useRecycleBinStore } from "@/store/recycleBin";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { mediaService } from "@/services";
import type { GridSize, DeleteBehavior, ThemePref } from "@/types";
import { GRID_SIZE_LABELS } from "@/utils/grid";
import { radii, spacing } from "@/theme/colors";

const APP_VERSION = "0.1.0";

const BackIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronIcon = ({ expanded, color }: { expanded: boolean; color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const s = useSettingsStore();
  const binCount = useRecycleBinStore((st) => st.items.length);
  const { allItems } = useMediaLibrary();
  const [foldersExpanded, setFoldersExpanded] = useState(false);

  // Storage telemetry computations
  const stats = useMemo(() => {
    const photos = allItems.filter((i) => !i.isVideo);
    const videos = allItems.filter((i) => i.isVideo);

    const photoCount = photos.length;
    const videoCount = videos.length;

    // Typical file sizes (approx: 3.2 MB per photo, 1.8 MB per second of video)
    const photoSizeEst = photoCount * 3.2 * 1024 * 1024;
    const videoSizeEst = videos.reduce((acc, v) => acc + (v.duration || 10) * 1.8 * 1024 * 1024, 0);
    const totalSize = photoSizeEst + videoSizeEst;

    return { photoCount, videoCount, photoSizeEst, videoSizeEst, totalSize };
  }, [allItems]);

  // Distinct folders for the hidden-folders picker.
  const folders = useMemo(() => [...new Set(allItems.map((i) => i.folder))].sort(), [allItems]);

  return (
    <Screen>
      {/* Header matching the Obsidian screenshot (left-aligned back arrow and Settings text) */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <BackIcon color={theme.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.accent }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 48 }}>
        <Section title="Storage telemetry">
          <Card>
            <View style={styles.storageStats}>
              <View style={styles.storageHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Gallery Storage</Text>
                <Text style={[styles.storageTotal, { color: theme.accent }]}>{formatBytes(stats.totalSize)}</Text>
              </View>
              
              {/* Progress Bar */}
              <View style={[styles.progressBar, { backgroundColor: theme.surfaceMuted }]}>
                {stats.totalSize > 0 && (
                  <>
                    <View style={[styles.progressPhotos, { width: `${(stats.photoSizeEst / stats.totalSize) * 100}%`, backgroundColor: theme.accent }]} />
                    <View style={[styles.progressVideos, { width: `${(stats.videoSizeEst / stats.totalSize) * 100}%`, backgroundColor: "#8b5cf6" }]} />
                  </>
                )}
              </View>

              {/* Breakdown */}
              <View style={styles.breakdown}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>
                    Photos ({stats.photoCount}): <Text style={{ color: theme.text, fontWeight: "600" }}>{formatBytes(stats.photoSizeEst)}</Text>
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.dot, { backgroundColor: "#8b5cf6" }]} />
                  <Text style={[styles.breakdownLabel, { color: theme.textMuted }]}>
                    Videos ({stats.videoCount}): <Text style={{ color: theme.text, fontWeight: "600" }}>{formatBytes(stats.videoSizeEst)}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Section>

        <Section title="Display">
          <Card>
            <Row
              title="Show videos"
              subtitle="Display videos in the Timeline"
              right={
                <Switch
                  value={s.showVideos}
                  onValueChange={s.setShowVideos}
                  thumbColor={s.showVideos ? theme.accent : "#ccc"}
                  trackColor={{ true: theme.accent + "55", false: theme.surfaceMuted }}
                />
              }
            />
          </Card>
          <Card>
            <Label title="Theme" subtitle="Light, dark, or follow system" />
            <Segmented<ThemePref>
              value={s.theme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "Auto" },
              ]}
              onChange={s.setTheme}
            />
          </Card>
        </Section>

        <Section title="Hidden folders">
          <Card>
            <Pressable onPress={() => setFoldersExpanded(!foldersExpanded)} style={styles.collapsibleHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Excluded folders</Text>
                <Text style={[styles.cardSub, { color: theme.textMuted }]}>
                  {foldersExpanded 
                    ? "Choose which folders to show or hide" 
                    : `${folders.length} folder${folders.length === 1 ? "" : "s"} available (Tap to edit)`}
                </Text>
              </View>
              <ChevronIcon expanded={foldersExpanded} color={theme.accent} />
            </Pressable>

            {foldersExpanded && (
              folders.length === 0 ? (
                <View style={[styles.emptyFoldersCard, { borderColor: theme.border, marginTop: spacing.md }]}>
                  <Text style={[styles.emptyFoldersText, { color: theme.textMuted }]}>
                    No folders available.
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: spacing.md }}>
                  {folders.map((f, idx) => {
                    const hidden = s.hiddenFolders.includes(f);
                    return (
                      <View key={f}>
                        {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                        <View style={styles.folderRow}>
                          <View style={{ flex: 1, marginRight: spacing.sm }}>
                            <Text style={[styles.folderName, { color: theme.text }]}>{f}</Text>
                            <Text style={[styles.folderSub, { color: theme.textMuted }]}>
                              {hidden ? "Excluded from library" : "Visible in timeline"}
                            </Text>
                          </View>
                          <Switch
                            value={!hidden}
                            onValueChange={() => s.toggleHiddenFolder(f)}
                            thumbColor={!hidden ? theme.accent : "#ccc"}
                            trackColor={{ true: theme.accent + "55", false: theme.surfaceMuted }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            )}
          </Card>
        </Section>

        <Section title="Safety & Deletion">
          <Card>
            <Label title="Delete behavior" subtitle="What happens when you delete photos" />
            <Segmented<DeleteBehavior>
              value={s.deleteBehavior}
              options={[
                { value: "recycle", label: "Recycle Bin" },
                { value: "permanent", label: "Permanent" },
              ]}
              onChange={s.setDeleteBehavior}
            />
          </Card>
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Recycle Bin retention</Text>
                <Text style={[styles.cardSub, { color: theme.textMuted }]}>Auto-delete after defined days</Text>
              </View>
              
              <View style={[styles.stepperContainer, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                <Pressable
                  onPress={() => s.setRecycleRetentionDays(Math.max(1, s.recycleRetentionDays - 1))}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { opacity: pressed ? 0.65 : 1 }
                  ]}
                  hitSlop={12}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text }]}>−</Text>
                </Pressable>

                <View style={styles.stepperValueContainer}>
                  <Text style={[styles.stepperValueText, { color: theme.accent }]}>{s.recycleRetentionDays}</Text>
                  <Text style={[styles.stepperUnitText, { color: theme.textMuted }]}>
                    {s.recycleRetentionDays === 1 ? "day" : "days"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => s.setRecycleRetentionDays(Math.min(90, s.recycleRetentionDays + 1))}
                  style={({ pressed }) => [
                    styles.stepperBtn,
                    { opacity: pressed ? 0.65 : 1 }
                  ]}
                  hitSlop={12}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text }]}>+</Text>
                </Pressable>
              </View>
            </View>
          </Card>
          <Card>
            <Pressable onPress={() => router.push("/recycle")}>
              <Row title="Recycle Bin" subtitle={`${binCount} item(s)`} right={<Text style={{ color: theme.textSubtle, fontSize: 18 }}>›</Text>} />
            </Pressable>
          </Card>
          <Card>
            <Pressable onPress={() => router.push("/vault")}>
              <Row title="Private Vault" subtitle="Keep sensitive photos and videos secure" right={<Text style={{ color: theme.textSubtle, fontSize: 18 }}>›</Text>} />
            </Pressable>
          </Card>
        </Section>

        {/* Clean, centered Obsidian-style version info directly on the screen background */}
        <View style={styles.aboutContainer}>
          <Text style={[styles.aboutTitle, { color: theme.accent }]}>FocusPix</Text>
          <Text style={[styles.aboutSub, { color: theme.textSubtle }]}>
            VERSION {APP_VERSION} · {mediaService.isMock ? "SAMPLE" : "STABLE"}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- small building blocks --------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>;
}

function Label({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: spacing.xs }}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.cardSub, { color: theme.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

function Row({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.cardSub, { color: theme.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.surfaceMuted }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              active && {
                backgroundColor: theme.bgElevated,
              },
            ]}
          >
            <Text
              style={{
                color: active ? theme.accent : theme.textMuted,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Stepper counter control replaces CustomSlider

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  card: { borderRadius: radii.lg, padding: spacing.md },
  storageStats: { gap: spacing.md },
  storageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storageTotal: { fontSize: 18, fontWeight: "700" },
  progressBar: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
  progressPhotos: { height: "100%" },
  progressVideos: { height: "100%" },
  breakdown: { gap: spacing.xs, marginTop: spacing.xs },
  breakdownItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 12 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 13, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  segmented: { flexDirection: "row", borderRadius: radii.md, padding: 3, gap: 2 },
  segment: { flex: 1, paddingVertical: spacing.sm, alignItems: "center", borderRadius: radii.sm },
  folderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radii.sm },
  folderName: { fontSize: 14, fontWeight: "600" },
  folderSub: { fontSize: 11, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    height: 56,
  },
  backBtn: {
    marginRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  emptyFoldersCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radii.md,
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  emptyFoldersText: {
    fontStyle: "italic",
    fontSize: 13,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  stepperValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
    gap: 2,
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: "700",
  },
  stepperUnitText: {
    fontSize: 10,
    fontWeight: "600",
  },
  aboutContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  aboutSub: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
