import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  BLUEPRINT_DEFS,
  CATEGORY_LABELS,
  GEAR_CATEGORIES,
  GEAR_ITEM_DEFS,
  GEAR_THEMES,
  GearCategory,
  THEME_LABELS,
  getThemeEngagementRequirement,
  getBlueprintById,
  getGearItemById,
  isSponsorBlueprint,
} from '../../models/Gear';
import { useCharacter } from '../../store/CharacterContext';
import { CardStyles, Colors, GlobalStyles, Radius, Spacing, Typography } from '../../theme/theme';
import { SECTOR_LOOT_TABLE, SectorDifficulty, simulateSectorLoot } from '../../utils/sectorLoot';

const CORPORATE_TICKER_LINES = [
  'EFFICIENCY REPORT: UPGRADE FOUNDATION GEAR TO MAXIMIZE COMBAT TELEMETRY YIELD.',
  'NOTICE: R&D SCHEMATICS ARE PROPRIETARY ASSETS. INSTALLATION CONSUMES SOURCE DATA.',
  'LIVE OPS MEMO: MARKET ACCESS IS A PRIVILEGE EXTENDED TO HIGH-PERFORMANCE OPERATORS.',
  'LIVING MODULE REMINDER: YOUR APARTMENT TERMINAL EXISTS TO REDUCE LOADOUT STAGNATION.',
];

export default function GearTerminal() {
  const {
    character,
    party,
    session,
    encounter,
    sectorDifficulty,
    lastLootBlueprintId,
    blueprintMarket,
    tradeLog,
    installBlueprint,
    transferBlueprint,
    injectBlueprint,
    setBlueprintAvailability,
    setBlueprintWeightMultiplier,
    setBlueprintLootEnabled,
    setBlueprintPrice,
    setSectorDifficulty,
    setThemeGate,
    rollSectorLoot,
    lootOverride,
    purchaseBlueprint,
    claimEncounterLoot,
    awardFragments,
  } = useCharacter();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<GearCategory>('offensive');
  const [activeHardpoint, setActiveHardpoint] = useState(0);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [tradeTargetId, setTradeTargetId] = useState<string | null>(null);
  const [overrideTargetId, setOverrideTargetId] = useState<string | null>(null);
  const [simRollCount, setSimRollCount] = useState<100 | 500>(100);
  const [simResult, setSimResult] = useState<ReturnType<typeof simulateSectorLoot> | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setTickerIndex((current) => (current + 1) % CORPORATE_TICKER_LINES.length);
    }, 4000);

    return () => clearInterval(tickerInterval);
  }, []);

  const equipped = character.gearLoadout[activeCategory];
  const availableTargets = party.filter((entry) => entry.id !== character.id);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return GEAR_ITEM_DEFS.filter((item) => {
      const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
      const text = `${item.name} ${item.functionality} ${item.theme} ${item.category}`.toLowerCase();
      const queryMatch = query.length === 0 || text.includes(query);
      return categoryMatch && queryMatch;
    });
  }, [categoryFilter, search]);

  const compatibleBlueprints = useMemo(() => {
    return BLUEPRINT_DEFS.filter((blueprint) => {
      if (!blueprint.compatibleCategories.includes(activeCategory)) return false;
      if (!blueprintMarket.themeGates[blueprint.theme]) return false;
      return (character.blueprintInventory[blueprint.id] ?? 0) > 0;
    });
  }, [activeCategory, blueprintMarket.themeGates, character.blueprintInventory]);

  const totalPartyFragments = useMemo(() => (
    party.reduce((sum, entry) => sum + entry.dataFragments, 0)
  ), [party]);

  const totalMarketStock = useMemo(() => (
    Object.values(blueprintMarket.availability).reduce((sum, count) => sum + count, 0)
  ), [blueprintMarket.availability]);

  const recentEconomyEvents = useMemo(() => tradeLog.slice(0, 5), [tradeLog]);
  const payoutMultiplier = useMemo(() => (1 + Math.floor(character.engagement / 20) * 0.05).toFixed(2), [character.engagement]);
  const sponsorInventory = useMemo(
    () => BLUEPRINT_DEFS.filter((blueprint) => blueprint.sponsorGrade && (character.blueprintInventory[blueprint.id] ?? 0) > 0),
    [character.blueprintInventory],
  );
  const standardInventory = useMemo(
    () => BLUEPRINT_DEFS.filter((blueprint) => !blueprint.sponsorGrade && (character.blueprintInventory[blueprint.id] ?? 0) > 0),
    [character.blueprintInventory],
  );
  const marketBlueprints = useMemo(
    () => BLUEPRINT_DEFS.filter((blueprint) => !blueprint.sponsorGrade),
    [],
  );
  const sponsorInboxEntries = useMemo(
    () => character.sponsorInbox
      .map((blueprintId) => getBlueprintById(blueprintId))
      .filter((blueprint): blueprint is NonNullable<typeof blueprint> => Boolean(blueprint)),
    [character.sponsorInbox],
  );

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>APARTMENT TERMINAL</Text>
        <Text style={styles.title}>GEAR & R&D SCHEMATICS</Text>
        <Text style={styles.subtitle}>CORPORATE ASSET MANAGEMENT // CATEGORY + THEME + HARDPOINT ARCHITECTURE</Text>
      </View>

      <View style={styles.bannerCard}>
        <Text style={styles.bannerLabel}>CORPORATE BANNER</Text>
        <Text style={styles.bannerText}>{CORPORATE_TICKER_LINES[tickerIndex]}</Text>
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>INVENTORY MANAGER</Text>
        <Text style={styles.operatorName}>{character.name.toUpperCase()}</Text>
        <Text style={styles.operatorMeta}>SELECTED ROLE: {session.role.toUpperCase()}</Text>
        <Text style={styles.walletText}>DATA FRAGMENTS: {character.dataFragments}</Text>
        <Text style={styles.walletText}>LIVE VIEWERS: {character.viewerCount.toLocaleString()} · ENGAGEMENT: {character.engagement}%</Text>

        {GEAR_CATEGORIES.map((category) => {
          const loadoutEntry = character.gearLoadout[category];
          const item = loadoutEntry ? getGearItemById(loadoutEntry.itemId) : undefined;
          return (
            <View key={category} style={styles.inventoryRow}>
              <Text style={styles.inventoryLabel}>{CATEGORY_LABELS[category]}</Text>
              <Text style={styles.inventoryValue}>
                {item ? `${item.name.toUpperCase()} · ${THEME_LABELS[item.theme]}` : 'UNASSIGNED'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={CardStyles.glow}>
        <Text style={styles.sectionTitle}>SPONSOR INBOX</Text>
        <Text style={styles.metaText}>DIRECT DELIVERY CHANNEL // BYPASSES MARKET EXCHANGE</Text>
        {sponsorInboxEntries.map((blueprint) => (
          <View key={`sponsor-inbox-${blueprint.id}`} style={styles.sponsorCard}>
            <Text style={styles.sponsorTitle}>{blueprint.name.toUpperCase()}</Text>
            <Text style={styles.sponsorMeta}>
              {THEME_LABELS[blueprint.theme]} · QTY {character.blueprintInventory[blueprint.id] ?? 0}
            </Text>
            <Text style={styles.sponsorTrait}>{blueprint.streamTrait?.toUpperCase() ?? 'SPONSOR-GRADE MODIFIER'}</Text>
          </View>
        ))}
        {sponsorInboxEntries.length === 0 && (
          <Text style={styles.emptyText}>NO SPONSOR-GRADE DELIVERIES RECEIVED. BUILD FEED HEAT OR WAIT FOR PRODUCER INTERVENTION.</Text>
        )}
      </View>

      <View style={CardStyles.glow}>
        <Text style={styles.sectionTitle}>HARDPOINT TERMINAL</Text>

        <View style={styles.filterRow}>
          {GEAR_CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={CATEGORY_LABELS[category]}
              active={activeCategory === category}
              onPress={() => {
                setActiveCategory(category);
                setActiveHardpoint(0);
                setSelectedBlueprintId(null);
              }}
            />
          ))}
        </View>

        {equipped ? (
          <>
            <Text style={styles.metaText}>ITEM: {getGearItemById(equipped.itemId)?.name.toUpperCase()}</Text>
            <View style={styles.hardpointGrid}>
              {equipped.hardpoints.map((installedId, index) => {
                const installed = installedId ? getBlueprintById(installedId) : undefined;
                return (
                  <TouchableOpacity
                    key={`${activeCategory}-${index}`}
                    style={[styles.hardpointCell, activeHardpoint === index && styles.hardpointCellActive]}
                    onPress={() => setActiveHardpoint(index)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.hardpointIndex}>SLOT {index + 1}</Text>
                    <Text style={styles.hardpointBlueprint}>{installed ? installed.name.toUpperCase() : 'EMPTY'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.metaText}>SELECT R&D SCHEMATIC TO INSTALL (CONSUMED ON INSTALL)</Text>
            <View style={styles.filterRow}>
              {compatibleBlueprints.map((blueprint) => (
                <Chip
                  key={blueprint.id}
                  label={`${blueprint.name.toUpperCase()} (${character.blueprintInventory[blueprint.id] ?? 0})`}
                  active={selectedBlueprintId === blueprint.id}
                  onPress={() => setSelectedBlueprintId(blueprint.id)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.actionButton, !selectedBlueprintId && styles.actionButtonDisabled]}
              disabled={!selectedBlueprintId}
              onPress={() => {
                if (!selectedBlueprintId) return;
                installBlueprint(activeCategory, activeHardpoint, selectedBlueprintId);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.actionButtonText}>INSTALL / REPLACE COMPONENT</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.emptyText}>NO ITEM EQUIPPED FOR THIS CATEGORY.</Text>
        )}
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>R&D SCHEMATIC INVENTORY</Text>
        {standardInventory.map((blueprint) => {
          const count = character.blueprintInventory[blueprint.id] ?? 0;
          return (
            <View key={blueprint.id} style={styles.blueprintRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.blueprintName}>{blueprint.name.toUpperCase()}</Text>
                  <Text style={styles.blueprintMeta}>
                    {THEME_LABELS[blueprint.theme]} · {blueprint.dropRule.toUpperCase()} · QTY {count}
                  </Text>
              </View>
              <Text style={styles.blueprintEffect}>{blueprint.effect.toUpperCase()}</Text>
            </View>
          );
        })}
        {standardInventory.length === 0 && <Text style={styles.emptyText}>NO STANDARD SCHEMATICS IN INVENTORY.</Text>}
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>SPONSOR-GRADE SCHEMATICS</Text>
        {sponsorInventory.map((blueprint) => (
          <View key={`sponsor-${blueprint.id}`} style={styles.blueprintRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.blueprintName}>{blueprint.name.toUpperCase()}</Text>
              <Text style={styles.blueprintMeta}>
                SPONSOR-GRADE · {THEME_LABELS[blueprint.theme]} · QTY {character.blueprintInventory[blueprint.id] ?? 0}
              </Text>
            </View>
            <Text style={styles.blueprintEffect}>{blueprint.streamTrait?.toUpperCase() ?? blueprint.effect.toUpperCase()}</Text>
          </View>
        ))}
        {sponsorInventory.length === 0 && <Text style={styles.emptyText}>NO SPONSOR-GRADE SCHEMATICS OWNED.</Text>}
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>DATA-FRAGMENT LOOT DROP</Text>
        <Text style={styles.metaText}>LIVE PAYOUT MULTIPLIER: x{payoutMultiplier} FROM CURRENT ENGAGEMENT</Text>
        {encounter ? (
          <>
            <Text style={styles.metaText}>
              ACTIVE ENCOUNTER: SPECTACLE {encounter.spectacleScore} · {encounter.bracketLabel.toUpperCase()}
            </Text>
            <Text style={styles.metaText}>
              DEFEATED {encounter.mobs.filter((mob) => mob.defeated || mob.currentIntegrity <= 0).length}/{encounter.mobs.length}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, encounter.lootClaimed && styles.actionButtonDisabled]}
              disabled={encounter.lootClaimed}
              onPress={claimEncounterLoot}
              activeOpacity={0.75}
            >
              <Text style={styles.actionButtonText}>
                {encounter.lootClaimed ? 'LOOT ALREADY CLAIMED' : 'CLAIM ENCOUNTER LOOT'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.emptyText}>NO ACTIVE ENCOUNTER. GENERATE ONE FROM THE GM TAB TO EARN DROPS.</Text>
        )}
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>MARKET SCHEMATIC EXCHANGE</Text>
        <Text style={styles.metaText}>FEED ACCESS: TACTICAL REQUIRES 35 ENGAGEMENT · APEX REQUIRES 65 ENGAGEMENT</Text>
        {marketBlueprints.map((bp) => {
          const price = blueprintMarket.prices[bp.id] ?? 0;
          const stock = blueprintMarket.availability[bp.id] ?? 0;
          const gateOpen = blueprintMarket.themeGates[bp.theme];
          const requiredEngagement = getThemeEngagementRequirement(bp.theme);
          const unlockedByFeed = character.engagement >= requiredEngagement;
          const canAfford = character.dataFragments >= price;
          const canBuy = gateOpen && stock > 0 && canAfford && unlockedByFeed;

          return (
            <View key={`buy-${bp.id}`} style={styles.marketBuyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketName}>{bp.name.toUpperCase()}</Text>
                <Text style={styles.marketMeta}>
                  {THEME_LABELS[bp.theme]} · PRICE {price} · STOCK {stock}
                </Text>
                {!unlockedByFeed && (
                  <Text style={styles.marketLockText}>LOCKED :: REQUIRES {requiredEngagement} ENGAGEMENT</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.buyButton, !canBuy && styles.actionButtonDisabled]}
                disabled={!canBuy}
                onPress={() => purchaseBlueprint(bp.id, 1)}
                activeOpacity={0.75}
              >
                <Text style={styles.buyButtonText}>BUY</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>TRADE LOG</Text>
        {availableTargets.length > 0 && (
          <>
            <Text style={styles.metaText}>TRADE TARGET</Text>
            <View style={styles.filterRow}>
              {availableTargets.map((entry) => (
                <Chip
                  key={entry.id}
                  label={entry.name.toUpperCase()}
                  active={tradeTargetId === entry.id}
                  onPress={() => setTradeTargetId(entry.id)}
                />
              ))}
            </View>
            {tradeTargetId && (
              <View style={styles.filterRow}>
                {BLUEPRINT_DEFS.filter((bp) => (character.blueprintInventory[bp.id] ?? 0) > 0).map((bp) => (
                  <Chip
                    key={`trade-${bp.id}`}
                    label={`SEND ${bp.name.toUpperCase()}`}
                    active={false}
                    onPress={() => transferBlueprint(tradeTargetId, bp.id, 1)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {tradeLog.slice(0, 8).map((entry) => (
          <Text key={entry.id} style={styles.logLine}>
            {entry.type.toUpperCase()}
            {entry.blueprintId ? ` · ${entry.blueprintId}` : ''}
            {entry.amount ? ` · x${entry.amount}` : ''}
            {entry.fragmentDelta ? ` · DF ${entry.fragmentDelta > 0 ? '+' : ''}${entry.fragmentDelta}` : ''}
            {entry.fromCharacterId ? ` · FROM ${entry.fromCharacterId}` : ''}
            {entry.toCharacterId ? ` · TO ${entry.toCharacterId}` : ''}
            {entry.note ? ` · ${entry.note.toUpperCase()}` : ''}
          </Text>
        ))}
        {tradeLog.length === 0 && <Text style={styles.emptyText}>NO TRADE OR INSTALL EVENTS YET.</Text>}
      </View>

      {session.role === 'gm' && (
        <View style={CardStyles.warning}>
          <Text style={styles.sectionTitle}>GM OVERSIGHT TOOL</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.subsectionTitle}>ECONOMY SUMMARY</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>PARTY DATA FRAGMENTS</Text>
              <Text style={styles.summaryValue}>{totalPartyFragments}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TOTAL MARKET STOCK</Text>
              <Text style={styles.summaryValue}>{totalMarketStock}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>LATEST 5 EVENTS</Text>
              <Text style={styles.summaryValue}>{recentEconomyEvents.length}</Text>
            </View>
            {recentEconomyEvents.map((entry) => (
              <Text key={`summary-${entry.id}`} style={styles.summaryEvent}>
                {entry.type.toUpperCase()}
                {entry.blueprintId ? ` · ${entry.blueprintId}` : ''}
                {entry.fragmentDelta ? ` · DF ${entry.fragmentDelta > 0 ? '+' : ''}${entry.fragmentDelta}` : ''}
                {entry.toCharacterId ? ` · TO ${entry.toCharacterId}` : ''}
              </Text>
            ))}
            {recentEconomyEvents.length === 0 && (
              <Text style={styles.summaryEvent}>NO ECONOMY EVENTS RECORDED YET.</Text>
            )}
          </View>

          <Text style={styles.subsectionTitle}>SECTOR RNG</Text>
          <View style={styles.filterRow}>
            {([1, 2, 3, 4, 5] as SectorDifficulty[]).map((difficulty) => {
              const row = SECTOR_LOOT_TABLE[difficulty];
              return (
                <Chip
                  key={`sector-${difficulty}`}
                  label={`S${difficulty} F${row.foundation}/T${row.tactical}/A${row.apex}`}
                  active={sectorDifficulty === difficulty}
                  onPress={() => setSectorDifficulty(difficulty)}
                />
              );
            })}
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={rollSectorLoot} activeOpacity={0.75}>
            <Text style={styles.actionButtonText}>ROLL SECTOR LOOT</Text>
          </TouchableOpacity>
          <Text style={styles.metaText}>
            LAST LOOT DROP: {lastLootBlueprintId ? lastLootBlueprintId.toUpperCase() : 'NONE'}
          </Text>

          <Text style={styles.subsectionTitle}>LOOT SIMULATION</Text>
          <View style={styles.filterRow}>
            <Chip label="100 ROLLS" active={simRollCount === 100} onPress={() => setSimRollCount(100)} />
            <Chip label="500 ROLLS" active={simRollCount === 500} onPress={() => setSimRollCount(500)} />
            <Chip
              label="RUN SIM"
              active={false}
              onPress={() => setSimResult(simulateSectorLoot(sectorDifficulty, blueprintMarket, simRollCount))}
            />
          </View>
          {simResult && (
            <View style={styles.simCard}>
              <Text style={styles.simText}>ROLLS: {simResult.rolls}</Text>
              <Text style={styles.simText}>FOUNDATION: {simResult.byTheme.foundation}</Text>
              <Text style={styles.simText}>TACTICAL: {simResult.byTheme.tactical}</Text>
              <Text style={styles.simText}>APEX: {simResult.byTheme.apex}</Text>
              {Object.entries(simResult.byBlueprint)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, count]) => (
                  <Text key={`sim-${id}`} style={styles.simText}>{id.toUpperCase()} · {count}</Text>
                ))}
            </View>
          )}

          <Text style={styles.subsectionTitle}>PROGRESS GATING</Text>
          <View style={styles.filterRow}>
            {GEAR_THEMES.map((theme) => (
              <Chip
                key={theme}
                label={`${THEME_LABELS[theme]} ${blueprintMarket.themeGates[theme] ? 'ON' : 'OFF'}`}
                active={blueprintMarket.themeGates[theme]}
                onPress={() => setThemeGate(theme, !blueprintMarket.themeGates[theme])}
              />
            ))}
          </View>

          <Text style={styles.subsectionTitle}>BLUEPRINT INJECTOR</Text>
          {party.map((target) => (
            <View key={`inject-${target.id}`} style={styles.injectCard}>
              <Text style={styles.injectTitle}>{target.name.toUpperCase()}</Text>
              <View style={styles.filterRow}>
                {BLUEPRINT_DEFS.map((bp) => (
                  <Chip
                    key={`inject-${target.id}-${bp.id}`}
                    label={`+1 ${bp.name.toUpperCase()}`}
                    active={false}
                    onPress={() => injectBlueprint(target.id, bp.id, 1)}
                  />
                ))}
              </View>
              <View style={styles.filterRow}>
                <Chip
                  label="+25 DF"
                  active={false}
                  onPress={() => awardFragments(target.id, 25, 'gm bonus')}
                />
                <Chip
                  label="+50 DF"
                  active={false}
                  onPress={() => awardFragments(target.id, 50, 'gm reward')}
                />
              </View>
            </View>
          ))}

          <Text style={styles.subsectionTitle}>LOOT OVERRIDE</Text>
          <View style={styles.filterRow}>
            {party.map((target) => (
              <Chip
                key={`override-target-${target.id}`}
                label={target.name.toUpperCase()}
                active={overrideTargetId === target.id}
                onPress={() => setOverrideTargetId(target.id)}
              />
            ))}
          </View>
          {overrideTargetId && (
            <View style={styles.filterRow}>
              {BLUEPRINT_DEFS.map((bp) => (
                <Chip
                  key={`override-${bp.id}`}
                  label={`DROP ${bp.name.toUpperCase()}`}
                  active={false}
                  onPress={() => lootOverride(overrideTargetId, bp.id)}
                />
              ))}
            </View>
          )}

          <Text style={styles.subsectionTitle}>MARKETPLACE MANAGER</Text>
          {BLUEPRINT_DEFS.map((bp) => (
            <View key={`market-${bp.id}`} style={styles.marketRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketName}>{bp.name.toUpperCase()}</Text>
                <Text style={styles.marketMeta}>
                  {bp.dropRule.toUpperCase()} · PRICE {blueprintMarket.prices[bp.id] ?? 0} · STOCK {blueprintMarket.availability[bp.id] ?? 0} · W {blueprintMarket.weightMultipliers[bp.id] ?? 1}
                </Text>
              </View>
              <View style={styles.marketControls}>
                <MiniAdjust label="P+" onPress={() => setBlueprintPrice(bp.id, (blueprintMarket.prices[bp.id] ?? 0) + 5)} />
                <MiniAdjust label="P-" onPress={() => setBlueprintPrice(bp.id, Math.max(0, (blueprintMarket.prices[bp.id] ?? 0) - 5))} />
                <MiniAdjust label="S+" onPress={() => setBlueprintAvailability(bp.id, (blueprintMarket.availability[bp.id] ?? 0) + 1)} />
                <MiniAdjust label="S-" onPress={() => setBlueprintAvailability(bp.id, Math.max(0, (blueprintMarket.availability[bp.id] ?? 0) - 1))} />
                <MiniAdjust
                  label="W+"
                  onPress={() => setBlueprintWeightMultiplier(bp.id, (blueprintMarket.weightMultipliers[bp.id] ?? 1) + 0.1)}
                />
                <MiniAdjust
                  label="W-"
                  onPress={() => setBlueprintWeightMultiplier(bp.id, Math.max(0.1, (blueprintMarket.weightMultipliers[bp.id] ?? 1) - 0.1))}
                />
                <MiniAdjust
                  label={blueprintMarket.lootEnabled[bp.id] ? 'LOOT ON' : 'LOOT OFF'}
                  onPress={() => setBlueprintLootEnabled(bp.id, !blueprintMarket.lootEnabled[bp.id])}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={CardStyles.base}>
        <Text style={styles.sectionTitle}>MASTER ITEM LIST</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="SEARCH ITEM NAME OR FUNCTION"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />

        <View style={styles.filterRow}>
          <Chip label="ALL" active={categoryFilter === 'all'} onPress={() => setCategoryFilter('all')} />
          {GEAR_CATEGORIES.map((category) => (
            <Chip
              key={`filter-${category}`}
              label={CATEGORY_LABELS[category]}
              active={categoryFilter === category}
              onPress={() => setCategoryFilter(category)}
            />
          ))}
        </View>

        {filteredItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.name.toUpperCase()}</Text>
            <Text style={styles.itemMeta}>
              {CATEGORY_LABELS[item.category]} · {THEME_LABELS[item.theme]} · {item.hardpoints} HP
            </Text>
            <Text style={styles.itemFunction}>{item.functionality.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MiniAdjust({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.miniAdjust} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.miniAdjustText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  eyebrow: {
    ...Typography.mono,
    color: Colors.amber,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  bannerCard: {
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bannerLabel: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
    marginBottom: 4,
  },
  bannerText: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 11,
    lineHeight: 18,
  },
  sponsorCard: {
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sponsorTitle: {
    ...Typography.subheading,
    color: Colors.amber,
  },
  sponsorMeta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  sponsorTrait: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.subheading,
    color: Colors.cyan,
    marginBottom: Spacing.sm,
  },
  subsectionTitle: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 11,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  summaryValue: {
    ...Typography.mono,
    color: Colors.green,
    fontSize: 10,
  },
  summaryEvent: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  simCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgDeep,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  simText: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },
  operatorName: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  operatorMeta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  walletText: {
    ...Typography.mono,
    color: Colors.green,
    marginTop: Spacing.xs,
    fontSize: 11,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  inventoryLabel: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
  },
  inventoryValue: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 10,
    marginLeft: Spacing.md,
    flexShrink: 1,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanGlow,
  },
  chipText: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  chipTextActive: {
    color: Colors.cyan,
  },
  metaText: {
    ...Typography.mono,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    fontSize: 10,
  },
  hardpointGrid: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  hardpointCell: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
  },
  hardpointCellActive: {
    borderColor: Colors.cyan,
  },
  hardpointIndex: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
  },
  hardpointBlueprint: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 11,
    marginTop: 2,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: Radius.md,
    backgroundColor: Colors.cyanGlow,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    ...Typography.mono,
    color: Colors.cyan,
    fontSize: 11,
  },
  blueprintRow: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.bgElevated,
  },
  blueprintName: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  blueprintMeta: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
    marginTop: 2,
  },
  blueprintEffect: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  logLine: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },
  injectCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  injectTitle: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 10,
    marginBottom: Spacing.xs,
  },
  marketRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketBuyRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketName: {
    ...Typography.mono,
    color: Colors.textPrimary,
    fontSize: 10,
  },
  marketMeta: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  marketLockText: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
    marginTop: 4,
  },
  marketControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  miniAdjust: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    backgroundColor: Colors.bgDeep,
  },
  miniAdjustText: {
    ...Typography.mono,
    color: Colors.cyan,
    fontSize: 10,
  },
  buyButton: {
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: Radius.sm,
    backgroundColor: Colors.greenGlow,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginLeft: Spacing.sm,
  },
  buyButtonText: {
    ...Typography.mono,
    color: Colors.green,
    fontSize: 10,
  },
  searchInput: {
    ...Typography.mono,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  itemName: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  itemMeta: {
    ...Typography.mono,
    color: Colors.amber,
    fontSize: 10,
    marginTop: 2,
  },
  itemFunction: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  emptyText: {
    ...Typography.mono,
    color: Colors.textSecondary,
    fontSize: 10,
  },
});
