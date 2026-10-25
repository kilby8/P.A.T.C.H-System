#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "Rules/PatchDice.h"
#include "PatchCombatStatics.generated.h"

UCLASS()
class PATCHGAME_API UPatchCombatStatics : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()

public:
	/** Server only. Applies UPatchGE_Damage from Source to Target. Returns false if either has no ability system. */
	UFUNCTION(BlueprintCallable, Category = "PATCH|Combat")
	static bool ApplyPatchDamage(AActor* Source, AActor* Target, float Amount, bool bBypassOvershield = false);

	/** Tabletop attack check: roll the pool and compare with the target's Defense. */
	static bool RollToHit(const FPatchDice& AttackPool, AActor* Target);
};
