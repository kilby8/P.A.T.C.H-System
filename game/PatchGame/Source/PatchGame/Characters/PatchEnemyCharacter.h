#pragma once

#include "CoreMinimal.h"
#include "Characters/PatchCharacterBase.h"
#include "Rules/PatchRulesTypes.h"
#include "PatchEnemyCharacter.generated.h"

/**
 * A bestiary entity. Stats come from its rules.json stat block: Integrity, AP, Defense, attack pool, damage dice,
 * move. It attacks AP times per round, rolling its attack pool against the target's Defense like the tabletop.
 */
UCLASS()
class PATCHGAME_API APatchEnemyCharacter : public APatchCharacterBase
{
	GENERATED_BODY()

public:
	APatchEnemyCharacter();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
	virtual void BeginPlay() override;
	virtual void HandleFlatlined(AActor* DamageInstigator) override;

	/** Set before BeginPlay (deferred spawn) or in the level. */
	UPROPERTY(EditAnywhere, ReplicatedUsing = OnRep_BestiaryId, BlueprintReadOnly, Category = "PATCH")
	int32 BestiaryId = 1;

	/** Multiplies rolled damage (Prime-Time Surge "Damage double effect"). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "PATCH")
	float DamageMultiplier = 1.f;

	/** Tabletop move meters per round -> walk speed. 6 m -> 360 uu/s. */
	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float MoveMetersToSpeed = 60.f;

	const FPatchEnemyStats& GetStats() const { return Stats; }
	float GetAttackRange() const;

	/** Server: try to attack. Returns false while on cooldown. */
	bool TryAttack(AActor* Target);

protected:
	UFUNCTION()
	void OnRep_BestiaryId();

	void LoadStats();
	FLinearColor GetTierColor() const;

	FPatchEnemyStats Stats;
	double NextAttackTime = 0.0;
};
