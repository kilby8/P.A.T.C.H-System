// ============================================================
// P.A.T.C.H. SYSTEM — Condo Phase Terminal
//
// Timing mechanics:
//   5 real minutes  = 1 in-game Condo Hour
//   Every in-game hour elapsed → heal 25% of max Hardware Integrity
//   "Start Table Break" triggers a 15-real-minute countdown
//   (= 3 Condo Hours → 75% Hardware Integrity healed)
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useCharacter } from '../../store/CharacterContext';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  CardStyles,
  GlobalStyles,
  Shadows,
} from '../../theme/theme';

// ── Constants ────────────────────────────────────────────────
const REAL_SECONDS_PER_GAME_HOUR = 5 * 60;   // 5 real minutes
const HEAL_PERCENT_PER_GAME_HOUR = 0.25;       // 25% max HW per hour
const TABLE_BREAK_REAL_SECONDS   = 15 * 60;   // 15 real minutes

// ── Helpers ──────────────────────────────────────────────────
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function gameHoursElapsed(elapsedRealSeconds: number): number {
  return Math.floor(elapsedRealSeconds / REAL_SECONDS_PER_GAME_HOUR);
}

// ── Component ────────────────────────────────────────────────
export default function CondoPhaseTerminal() {
  const { character, healHardware } = useCharacter();

  // Timer state
  const [running, setRunning]             = useState(false);
  const [elapsedSec, setElapsedSec]       = useState(0);
  const [remainingSec, setRemainingSec]   = useState(TABLE_BREAK_REAL_SECONDS);
  const [hoursHealed, setHoursHealed]     = useState(0);
  const [breakComplete, setBreakComplete] = useState(false);
  const [healLog, setHealLog]             = useState<string[]>([]);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevHoursRef  = useRef(0);
  const pulseAnim     = useRef(new Animated.Value(1)).current;

  // Pulse animation for running state
  useEffect(() => {
    if (running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [running, pulseAnim]);

  // Tick
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;

        // Check for new completed game hour
        const hoursNow = gameHoursElapsed(next);
        if (hoursNow > prevHoursRef.current) {
          const newHours = hoursNow - prevHoursRef.current;
          prevHoursRef.current = hoursNow;
          const healAmount = Math.round(character.hardwareIntegrity.max * HEAL_PERCENT_PER_GAME_HOUR * newHours);
          healHardware(healAmount);
          setHoursHealed((h) => h + newHours);
          setHealLog((log) => [
            `+${healAmount} HW INTEGRITY  [HOUR ${hoursNow} COMPLETE]`,
            ...log,
          ]);
        }

        // Update remaining
        setRemainingSec(Math.max(0, TABLE_BREAK_REAL_SECONDS - next));

        // Break complete
        if (next >= TABLE_BREAK_REAL_SECONDS) {
          setRunning(false);
          setBreakComplete(true);
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, character.hardwareIntegrity.max, healHardware]);

  const handleStart = useCallback(() => {
    if (running) return;
    setRunning(true);
    setBreakComplete(false);
  }, [running]);

  const handlePause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleReset = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsedSec(0);
    setRemainingSec(TABLE_BREAK_REAL_SECONDS);
    setHoursHealed(0);
    prevHoursRef.current = 0;
    setBreakComplete(false);
    setHealLog([]);
  }, []);

  // ── Derived display values ──────────────────────────────
  const currentGameHours   = gameHoursElapsed(elapsedSec);
  const nextHealInSec      = REAL_SECONDS_PER_GAME_HOUR - (elapsedSec % REAL_SECONDS_PER_GAME_HOUR);
  const totalHealProjected = Math.round(character.hardwareIntegrity.max * HEAL_PERCENT_PER_GAME_HOUR * 3);
  const hiPct              = character.hardwareIntegrity.max > 0
    ? Math.round((character.hardwareIntegrity.current / character.hardwareIntegrity.max) * 100)
    : 0;

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <ScrollView
        style={GlobalStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>CONDO PHASE TERMINAL</Text>
          <Text style={styles.subtitle}>META-GAME RECOVERY PROTOCOL</Text>
          <View style={GlobalStyles.dividerGlow} />
        </View>

        {/* ── Timer Display ───────────────────────────────── */}
        <View style={[CardStyles.glow, styles.timerCard]}>
          <Text style={styles.timerLabel}>
            {running ? '● BREAK IN PROGRESS' : breakComplete ? '✓ BREAK COMPLETE' : 'AWAITING BREAK START'}
          </Text>

          {/* Countdown clock */}
          <Animated.Text style={[styles.countdown, running && { opacity: pulseAnim }]}>
            {formatTime(remainingSec)}
          </Animated.Text>
          <Text style={styles.countdownSub}>REAL-TIME REMAINING</Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(elapsedSec / TABLE_BREAK_REAL_SECONDS) * 100}%` },
              ]}
            />
          </View>

          {/* Real → game time summary */}
          <View style={styles.timeRow}>
            <TimeCell label="ELAPSED" value={formatTime(elapsedSec)} color={Colors.cyan} />
            <TimeCell label="GAME HOURS" value={String(currentGameHours)} color={Colors.green} />
            <TimeCell label="NEXT HEAL IN" value={running ? formatTime(nextHealInSec) : '--:--'} color={Colors.amber} />
          </View>
        </View>

        {/* ── Break Controls ───────────────────────────────── */}
        <View style={[CardStyles.base, styles.controlCard]}>
          {!running && !breakComplete && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>▶  START TABLE BREAK</Text>
              <Text style={styles.startBtnSub}>15 MIN  =  3 CONDO HOURS  (+{totalHealProjected} HW MAX)</Text>
            </TouchableOpacity>
          )}
          {running && (
            <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.8}>
              <Text style={styles.pauseBtnText}>⏸  PAUSE BREAK</Text>
            </TouchableOpacity>
          )}
          {(running || elapsedSec > 0) && (
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>↺  RESET</Text>
            </TouchableOpacity>
          )}
          {!running && elapsedSec > 0 && !breakComplete && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>▶  RESUME BREAK</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Hardware Integrity Status ────────────────────── */}
        <View style={CardStyles.base}>
          <Text style={styles.sectionTitle}>HARDWARE INTEGRITY STATUS</Text>
          <View style={styles.hiRow}>
            <Text style={styles.hiValue}>
              {character.hardwareIntegrity.current}
              <Text style={styles.hiMax}> / {character.hardwareIntegrity.max}</Text>
            </Text>
            <Text style={[styles.hiPct, { color: hiPct >= 50 ? Colors.green : Colors.crimson }]}>
              {hiPct}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${hiPct}%`,
                  backgroundColor: hiPct >= 50 ? Colors.green : Colors.crimson,
                },
              ]}
            />
          </View>
          <Text style={styles.healNote}>
            Each completed Condo Hour heals{' '}
            <Text style={{ color: Colors.green }}>
              {Math.round(character.hardwareIntegrity.max * HEAL_PERCENT_PER_GAME_HOUR)} HW
            </Text>{' '}
            (25% of max)
          </Text>
        </View>

        {/* ── Heal Event Log ───────────────────────────────── */}
        {healLog.length > 0 && (
          <View style={[CardStyles.base, { marginTop: Spacing.md }]}>
            <Text style={styles.sectionTitle}>RECOVERY LOG</Text>
            {healLog.map((entry, i) => (
              <Text key={i} style={styles.logEntry}>
                {entry}
              </Text>
            ))}
          </View>
        )}

        {/* ── Break Complete Banner ────────────────────────── */}
        {breakComplete && (
          <View style={[CardStyles.glow, styles.completeBanner]}>
            <Text style={styles.completeTitle}>✓ TABLE BREAK COMPLETE</Text>
            <Text style={styles.completeSub}>
              {hoursHealed} CONDO HOURS ELAPSED  •  VITALS RESTORED
            </Text>
          </View>
        )}

        {/* ── Timing Reference ─────────────────────────────── */}
        <View style={[CardStyles.base, { marginTop: Spacing.md }]}>
          <Text style={styles.sectionTitle}>TIMING REFERENCE</Text>
          {[
            ['5 real min', '1 Condo Hour', `+${Math.round(character.hardwareIntegrity.max * 0.25)} HW`],
            ['10 real min', '2 Condo Hours', `+${Math.round(character.hardwareIntegrity.max * 0.5)} HW`],
            ['15 real min', '3 Condo Hours', `+${Math.round(character.hardwareIntegrity.max * 0.75)} HW`],
          ].map(([real, game, heal]) => (
            <View key={real} style={styles.refRow}>
              <Text style={styles.refReal}>{real}</Text>
              <Text style={styles.refArrow}>→</Text>
              <Text style={styles.refGame}>{game}</Text>
              <Text style={[styles.refHeal, { color: Colors.green }]}>{heal}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-component ────────────────────────────────────────────
function TimeCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.timeCell}>
      <Text style={[styles.timeCellLabel, { color }]}>{label}</Text>
      <Text style={[styles.timeCellValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.mono,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  timerCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timerLabel: {
    ...Typography.mono,
    color: Colors.cyan,
    marginBottom: Spacing.md,
    letterSpacing: 2,
  },
  countdown: {
    ...Typography.displayLarge,
    fontSize: 56,
    color: Colors.cyan,
    ...Shadows.cyanGlow,
    letterSpacing: 6,
  },
  countdownSub: {
    ...Typography.mono,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.cyan,
    borderRadius: Radius.pill,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.sm,
  },
  timeCell: {
    alignItems: 'center',
  },
  timeCellLabel: {
    ...Typography.mono,
    fontSize: 9,
    marginBottom: 2,
  },
  timeCellValue: {
    ...Typography.statSmall,
    fontSize: 18,
  },
  controlCard: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  startBtn: {
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    ...Shadows.greenGlow,
  },
  startBtnText: {
    ...Typography.heading,
    color: Colors.green,
    fontSize: 14,
  },
  startBtnSub: {
    ...Typography.mono,
    color: Colors.greenDim,
    fontSize: 9,
    marginTop: 4,
  },
  pauseBtn: {
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    ...Shadows.amberGlow,
  },
  pauseBtnText: {
    ...Typography.heading,
    color: Colors.amber,
    fontSize: 14,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: Colors.textMuted,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  resetBtnText: {
    ...Typography.subheading,
    color: Colors.textMuted,
    fontSize: 11,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  hiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  hiValue: {
    ...Typography.stat,
    color: Colors.textPrimary,
  },
  hiMax: {
    ...Typography.subheading,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  hiPct: {
    ...Typography.heading,
  },
  healNote: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontSize: 12,
  },
  logEntry: {
    ...Typography.mono,
    color: Colors.green,
    marginBottom: Spacing.xs,
  },
  completeBanner: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  completeTitle: {
    ...Typography.heading,
    color: Colors.cyan,
  },
  completeSub: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  refReal: {
    ...Typography.mono,
    color: Colors.textSecondary,
    width: 80,
  },
  refArrow: {
    ...Typography.mono,
    color: Colors.textMuted,
  },
  refGame: {
    ...Typography.mono,
    color: Colors.cyan,
    flex: 1,
  },
  refHeal: {
    ...Typography.mono,
    fontWeight: '700',
  },
});
