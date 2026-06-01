// ============================================================
// P.A.T.C.H. SYSTEM — 30-Node Archetype Matrix Component
// Three overlapping Venn zones: BRUTE / GHOST / SPECIALIST
// ============================================================
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useCharacter } from '../../store/CharacterContext';
import { ARCHETYPE_NODES, ArchetypeNode, ArchetypeZone, SubSkill } from '../../models/ArchetypeNodes';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  GlobalStyles,
} from '../../theme/theme';

const SCREEN_W = Dimensions.get('window').width;

// ── Zone configuration ──────────────────────────────────────
const ZONE_CONFIG: Record<ArchetypeZone, { label: string; attrs: string; color: string }> = {
  BRUTE:             { label: 'THE BRUTE',       attrs: 'PWR / HDW', color: Colors.crimson },
  GHOST:             { label: 'THE GHOST',        attrs: 'PNG / SYS', color: Colors.cyan },
  SPECIALIST:        { label: 'THE SPECIALIST',   attrs: 'DAT / CLT', color: Colors.green },
  BRUTE_GHOST:       { label: 'BRUTE × GHOST',    attrs: 'Overlap',   color: Colors.amber },
  BRUTE_SPECIALIST:  { label: 'BRUTE × SPEC',     attrs: 'Overlap',   color: Colors.amber },
  GHOST_SPECIALIST:  { label: 'GHOST × SPEC',     attrs: 'Overlap',   color: Colors.amber },
};

// ── Main Component ───────────────────────────────────────────
export default function ArchetypeMatrix() {
  const { character, unlockNode, unlockSubSkill, refundSubSkill } = useCharacter();
  const [selectedNode, setSelectedNode] = useState<ArchetypeNode | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const isUnlocked = useCallback(
    (id: string) => character.unlockedNodes.includes(id),
    [character.unlockedNodes],
  );

  const handleNodePress = useCallback((node: ArchetypeNode) => {
    setSelectedNode(node);
    setDrawerVisible(true);
  }, []);

  const handleUnlock = useCallback(() => {
    if (!selectedNode) return;
    unlockNode(selectedNode.id);
  }, [selectedNode, unlockNode]);

  const isSubSkillUnlocked = useCallback(
    (id: string) => character.unlockedSubSkills.includes(id),
    [character.unlockedSubSkills],
  );

  const handleUnlockSubSkill = useCallback(
    (nodeId: string, subSkillId: string, cost: number) => unlockSubSkill(nodeId, subSkillId, cost),
    [unlockSubSkill],
  );

  const handleRefundSubSkill = useCallback(
    (subSkillId: string, refund: number) => refundSubSkill(subSkillId, refund),
    [refundSubSkill],
  );

  const zones: ArchetypeZone[] = ['BRUTE', 'GHOST', 'SPECIALIST', 'BRUTE_GHOST', 'BRUTE_SPECIALIST', 'GHOST_SPECIALIST'];

  return (
    <View style={GlobalStyles.safeArea}>
      <ScrollView
        style={GlobalStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>ARCHETYPE MATRIX</Text>
          <Text style={styles.subtitle}>30-NODE ADVANCEMENT LATTICE</Text>
          <View style={GlobalStyles.dividerGlow} />
          <Text style={styles.apInfo}>
            ADVANCEMENT POINTS AVAILABLE:{' '}
            <Text style={styles.apValue}>{character.advancementPoints}</Text>
          </Text>
        </View>

        {/* ── Zones ───────────────────────────────────────── */}
        {zones.map((zone) => {
          const cfg = ZONE_CONFIG[zone];
          const nodes = ARCHETYPE_NODES.filter((n) => n.zone === zone);
          return (
            <View key={zone} style={[styles.zoneCard, { borderColor: cfg.color }]}>
              {/* Zone header */}
              <View style={[styles.zoneHeader, { backgroundColor: `${cfg.color}22` }]}>
                <Text style={[styles.zoneLabel, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={[styles.zoneAttrs, { color: cfg.color }]}>{cfg.attrs}</Text>
              </View>

              {/* Tier rows */}
              {([1, 2, 3] as const).map((tier) => {
                const tierNodes = nodes.filter((n) => n.tier === tier);
                if (tierNodes.length === 0) return null;
                return (
                  <View key={tier} style={styles.tierRow}>
                    <Text style={styles.tierLabel}>T{tier}</Text>
                    <View style={styles.nodeRow}>
                      {tierNodes.map((node) => {
                        const unlocked = isUnlocked(node.id);
                        return (
                          <TouchableOpacity
                            key={node.id}
                            style={[
                              styles.node,
                              unlocked
                                ? { borderColor: cfg.color, backgroundColor: `${cfg.color}33` }
                                : styles.nodeInactive,
                            ]}
                            onPress={() => handleNodePress(node)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.nodeId,
                                { color: unlocked ? cfg.color : Colors.textMuted },
                              ]}
                            >
                              {node.id}
                            </Text>
                            <Text
                              style={[
                                styles.nodeName,
                                { color: unlocked ? Colors.textPrimary : Colors.textSecondary },
                              ]}
                              numberOfLines={2}
                            >
                              {node.name}
                            </Text>
                            {unlocked && (
                              <Text style={[styles.unlockBadge, { color: cfg.color }]}>
                                ✓ ACTIVE
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Node Detail Drawer ───────────────────────────── */}
      {selectedNode && (
        <NodeDrawer
          node={selectedNode}
          visible={drawerVisible}
          isNodeUnlocked={isUnlocked(selectedNode.id)}
          isSubSkillUnlocked={isSubSkillUnlocked}
          advancementPoints={character.advancementPoints}
          zoneColor={ZONE_CONFIG[selectedNode.zone].color}
          onUnlock={handleUnlock}
          onUnlockSubSkill={handleUnlockSubSkill}
          onRefundSubSkill={handleRefundSubSkill}
          onClose={() => setDrawerVisible(false)}
        />
      )}
    </View>
  );
}

// ── Node Detail Drawer ───────────────────────────────────────
function NodeDrawer({
  node,
  visible,
  isNodeUnlocked,
  isSubSkillUnlocked,
  advancementPoints,
  zoneColor,
  onUnlock,
  onUnlockSubSkill,
  onRefundSubSkill,
  onClose,
}: {
  node: ArchetypeNode;
  visible: boolean;
  isNodeUnlocked: boolean;
  isSubSkillUnlocked: (id: string) => boolean;
  advancementPoints: number;
  zoneColor: string;
  onUnlock: () => void;
  onUnlockSubSkill: (nodeId: string, subSkillId: string, cost: number) => void;
  onRefundSubSkill: (subSkillId: string, refund: number) => void;
  onClose: () => void;
}) {
  const canAfford = advancementPoints > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.drawer, { borderTopColor: zoneColor }]}>
        {/* Handle */}
        <View style={[styles.drawerHandle, { backgroundColor: zoneColor }]} />

        <Text style={[styles.drawerNodeId, { color: zoneColor }]}>{node.id}</Text>
        <Text style={[styles.drawerNodeName, { color: Colors.textPrimary }]}>{node.name}</Text>
        <Text style={[styles.drawerZone, { color: zoneColor }]}>
          {ZONE_CONFIG[node.zone].label}  •  TIER {node.tier}
        </Text>

        <View style={GlobalStyles.divider} />

        <Text style={styles.drawerDesc}>{node.description}</Text>

        <Text style={styles.subSkillHeader}>SUB-SKILLS</Text>
        {node.subSkills.map((sk) => (
          <ExpandableSubSkill
            key={sk.id}
            nodeId={node.id}
            nodeUnlocked={isNodeUnlocked}
            subSkill={sk}
            zoneColor={zoneColor}
            unlocked={isSubSkillUnlocked(sk.id)}
            canAfford={advancementPoints >= sk.advancementCost}
            onUnlockSubSkill={onUnlockSubSkill}
            onRefundSubSkill={onRefundSubSkill}
          />
        ))}

        <View style={GlobalStyles.divider} />

        {isNodeUnlocked ? (
          <View style={[styles.unlockStatus, { borderColor: zoneColor }]}>
            <Text style={[styles.unlockStatusText, { color: zoneColor }]}>
              ✓  NODE ACTIVE — ABILITY UNLOCKED
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.unlockBtn,
              { borderColor: zoneColor, opacity: canAfford ? 1 : 0.35 },
            ]}
            onPress={onUnlock}
            disabled={!canAfford}
            activeOpacity={0.75}
          >
            <Text style={[styles.unlockBtnText, { color: zoneColor }]}>
              {canAfford ? `UNLOCK NODE  (1 ADVANCEMENT POINT)` : 'INSUFFICIENT ADVANCEMENT POINTS'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Expandable Sub-Skill Row ─────────────────────────────────
function ExpandableSubSkill({
  nodeId,
  nodeUnlocked,
  subSkill,
  zoneColor,
  unlocked,
  canAfford,
  onUnlockSubSkill,
  onRefundSubSkill,
}: {
  nodeId: string;
  nodeUnlocked: boolean;
  subSkill: SubSkill;
  zoneColor: string;
  unlocked: boolean;
  canAfford: boolean;
  onUnlockSubSkill: (nodeId: string, subSkillId: string, cost: number) => void;
  onRefundSubSkill: (subSkillId: string, refund: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    const toValue = open ? 0 : 1;
    Animated.timing(animHeight, { toValue, duration: 200, useNativeDriver: false }).start();
    setOpen((v) => !v);
  }, [open, animHeight]);

  const maxHeight = animHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });
  const toggleLabel = unlocked
    ? `REFUND SUB-SKILL (+${subSkill.advancementCost} CAP)`
    : `UNLOCK SUB-SKILL (-${subSkill.advancementCost} CAP)`;
  const disabled = !nodeUnlocked || (!unlocked && !canAfford);

  return (
    <View style={styles.subSkillAccordion}>
      <TouchableOpacity style={styles.subSkillRow} onPress={toggle} activeOpacity={0.75}>
        <Text style={[styles.subSkillChevron, { color: zoneColor }]}>{open ? '▾' : '▸'}</Text>
        <Text style={[styles.subSkillName, { color: zoneColor }]}>{subSkill.name}</Text>
        <View style={styles.costStack}>
          <Text style={[styles.costBadge, { color: zoneColor, borderColor: zoneColor }]}>{subSkill.apCost} AP</Text>
          <Text style={[styles.costBadge, { color: Colors.amber, borderColor: Colors.amber }]}>{subSkill.creditCost} CR</Text>
        </View>
      </TouchableOpacity>
      <Animated.View style={[styles.subSkillBody, { maxHeight, overflow: 'hidden' }]}>
        <Text style={styles.subSkillDesc}>{subSkill.description}</Text>
        {subSkill.prerequisites ? (
          <Text style={styles.subSkillMeta}>PREREQ: {subSkill.prerequisites}</Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.subSkillToggle,
            { borderColor: unlocked ? Colors.amber : zoneColor, opacity: disabled ? 0.4 : 1 },
          ]}
          onPress={() => {
            if (unlocked) {
              onRefundSubSkill(subSkill.id, subSkill.advancementCost);
              return;
            }
            onUnlockSubSkill(nodeId, subSkill.id, subSkill.advancementCost);
          }}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Text style={[styles.subSkillToggleText, { color: unlocked ? Colors.amber : zoneColor }]}>{nodeUnlocked ? toggleLabel : 'UNLOCK THE NODE FIRST'}</Text>
        </TouchableOpacity>
      </Animated.View>
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
  apInfo: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  apValue: {
    ...Typography.heading,
    color: Colors.green,
  },
  zoneCard: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
  },
  zoneHeader: {
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneLabel: {
    ...Typography.heading,
    fontSize: 13,
  },
  zoneAttrs: {
    ...Typography.mono,
    fontSize: 10,
    opacity: 0.8,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
  },
  tierLabel: {
    ...Typography.mono,
    color: Colors.textMuted,
    width: 24,
    marginTop: Spacing.xs,
  },
  nodeRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  node: {
    width: (SCREEN_W - Spacing.lg * 2 - 24 - Spacing.sm * 2) / 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    minHeight: 64,
    justifyContent: 'center',
  },
  nodeInactive: {
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bgElevated,
  },
  nodeId: {
    ...Typography.mono,
    fontSize: 9,
    marginBottom: 2,
  },
  nodeName: {
    ...Typography.body,
    fontSize: 11,
    lineHeight: 14,
  },
  unlockBadge: {
    ...Typography.mono,
    fontSize: 8,
    marginTop: 3,
  },
  // Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  drawer: {
    backgroundColor: Colors.bgCard,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.borderDefault,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  drawerHandle: {
    width: 40,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    opacity: 0.7,
  },
  drawerNodeId: {
    ...Typography.mono,
    fontSize: 11,
  },
  drawerNodeName: {
    ...Typography.displayMedium,
    fontSize: 20,
    marginTop: 2,
  },
  drawerZone: {
    ...Typography.mono,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.8,
  },
  drawerDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  subSkillHeader: {
    ...Typography.subheading,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  unlockStatus: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  unlockStatusText: {
    ...Typography.subheading,
    fontSize: 12,
  },
  unlockBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    marginBottom: Spacing.md,
  },
  unlockBtnText: {
    ...Typography.subheading,
    fontSize: 11,
  },
  closeBtn: {
    padding: Spacing.sm,
    alignItems: 'center',
  },
  closeBtnText: {
    ...Typography.mono,
    color: Colors.textMuted,
  },
  subSkillAccordion: {
    marginBottom: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    overflow: 'hidden',
  },
  subSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgElevated,
  },
  subSkillChevron: {
    ...Typography.mono,
    fontSize: 14,
    marginRight: Spacing.sm,
    width: 14,
  },
  subSkillName: {
    ...Typography.subheading,
    fontSize: 11,
    flex: 1,
  },
  costStack: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  costBadge: {
    ...Typography.mono,
    fontSize: 9,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  subSkillBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgCard,
  },
  subSkillDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    paddingTop: Spacing.xs,
  },
  subSkillMeta: {
    ...Typography.mono,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  subSkillToggle: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  subSkillToggleText: {
    ...Typography.mono,
    fontSize: 10,
  },
});
