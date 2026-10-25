#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "PatchEnemyAIController.generated.h"

/**
 * Minimal bestiary brain: pick the nearest standing operator, close to attack range, attack when in sight.
 * Uses the nav mesh when there is one and steers straight at the target when there isn't.
 * Placeholder for per-entity Behavior Trees driven by each stat block's "tactics" line.
 */
UCLASS()
class PATCHGAME_API APatchEnemyAIController : public AAIController
{
	GENERATED_BODY()

public:
	APatchEnemyAIController();

	virtual void Tick(float DeltaSeconds) override;

protected:
	AActor* FindTarget() const;

	UPROPERTY(Transient)
	TObjectPtr<AActor> Target;

	double NextRepathTime = 0.0;
	bool bNoPath = false;
};
