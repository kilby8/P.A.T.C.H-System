#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "PatchGameState.generated.h"

UENUM(BlueprintType)
enum class EPatchRoundPhase : uint8
{
	Warmup,
	Fighting,
	WaveCleared,
	RoundWon,
	SquadWiped
};

/** Round state everyone sees on the HUD. */
UCLASS()
class PATCHGAME_API APatchGameState : public AGameStateBase
{
	GENERATED_BODY()

public:
	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

	UPROPERTY(Replicated, BlueprintReadOnly, Category = "PATCH") EPatchRoundPhase Phase = EPatchRoundPhase::Warmup;
	UPROPERTY(Replicated, BlueprintReadOnly, Category = "PATCH") int32 WaveNumber = 0;
	UPROPERTY(Replicated, BlueprintReadOnly, Category = "PATCH") int32 WaveCount = 0;
	UPROPERTY(Replicated, BlueprintReadOnly, Category = "PATCH") FString WaveLabel;
	UPROPERTY(Replicated, BlueprintReadOnly, Category = "PATCH") int32 EnemiesRemaining = 0;
};
