#include "Abilities/PatchCombatStatics.h"
#include "Abilities/PatchAttributeSet.h"
#include "Abilities/PatchGameplayEffects.h"
#include "AbilitySystemBlueprintLibrary.h"
#include "AbilitySystemComponent.h"
#include "Core/PatchGameplayTags.h"

bool UPatchCombatStatics::ApplyPatchDamage(AActor* Source, AActor* Target, float Amount, bool bBypassOvershield)
{
	if (!Source || !Target || !Source->HasAuthority() || Amount <= 0.f)
	{
		return false;
	}

	UAbilitySystemComponent* SourceASC = UAbilitySystemBlueprintLibrary::GetAbilitySystemComponent(Source);
	UAbilitySystemComponent* TargetASC = UAbilitySystemBlueprintLibrary::GetAbilitySystemComponent(Target);
	if (!SourceASC || !TargetASC)
	{
		return false;
	}

	FGameplayEffectContextHandle Context = SourceASC->MakeEffectContext();
	Context.AddInstigator(Source, Source);
	const FGameplayEffectSpecHandle Spec = SourceASC->MakeOutgoingSpec(UPatchGE_Damage::StaticClass(), 1.f, Context);
	if (!Spec.IsValid())
	{
		return false;
	}

	Spec.Data->SetSetByCallerMagnitude(PatchSetByCaller::Damage, Amount);
	if (bBypassOvershield)
	{
		Spec.Data->AddDynamicAssetTag(PatchTags::Damage_BypassOvershield);
	}
	SourceASC->ApplyGameplayEffectSpecToTarget(*Spec.Data.Get(), TargetASC);
	return true;
}

bool UPatchCombatStatics::RollToHit(const FPatchDice& AttackPool, AActor* Target)
{
	const UAbilitySystemComponent* TargetASC = UAbilitySystemBlueprintLibrary::GetAbilitySystemComponent(Target);
	bool bFound = false;
	const float Defense = TargetASC ? TargetASC->GetGameplayAttributeValue(UPatchAttributeSet::GetDefenseAttribute(), bFound) : 15.f;
	return AttackPool.Roll() >= (bFound ? Defense : 15.f);
}
