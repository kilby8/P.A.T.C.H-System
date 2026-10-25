#include "Abilities/PatchAttributeSet.h"
#include "Characters/PatchCharacterBase.h"
#include "Core/PatchGameplayTags.h"
#include "GameplayEffectExtension.h"
#include "Net/UnrealNetwork.h"

UPatchAttributeSet::UPatchAttributeSet()
{
	InitHardwareIntegrity(20.f);
	InitMaxHardwareIntegrity(20.f);
	InitOvershield(25.f);
	InitMaxOvershield(25.f);
	InitAP(2.f);
	InitMaxAP(2.f);
	InitDefense(15.f);
	InitEngagement(0.f);
	InitIncomingDamage(0.f);
}

void UPatchAttributeSet::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, HardwareIntegrity, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, MaxHardwareIntegrity, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, Overshield, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, MaxOvershield, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, AP, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, MaxAP, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, Defense, COND_None, REPNOTIFY_Always);
	DOREPLIFETIME_CONDITION_NOTIFY(UPatchAttributeSet, Engagement, COND_None, REPNOTIFY_Always);
}

void UPatchAttributeSet::PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue)
{
	Super::PreAttributeChange(Attribute, NewValue);

	if (Attribute == GetHardwareIntegrityAttribute())
	{
		NewValue = FMath::Clamp(NewValue, 0.f, GetMaxHardwareIntegrity());
	}
	else if (Attribute == GetOvershieldAttribute())
	{
		NewValue = FMath::Clamp(NewValue, 0.f, GetMaxOvershield());
	}
	else if (Attribute == GetAPAttribute())
	{
		NewValue = FMath::Clamp(NewValue, 0.f, GetMaxAP());
	}
	else if (Attribute == GetEngagementAttribute())
	{
		NewValue = FMath::Clamp(NewValue, 0.f, 100.f);
	}
}

void UPatchAttributeSet::PostGameplayEffectExecute(const FGameplayEffectModCallbackData& Data)
{
	Super::PostGameplayEffectExecute(Data);

	if (Data.EvaluatedData.Attribute != GetIncomingDamageAttribute())
	{
		return;
	}

	float Remaining = FMath::Max(0.f, GetIncomingDamage());
	SetIncomingDamage(0.f);
	if (Remaining <= 0.f || IsFlatlined())
	{
		return;
	}

	const bool bBypass = Data.EffectSpec.GetDynamicAssetTags().HasTag(PatchTags::Damage_BypassOvershield);

	float ShieldDamage = 0.f;
	if (!bBypass)
	{
		ShieldDamage = FMath::Min(Remaining, GetOvershield());
		SetOvershield(GetOvershield() - ShieldDamage);
		Remaining -= ShieldDamage;
	}

	// Damage beyond 0 Hardware is ignored.
	const float HardwareDamage = FMath::Min(Remaining, GetHardwareIntegrity());
	SetHardwareIntegrity(GetHardwareIntegrity() - HardwareDamage);

	// The feed loves pain: +1 Engagement per Overshield point, +2 per Hardware point.
	SetEngagement(GetEngagement() + ShieldDamage + 2.f * HardwareDamage);

	RefreshStateTags();

	APatchCharacterBase* Victim = Cast<APatchCharacterBase>(GetOwningActor());
	AActor* Instigator = Data.EffectSpec.GetContext().GetOriginalInstigator();
	if (Victim)
	{
		Victim->OnDamaged(ShieldDamage, HardwareDamage, Instigator);
		if (IsFlatlined())
		{
			Victim->HandleFlatlined(Instigator);
		}
	}
}

void UPatchAttributeSet::RefreshStateTags()
{
	UAbilitySystemComponent* ASC = GetOwningAbilitySystemComponent();
	if (!ASC)
	{
		return;
	}
	ASC->SetLooseGameplayTagCount(PatchTags::State_NeuralShock, IsInNeuralShock() && !IsFlatlined() ? 1 : 0);
	ASC->SetLooseGameplayTagCount(PatchTags::State_Flatlined, IsFlatlined() ? 1 : 0);
}

void UPatchAttributeSet::OnRep_HardwareIntegrity(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, HardwareIntegrity, Old); }
void UPatchAttributeSet::OnRep_MaxHardwareIntegrity(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, MaxHardwareIntegrity, Old); }
void UPatchAttributeSet::OnRep_Overshield(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, Overshield, Old); }
void UPatchAttributeSet::OnRep_MaxOvershield(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, MaxOvershield, Old); }
void UPatchAttributeSet::OnRep_AP(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, AP, Old); }
void UPatchAttributeSet::OnRep_MaxAP(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, MaxAP, Old); }
void UPatchAttributeSet::OnRep_Defense(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, Defense, Old); }
void UPatchAttributeSet::OnRep_Engagement(const FGameplayAttributeData& Old) { GAMEPLAYATTRIBUTE_REPNOTIFY(UPatchAttributeSet, Engagement, Old); }
