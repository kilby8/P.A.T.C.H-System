#pragma once

#include "CoreMinimal.h"
#include "AttributeSet.h"
#include "AbilitySystemComponent.h"
#include "PatchAttributeSet.generated.h"

#define PATCH_ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
	GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)

/**
 * P.A.T.C.H. vitals (handbook ch. 5, Damage & Vitals):
 * Overshield soaks damage first, the rest goes to Hardware Integrity. Hardware below 50% is Neural Shock,
 * Hardware at 0 is Flatlined. Every point of Overshield damage taken is +1 Engagement, Hardware +2.
 */
UCLASS()
class PATCHGAME_API UPatchAttributeSet : public UAttributeSet
{
	GENERATED_BODY()

public:
	UPatchAttributeSet();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
	virtual void PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue) override;
	virtual void PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data) override;

	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_HardwareIntegrity, Category = "Vitals")
	FGameplayAttributeData HardwareIntegrity;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, HardwareIntegrity)

	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_MaxHardwareIntegrity, Category = "Vitals")
	FGameplayAttributeData MaxHardwareIntegrity;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, MaxHardwareIntegrity)

	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_Overshield, Category = "Vitals")
	FGameplayAttributeData Overshield;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, Overshield)

	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_MaxOvershield, Category = "Vitals")
	FGameplayAttributeData MaxOvershield;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, MaxOvershield)

	/** Action Points: spent on abilities, refilled every round (6 s of arena time). */
	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_AP, Category = "Action")
	FGameplayAttributeData AP;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, AP)

	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_MaxAP, Category = "Action")
	FGameplayAttributeData MaxAP;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, MaxAP)

	/** Target number an attack roll must meet to hit this character. */
	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_Defense, Category = "Combat")
	FGameplayAttributeData Defense;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, Defense)

	/** Broadcast Engagement, 0-100 (handbook ch. 7, What Moves the Meter). */
	UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_Engagement, Category = "Broadcast")
	FGameplayAttributeData Engagement;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, Engagement)

	/** Meta attribute: damage about to be applied. Split into Overshield/Hardware in PostGameplayEffectExecute. */
	UPROPERTY(BlueprintReadOnly, Category = "Meta")
	FGameplayAttributeData IncomingDamage;
	PATCH_ATTRIBUTE_ACCESSORS(UPatchAttributeSet, IncomingDamage)

	bool IsFlatlined() const { return GetHardwareIntegrity() <= 0.f; }
	bool IsInNeuralShock() const { return GetMaxHardwareIntegrity() > 0.f && GetHardwareIntegrity() < GetMaxHardwareIntegrity() * 0.5f; }

protected:
	void RefreshStateTags();

	UFUNCTION() void OnRep_HardwareIntegrity(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_MaxHardwareIntegrity(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_Overshield(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_MaxOvershield(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_AP(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_MaxAP(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_Defense(const FGameplayAttributeData& Old);
	UFUNCTION() void OnRep_Engagement(const FGameplayAttributeData& Old);
};
