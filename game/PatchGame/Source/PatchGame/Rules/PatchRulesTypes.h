#pragma once

#include "CoreMinimal.h"
#include "Rules/PatchDice.h"
#include "PatchRulesTypes.generated.h"

/** One bestiary stat block (rules.json "bestiary"). */
USTRUCT(BlueprintType)
struct PATCHGAME_API FPatchEnemyStats
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") int32 Id = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") FString Name;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") FString Role;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") FString Tier;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") int32 Integrity = 10;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") int32 AP = 2;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") int32 Init = 10;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") int32 Defense = 15;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") FPatchDice Attack;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") FPatchDice Damage;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") int32 Threat = 1;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") float MoveMeters = 6.f;
	UPROPERTY(BlueprintReadOnly, Category = "Bestiary") FString Tactics;

	/** Swarmers and tanks close to melee range; everyone else shoots. */
	bool IsMelee() const { return Role.Contains(TEXT("Melee")) || Role.Contains(TEXT("Tank")) || Role.Contains(TEXT("Harpoon")); }
};

/** One gear item (rules.json "gear"). */
USTRUCT(BlueprintType)
struct PATCHGAME_API FPatchGearStats
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "Gear") FName Id;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") FString Name;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") FString Category;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") FString Skill;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") FPatchDice Damage;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") FString DamageType;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") float RangeMeters = 2.f;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") int32 DefenseBonus = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Gear") FString Feature;
};

USTRUCT(BlueprintType)
struct PATCHGAME_API FPatchSpectacleForce
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") int32 BestiaryId = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") int32 Count = 1;
};

/** One encounter build from the Spectacle table (rules.json "spectacle"). Used as a wave. */
USTRUCT(BlueprintType)
struct PATCHGAME_API FPatchSpectacleTier
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") FName Key;
	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") FString Label;
	/** Low end of the tier's Spectacle score range. Payout Engagement is 3 x Spectacle (min 4). */
	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") int32 SpectacleScore = 1;
	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") TArray<FPatchSpectacleForce> Force;
	UPROPERTY(BlueprintReadOnly, Category = "Spectacle") TArray<FString> Modifiers;

	bool HasDoubleDamage() const { return Modifiers.ContainsByPredicate([](const FString& M) { return M.Contains(TEXT("Damage double")); }); }
};

/** Attribute value 1-5 -> derived stats (rules.json "derived"). */
USTRUCT(BlueprintType)
struct PATCHGAME_API FPatchDerivedRow
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "Derived") int32 Value = 1;
	UPROPERTY(BlueprintReadOnly, Category = "Derived") int32 Bonus = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Derived") int32 Hardware = 10;
	UPROPERTY(BlueprintReadOnly, Category = "Derived") int32 HardwareInmate = 15;
	UPROPERTY(BlueprintReadOnly, Category = "Derived") int32 AP = 1;
};
