#include "AI/PatchEnemyAIController.h"
#include "Characters/PatchEnemyCharacter.h"
#include "Characters/PatchPlayerCharacter.h"
#include "EngineUtils.h"
#include "Navigation/PathFollowingComponent.h"

APatchEnemyAIController::APatchEnemyAIController()
{
	PrimaryActorTick.bCanEverTick = true;
	bSetControlRotationFromPawnOrientation = false;
}

AActor* APatchEnemyAIController::FindTarget() const
{
	const APawn* Me = GetPawn();
	AActor* Best = nullptr;
	float BestDistSq = TNumericLimits<float>::Max();
	for (TActorIterator<APatchPlayerCharacter> It(GetWorld()); It; ++It)
	{
		if (It->IsFlatlined()) { continue; }
		const float DistSq = FVector::DistSquared(Me->GetActorLocation(), It->GetActorLocation());
		if (DistSq < BestDistSq)
		{
			BestDistSq = DistSq;
			Best = *It;
		}
	}
	return Best;
}

void APatchEnemyAIController::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	APatchEnemyCharacter* Enemy = Cast<APatchEnemyCharacter>(GetPawn());
	if (!Enemy || Enemy->IsFlatlined())
	{
		return;
	}

	const APatchCharacterBase* Current = Cast<APatchCharacterBase>(Target);
	if (!IsValid(Current) || Current->IsFlatlined())
	{
		Target = FindTarget();
	}
	if (!Target)
	{
		StopMovement();
		ClearFocus(EAIFocusPriority::Gameplay);
		return;
	}

	SetFocus(Target);

	const float Range = Enemy->GetAttackRange();
	const float Dist = FVector::Dist(Enemy->GetActorLocation(), Target->GetActorLocation());
	const bool bInRange = Dist <= Range && LineOfSightTo(Target);

	if (bInRange)
	{
		// Ranged entities hold at 70% range; melee ones keep pushing in.
		if (!Enemy->GetStats().IsMelee() || Dist < Range * 0.7f)
		{
			StopMovement();
		}
		Enemy->TryAttack(Target);
		return;
	}

	const double Now = GetWorld()->GetTimeSeconds();
	if (Now >= NextRepathTime)
	{
		NextRepathTime = Now + 0.5;
		const EPathFollowingRequestResult::Type Result = MoveToActor(Target, Range * 0.6f, true, true, true);
		bNoPath = Result == EPathFollowingRequestResult::Failed;
	}
	if (bNoPath)
	{
		// No nav mesh in the level: steer straight at the target.
		Enemy->AddMovementInput((Target->GetActorLocation() - Enemy->GetActorLocation()).GetSafeNormal2D());
	}
}
