#pragma once

#include "CoreMinimal.h"
#include "Abilities/GameplayAbility.h"
#include "PatchGA_RebootShield.generated.h"

/** Reboot Shield (2 AP): regain 1d6 + SYSTEM Overshield, not above max. */
UCLASS()
class PATCHGAME_API UPatchGA_RebootShield : public UGameplayAbility
{
	GENERATED_BODY()

public:
	UPatchGA_RebootShield();

	virtual bool CanActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
		const FGameplayTagContainer* SourceTags, const FGameplayTagContainer* TargetTags, FGameplayTagContainer* OptionalRelevantTags) const override;

	virtual void ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo,
		const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData) override;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float APCost = 2.f;
};
