// ============================================================
// P.A.T.C.H. SYSTEM — Character Creation Terminal
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCharacter } from '../../store/CharacterContext';
import { Colors, Typography, Spacing, GlobalStyles } from '../../theme/theme';
import { BACKGROUND_PROFILES, BACKGROUND_CATEGORY_LABELS, CoreAttribute } from '../../models/Backgrounds';
import { createCharacter, CpuAttributes } from '../../models/Character';

interface AttributeAllocation {
  POWER: number;
  PING: number;
  HARDWARE: number;
  DATA: number;
  SYSTEM: number;
  CLOUT: number;
}

const ATTRIBUTES: CoreAttribute[] = ['POWER', 'PING', 'HARDWARE', 'DATA', 'SYSTEM', 'CLOUT'];
const BASE_ATTRIBUTE = 10;
const TOTAL_ATTRIBUTE_POINTS = 27; // Points to distribute
const MIN_ATTRIBUTE = 8;
const MAX_ATTRIBUTE = 15;

export default function CharacterCreationTerminal() {
  const { createNewCharacter, loginAsPlayer, party } = useCharacter();
  const [step, setStep] = useState<'name' | 'background' | 'attributes' | 'confirm'>('name');
  const [characterName, setCharacterName] = useState('');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(BACKGROUND_PROFILES[0]?.id);
  const [attributes, setAttributes] = useState<AttributeAllocation>({
    POWER: BASE_ATTRIBUTE,
    PING: BASE_ATTRIBUTE,
    HARDWARE: BASE_ATTRIBUTE,
    DATA: BASE_ATTRIBUTE,
    SYSTEM: BASE_ATTRIBUTE,
    CLOUT: BASE_ATTRIBUTE,
  });

  // Calculate remaining points to distribute
  const totalAllocated = Object.values(attributes).reduce((sum, val) => sum + (val - BASE_ATTRIBUTE), 0);
  const remainingPoints = TOTAL_ATTRIBUTE_POINTS - totalAllocated;

  // Validate current state
  const canProceedName = characterName.trim().length > 0;
  const canProceedBackground = !!selectedBackgroundId;
  const canProceedAttributes = remainingPoints === 0;

  const selectedBackground = BACKGROUND_PROFILES.find((bg) => bg.id === selectedBackgroundId);
  const categoryLabel = selectedBackground ? BACKGROUND_CATEGORY_LABELS[selectedBackground.category] : '';

  const handleAttributeChange = (attr: CoreAttribute, delta: number) => {
    const newValue = attributes[attr] + delta;
    if (newValue < MIN_ATTRIBUTE || newValue > MAX_ATTRIBUTE) return;

    const pointDelta = delta;
    if (remainingPoints - pointDelta < -TOTAL_ATTRIBUTE_POINTS / 6) return; // Can't go more than 1 below per attr

    setAttributes({
      ...attributes,
      [attr]: newValue,
    });
  };

  const handleCreateCharacter = async () => {
    if (!selectedBackgroundId || !canProceedAttributes) {
      Alert.alert('Invalid', 'Please complete attribute allocation');
      return;
    }

    const newCharacter = createCharacter(
      `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      characterName.trim(),
      attributes as CpuAttributes,
      0,
      selectedBackgroundId,
    );

    await createNewCharacter(newCharacter);
    await loginAsPlayer(newCharacter.id);
  };

  const handleReset = () => {
    setCharacterName('');
    setSelectedBackgroundId(BACKGROUND_PROFILES[0]?.id);
    setAttributes({
      POWER: BASE_ATTRIBUTE,
      PING: BASE_ATTRIBUTE,
      HARDWARE: BASE_ATTRIBUTE,
      DATA: BASE_ATTRIBUTE,
      SYSTEM: BASE_ATTRIBUTE,
      CLOUT: BASE_ATTRIBUTE,
    });
    setStep('name');
  };

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>01 :: NAME YOUR OPERATOR</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Enter operator name"
        placeholderTextColor={Colors.text.muted}
        value={characterName}
        onChangeText={setCharacterName}
        maxLength={32}
      />
      <Text style={styles.hint}>
        {characterName.length}/32 characters
      </Text>
      <TouchableOpacity
        style={[styles.button, !canProceedName && styles.buttonDisabled]}
        onPress={() => setStep('background')}
        disabled={!canProceedName}
      >
        <Text style={styles.buttonText}>CONTINUE →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBackgroundStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>02 :: SELECT BACKGROUND</Text>
      <ScrollView style={styles.backgroundList}>
        {BACKGROUND_PROFILES.map((bg) => (
          <TouchableOpacity
            key={bg.id}
            style={[
              styles.backgroundItem,
              selectedBackgroundId === bg.id && styles.backgroundItemActive,
            ]}
            onPress={() => setSelectedBackgroundId(bg.id)}
          >
            <Text style={styles.backgroundName}>{bg.name}</Text>
            <Text style={styles.backgroundCategory}>{BACKGROUND_CATEGORY_LABELS[bg.category]}</Text>
            <Text style={styles.backgroundTrait}>{bg.sharedCoreTrait}</Text>
            <Text style={styles.backgroundFocus}>Build: {bg.buildFocus}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setStep('name')}
        >
          <Text style={styles.buttonText}>← BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !canProceedBackground && styles.buttonDisabled]}
          onPress={() => setStep('attributes')}
          disabled={!canProceedBackground}
        >
          <Text style={styles.buttonText}>CONTINUE →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAttributesStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>03 :: ALLOCATE ATTRIBUTES</Text>
      <Text style={styles.hint}>Distribute {TOTAL_ATTRIBUTE_POINTS} points across your CPU attributes</Text>
      <View style={styles.attributesSummary}>
        <Text style={[styles.hint, { color: remainingPoints === 0 ? Colors.success : Colors.warning }]}>
          Remaining: {remainingPoints > 0 ? '+' + remainingPoints : remainingPoints}
        </Text>
      </View>

      <ScrollView style={styles.attributesList}>
        {ATTRIBUTES.map((attr) => (
          <View key={attr} style={styles.attributeControl}>
            <Text style={styles.attributeName}>{attr}</Text>
            <View style={styles.attributeAdjust}>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => handleAttributeChange(attr, -1)}
                disabled={attributes[attr] <= MIN_ATTRIBUTE}
              >
                <Text style={styles.adjustButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.attributeValue}>{attributes[attr]}</Text>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => handleAttributeChange(attr, 1)}
                disabled={attributes[attr] >= MAX_ATTRIBUTE || remainingPoints <= 0}
              >
                <Text style={styles.adjustButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setStep('background')}
        >
          <Text style={styles.buttonText}>← BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !canProceedAttributes && styles.buttonDisabled]}
          onPress={() => setStep('confirm')}
          disabled={!canProceedAttributes}
        >
          <Text style={styles.buttonText}>CONTINUE →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>04 :: CONFIRM OPERATOR</Text>
      <View style={styles.confirmSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>NAME:</Text>
          <Text style={styles.summaryValue}>{characterName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>BACKGROUND:</Text>
          <Text style={styles.summaryValue}>{selectedBackground?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>CATEGORY:</Text>
          <Text style={styles.summaryValue}>{categoryLabel}</Text>
        </View>
        <View style={styles.divider} />
        {ATTRIBUTES.map((attr) => (
          <View key={attr} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{attr}:</Text>
            <Text style={styles.summaryValue}>{attributes[attr]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setStep('attributes')}
        >
          <Text style={styles.buttonText}>← BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateCharacter}
        >
          <Text style={styles.buttonText}>CREATE OPERATOR</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleReset}
      >
        <Text style={styles.resetButtonText}>reset</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>OPERATOR TERMINAL :: CREATE NEW</Text>

        {step === 'name' && renderNameStep()}
        {step === 'background' && renderBackgroundStep()}
        {step === 'attributes' && renderAttributesStep()}
        {step === 'confirm' && renderConfirmStep()}

        <View style={styles.progress}>
          <Text style={styles.progressText}>Step {['name', 'background', 'attributes', 'confirm'].indexOf(step) + 1} / 4</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
    padding: Spacing.lg,
  },
  header: {
    ...Typography.titles.terminal,
    marginBottom: Spacing.xl,
    color: Colors.accent.primary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepTitle: {
    ...Typography.titles.terminal,
    fontSize: 16,
    marginBottom: Spacing.lg,
    color: Colors.accent.primary,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.background.darker,
    color: Colors.text.primary,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontFamily: Typography.fonts.mono,
    fontSize: 14,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.text.muted,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.text.muted,
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  buttonText: {
    ...Typography.body.small,
    color: Colors.background.dark,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  resetButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  resetButtonText: {
    ...Typography.body.small,
    color: Colors.text.muted,
    textDecorationLine: 'underline',
  },
  backgroundList: {
    maxHeight: 300,
    marginBottom: Spacing.lg,
  },
  backgroundItem: {
    borderWidth: 1,
    borderColor: Colors.text.muted,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.darker,
  },
  backgroundItemActive: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary + '20',
  },
  backgroundName: {
    ...Typography.body.small,
    color: Colors.accent.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  backgroundCategory: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  backgroundTrait: {
    ...Typography.body.small,
    color: Colors.text.muted,
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  backgroundFocus: {
    ...Typography.body.small,
    color: Colors.text.muted,
    fontSize: 12,
  },
  attributesList: {
    maxHeight: 300,
    marginBottom: Spacing.lg,
  },
  attributesSummary: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.muted,
  },
  attributeControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.darker,
  },
  attributeName: {
    ...Typography.body.small,
    color: Colors.accent.primary,
    flex: 1,
    fontWeight: 'bold',
    minWidth: 80,
  },
  attributeValue: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  attributeAdjust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  adjustButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    color: Colors.background.dark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  confirmSummary: {
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.background.darker,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    flex: 1,
  },
  summaryValue: {
    ...Typography.body.small,
    color: Colors.accent.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.text.muted,
    marginVertical: Spacing.md,
  },
  progress: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.text.muted,
  },
  progressText: {
    ...Typography.body.small,
    color: Colors.text.muted,
  },
});

