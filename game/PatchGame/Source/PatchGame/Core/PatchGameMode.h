#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "PatchGameMode.generated.h"

class APatchEnemyCharacter;
class APatchGameState;
class APatchPlayerCharacter;
struct FPatchSpectacleTier;

/**
 * PvE arena round: fight each Spectacle tier from rules.json as a wave (Dull Broadcast -> Active Engagement ->
 * Prime-Time Surge). Clearing a wave is an encounter end: Overshields reset and the payout adds Engagement.
 * If every operator is Flatlined the squad is wiped and the round restarts.
 */
UCLASS()
class PATCHGAME_API APatchGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	APatchGameMode();

	virtual void StartPlay() override;

	void OnEnemyFlatlined(APatchEnemyCharacter* Enemy, AActor* Killer);
	void OnOperatorFlatlined(APatchPlayerCharacter* Operator);

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	TSubclassOf<APatchEnemyCharacter> EnemyClass;

	/** Spawn a grey-box arena at the first PlayerStart if the level has none, so an empty level is playable. */
	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	bool bAutoSpawnBlockout = true;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float WarmupSeconds = 3.f;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float BetweenWavesSeconds = 5.f;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float RestartSeconds = 6.f;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float SpawnRadiusMin = 1500.f;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float SpawnRadiusMax = 2300.f;

protected:
	void SpawnBlockoutIfNeeded();
	void StartWave(int32 WaveIndex);
	void NextWave();
	void RestartRound();
	void EndEncounterPayout(const FPatchSpectacleTier& Tier);
	bool FindSpawnPoint(const FVector& Anchor, FVector& OutLocation) const;
	FVector GetSpawnAnchor() const;
	APatchGameState* GetPatchGameState() const;

	int32 CurrentWave = -1;
	int32 AliveEnemies = 0;
	FTimerHandle PhaseTimer;

	UPROPERTY(Transient)
	TArray<TObjectPtr<APatchEnemyCharacter>> SpawnedEnemies;
};
