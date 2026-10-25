#include "Abilities/PatchGameplayEffects.h"
#include "Abilities/PatchAttributeSet.h"
#include "Core/PatchGameplayTags.h"

UPatchGE_Damage::UPatchGE_Damage()
{
	DurationPolicy = EGameplayEffectDurationType::Instant;

	FSetByCallerFloat SetByCaller;
	SetByCaller.DataName = PatchSetByCaller::Damage;

	FGameplayModifierInfo Modifier;
	Modifier.Attribute = UPatchAttributeSet::GetIncomingDamageAttribute();
	Modifier.ModifierOp = EGameplayModOp::Additive;
	Modifier.ModifierMagnitude = FGameplayEffectModifierMagnitude(SetByCaller);
	Modifiers.Add(Modifier);
}
