#include "Abilities/PatchGA_RebootShield.h"
#include "Abilities/PatchAttributeSet.h"
#include "AbilitySystemComponent.h"
#include "Characters/PatchCharacterBase.h"
#include "Rules/PatchDice.h"

UPatchGA_RebootShield::UPatchGA_RebootShield()
{
	InstancingPolicy = EGameplayAbilityInstancingPolicy::InstancedPerActor;
	NetExecutionPolicy = EGameplayAbilityNetExecutionPolicy::ServerOnly;
}

bool UPatchGA_RebootShield::CanActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
	const FGameplayTagContainer* SourceTags, const FGameplayTagContainer* TargetTags, FGameplayTagContainer* OptionalRelevantTags) const
{
	if (!Super::CanActivateAbility(Handle, ActorInfo, SourceTags, TargetTags, OptionalRelevantTags))
	{
		return false;
	}
	const UAbilitySystemComponent* ASC = ActorInfo ? ActorInfo->AbilitySystemComponent.Get() : nullptr;
	const UPatchAttributeSet* Attributes = ASC ? ASC->GetSet<UPatchAttributeSet>() : nullptr;
	return Attributes && !Attributes->IsFlatlined() && Attributes->GetAP() >= APCost && Attributes->GetOvershield() < Attributes->GetMaxOvershield();
}

void UPatchGA_RebootShield::ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
	const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData)
{
	UAbilitySystemComponent* ASC = ActorInfo->AbilitySystemComponent.Get();
	const APatchCharacterBase* Character = Cast<APatchCharacterBase>(ActorInfo->AvatarActor.Get());
	if (!ASC || !Character)
	{
		EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
		return;
	}

	const int32 Regained = FPatchDice(1, 6, Character->GetSystemAttribute()).Roll();
	ASC->ApplyModToAttribute(UPatchAttributeSet::GetAPAttribute(), EGameplayModOp::Additive, -APCost);
	ASC->ApplyModToAttribute(UPatchAttributeSet::GetOvershieldAttribute(), EGameplayModOp::Additive, Regained);
	// Spending AP is acting on camera: +1 Engagement per AP.
	ASC->ApplyModToAttribute(UPatchAttributeSet::GetEngagementAttribute(), EGameplayModOp::Additive, APCost);

	EndAbility(Handle, ActorInfo, ActivationInfo, true, false);
}
