import React, { useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, PanResponder } from "react-native";
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

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const s = useSettingsStore();
  const binCount = useRecycleBinStore((st) => st.items.length);
  const { allItems } = useMediaLibrary();

  // Distinct folders for the hidden-folders picker.
  const folders = useMemo(() => [...new Set(allItems.map((i) => i.folder))].sort(), [allItems]);

  return (
    <Screen>
      {/* Header matching the Obsidian screenshot (left-aligned back arrow and Settings text) */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <BackIcon color={theme.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 48 }}>
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
            <Label title="Excluded folders" subtitle="These won't appear in Timeline or Albums" />
            {folders.length === 0 ? (
              <View style={[styles.emptyFoldersCard, { borderColor: theme.border }]}>
                <Text style={[styles.emptyFoldersText, { color: theme.textMuted }]}>
                  No folders available.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: spacing.sm }}>
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
            )}
          </Card>
        </Section>

        <Section title="Delete">
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Recycle Bin retention</Text>
                <Text style={[styles.cardSub, { color: theme.textMuted }]}>Auto-delete after {s.recycleRetentionDays} days</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: theme.accent }}>{s.recycleRetentionDays}</Text>
            </View>
            <CustomSlider
              value={s.recycleRetentionDays}
              min={1}
              max={90}
              onChange={s.setRecycleRetentionDays}
            />
          </Card>
          <Card>
            <Pressable onPress={() => router.push("/recycle")}>
              <Row title="Recycle Bin" subtitle={`${binCount} item(s)`} right={<Text style={{ color: theme.textSubtle, fontSize: 18 }}>›</Text>} />
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

function CustomSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const containerRef = useRef<View>(null);
  const [trackLeft, setTrackLeft] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (containerRef.current) {
          containerRef.current.measure((x, y, width, height, pageX, pageY) => {
            setTrackLeft(pageX);
            setTrackWidth(width);
            const relativeX = evt.nativeEvent.pageX - pageX;
            const percentage = Math.max(0, Math.min(1, relativeX / width));
            const rawVal = min + percentage * (max - min);
            onChange(Math.round(rawVal));
          });
        }
      },
      onPanResponderMove: (evt) => {
        const relativeX = evt.nativeEvent.pageX - trackLeft;
        const percentage = Math.max(0, Math.min(1, relativeX / trackWidth));
        const rawVal = min + percentage * (max - min);
        onChange(Math.round(rawVal));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const percentage = (value - min) / (max - min);

  return (
    <View style={{ marginTop: spacing.sm }}>
      <View
        ref={containerRef}
        style={styles.sliderTrackContainer}
        {...panResponder.panHandlers}
        onLayout={() => {
          if (containerRef.current) {
            containerRef.current.measure((x, y, width, height, pageX, pageY) => {
              setTrackLeft(pageX);
              setTrackWidth(width);
            });
          }
        }}
      >
        {/* Track Line */}
        <View style={[styles.sliderTrack, { backgroundColor: theme.surfaceMuted }]}>
          <View
            style={[
              styles.sliderActiveTrack,
              { width: `${percentage * 100}%`, backgroundColor: theme.accent },
            ]}
          />
        </View>
        {/* Thumb */}
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${percentage * 100}%`,
              backgroundColor: theme.accent,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1,
              elevation: 1,
            },
          ]}
        />
      </View>
      {/* Min/Max Labels */}
      <View style={styles.sliderLabels}>
        <Text style={[styles.sliderLabelText, { color: theme.textSubtle }]}>{min}DAY</Text>
        <Text style={[styles.sliderLabelText, { color: theme.textSubtle }]}>{max} DAYS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  card: { borderRadius: radii.lg, padding: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 13, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  segmented: { flexDirection: "row", borderRadius: radii.md, padding: 3, gap: 2 },
  segment: { flex: 1, paddingVertical: spacing.sm, alignItems: "center", borderRadius: radii.sm },
  folderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radii.sm },
  folderName: { fontSize: 14, fontWeight: "600" },
  folderSub: { fontSize: 11, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
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
    fontSize: 20,
    fontWeight: "800",
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
  sliderTrackContainer: {
    height: 30,
    justifyContent: "center",
    position: "relative",
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  sliderActiveTrack: {
    height: "100%",
  },
  sliderThumb: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    top: "50%",
    transform: [{ translateY: -7 }, { translateX: -7 }],
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  sliderLabelText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
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
