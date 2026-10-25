#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Rules/PatchRulesTypes.h"
#include "PatchRulesSubsystem.generated.h"

/**
 * Loads the P.A.T.C.H. System rulebook data (Content/Data/rules.json, synced from
 * rulebook/data/rules.json by Tools/sync_rules.py) once per game instance and serves it to gameplay code.
 */
UCLASS()
class PATCHGAME_API UPatchRulesSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;

	static UPatchRulesSubsystem* Get(const UObject* WorldContext);

	UFUNCTION(BlueprintPure, Category = "PATCH|Rules")
	bool IsLoaded() const { return bLoaded; }

	const FPatchEnemyStats* FindEnemy(int32 BestiaryId) const { return Enemies.Find(BestiaryId); }
	const FPatchGearStats* FindGear(FName GearId) const { return Gear.Find(GearId); }
	const TArray<FPatchSpectacleTier>& GetSpectacleTiers() const { return SpectacleTiers; }

	/** Derived stats for an attribute value 1-5 (clamped). */
	FPatchDerivedRow GetDerived(int32 AttributeValue) const;

	/** Difficulty ladder target by label, e.g. "HARD" -> 20. */
	int32 GetLadderTarget(const FString& Label, int32 Fallback = 15) const;

	int32 GetOvershieldMin() const { return OvershieldRange.X; }
	int32 GetOvershieldMax() const { return OvershieldRange.Y; }

private:
	bool LoadFromFile(const FString& Path);

	bool bLoaded = false;
	TMap<int32, FPatchEnemyStats> Enemies;
	TMap<FName, FPatchGearStats> Gear;
	TArray<FPatchSpectacleTier> SpectacleTiers;
	TArray<FPatchDerivedRow> Derived;
	TMap<FString, int32> Ladder;
	FIntPoint OvershieldRange = FIntPoint(19, 31);
};
