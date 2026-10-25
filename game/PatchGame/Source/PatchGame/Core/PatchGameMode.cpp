#include "Core/PatchGameMode.h"
#include "Abilities/PatchAttributeSet.h"
#include "AbilitySystemComponent.h"
#include "Characters/PatchEnemyCharacter.h"
#include "Characters/PatchPlayerCharacter.h"
#include "Core/PatchGame.h"
#include "Core/PatchGameState.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/PlayerStart.h"
#include "Rules/PatchRulesSubsystem.h"
#include "TimerManager.h"
#include "UI/PatchHUD.h"
#include "World/PatchArenaBlockout.h"

APatchGameMode::APatchGameMode()
{
	DefaultPawnClass = APatchPlayerCharacter::StaticClass();
	HUDClass = APatchHUD::StaticClass();
	GameStateClass = APatchGameState::StaticClass();
	EnemyClass = APatchEnemyCharacter::StaticClass();
}

APatchGameState* APatchGameMode::GetPatchGameState() const
{
	return GetGameState<APatchGameState>();
}

void APatchGameMode::SpawnBlockoutIfNeeded()
{
	if (!bAutoSpawnBlockout || TActorIterator<APatchArenaBlockout>(GetWorld()))
	{
		return;
	}
	FVector Origin = FVector::ZeroVector;
	for (TActorIterator<APlayerStart> It(GetWorld()); It; ++It)
	{
		// Floor top just under the PlayerStart's capsule.
		Origin = It->GetActorLocation() - FVector(0.f, 0.f, 100.f);
		break;
	}
	FActorSpawnParameters Params;
	Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
	GetWorld()->SpawnActor<APatchArenaBlockout>(APatchArenaBlockout::StaticClass(), FTransform(Origin), Params);
}

void APatchGameMode::StartPlay()
{
	SpawnBlockoutIfNeeded();
	Super::StartPlay();

	if (const UPatchRulesSubsystem* Rules = UPatchRulesSubsystem::Get(this))
	{
		GetPatchGameState()->WaveCount = Rules->GetSpectacleTiers().Num();
	}
	GetPatchGameState()->Phase = EPatchRoundPhase::Warmup;
	GetWorldTimerManager().SetTimer(PhaseTimer, this, &APatchGameMode::NextWave, WarmupSeconds, false);
}

void APatchGameMode::NextWave()
{
	StartWave(CurrentWave + 1);
}

void APatchGameMode::StartWave(int32 WaveIndex)
{
	const UPatchRulesSubsystem* Rules = UPatchRulesSubsystem::Get(this);
	if (!Rules || !Rules->GetSpectacleTiers().IsValidIndex(WaveIndex))
	{
		UE_LOG(LogPatch, Error, TEXT("No spectacle tier %d to spawn"), WaveIndex);
		return;
	}

	CurrentWave = WaveIndex;
	const FPatchSpectacleTier& Tier = Rules->GetSpectacleTiers()[WaveIndex];
	const FVector Anchor = GetSpawnAnchor();

	SpawnedEnemies.Reset();
	AliveEnemies = 0;
	for (const FPatchSpectacleForce& Force : Tier.Force)
	{
		for (int32 i = 0; i < Force.Count; ++i)
		{
			FVector Location;
			if (!FindSpawnPoint(Anchor, Location))
			{
				continue;
			}
			const FRotator Facing = (Anchor - Location).GetSafeNormal2D().Rotation();
			APatchEnemyCharacter* Enemy = GetWorld()->SpawnActorDeferred<APatchEnemyCharacter>(EnemyClass, FTransform(Facing, Location),
				nullptr, nullptr, ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn);
			if (!Enemy)
			{
				continue;
			}
			Enemy->BestiaryId = Force.BestiaryId;
			Enemy->DamageMultiplier = Tier.HasDoubleDamage() ? 2.f : 1.f;
			Enemy->FinishSpawning(FTransform(Facing, Location));
			SpawnedEnemies.Add(Enemy);
			++AliveEnemies;
		}
	}

	APatchGameState* GS = GetPatchGameState();
	GS->Phase = EPatchRoundPhase::Fighting;
	GS->WaveNumber = WaveIndex + 1;
	GS->WaveLabel = Tier.Label;
	GS->EnemiesRemaining = AliveEnemies;
	UE_LOG(LogPatch, Log, TEXT("Wave %d (%s): %d entities"), WaveIndex + 1, *Tier.Label, AliveEnemies);
}

FVector APatchGameMode::GetSpawnAnchor() const
{
	for (FConstPlayerControllerIterator It = GetWorld()->GetPlayerControllerIterator(); It; ++It)
	{
		if (const APawn* Pawn = It->Get() ? It->Get()->GetPawn() : nullptr)
		{
			return Pawn->GetActorLocation();
		}
	}
	for (TActorIterator<APlayerStart> It(GetWorld()); It; ++It)
	{
		return It->GetActorLocation();
	}
	return FVector::ZeroVector;
}

bool APatchGameMode::FindSpawnPoint(const FVector& Anchor, FVector& OutLocation) const
{
	for (int32 Attempt = 0; Attempt < 12; ++Attempt)
	{
		const float Angle = FMath::FRandRange(0.f, 2.f * PI);
		const float Radius = FMath::FRandRange(SpawnRadiusMin, SpawnRadiusMax);
		const FVector Probe = Anchor + FVector(FMath::Cos(Angle) * Radius, FMath::Sin(Angle) * Radius, 0.f);

		FHitResult Hit;
		if (GetWorld()->LineTraceSingleByChannel(Hit, Probe + FVector(0.f, 0.f, 800.f), Probe - FVector(0.f, 0.f, 2000.f), ECC_Visibility))
		{
			OutLocation = Hit.ImpactPoint + FVector(0.f, 0.f, 100.f);
			return true;
		}
	}
	// Nothing under the ring (tiny test level): drop them near the anchor.
	OutLocation = Anchor + FMath::VRand().GetSafeNormal2D() * 600.f + FVector(0.f, 0.f, 50.f);
	return true;
}

void APatchGameMode::OnEnemyFlatlined(APatchEnemyCharacter* Enemy, AActor* Killer)
{
	if (!SpawnedEnemies.Contains(Enemy))
	{
		return;
	}
	SpawnedEnemies.Remove(Enemy);
	AliveEnemies = FMath::Max(0, AliveEnemies - 1);

	APatchGameState* GS = GetPatchGameState();
	GS->EnemiesRemaining = AliveEnemies;
	if (AliveEnemies > 0 || GS->Phase != EPatchRoundPhase::Fighting)
	{
		return;
	}

	const UPatchRulesSubsystem* Rules = UPatchRulesSubsystem::Get(this);
	if (Rules && Rules->GetSpectacleTiers().IsValidIndex(CurrentWave))
	{
		EndEncounterPayout(Rules->GetSpectacleTiers()[CurrentWave]);
	}

	const bool bLastWave = !Rules || CurrentWave + 1 >= Rules->GetSpectacleTiers().Num();
	if (bLastWave)
	{
		GS->Phase = EPatchRoundPhase::RoundWon;
		GetWorldTimerManager().SetTimer(PhaseTimer, this, &APatchGameMode::RestartRound, RestartSeconds * 2.f, false);
	}
	else
	{
		GS->Phase = EPatchRoundPhase::WaveCleared;
		GetWorldTimerManager().SetTimer(PhaseTimer, this, &APatchGameMode::NextWave, BetweenWavesSeconds, false);
	}
}

void APatchGameMode::EndEncounterPayout(const FPatchSpectacleTier& Tier)
{
	// Encounter end: Overshields reset to full, and claiming the payout is +3 x Spectacle Engagement (min 4).
	const float PayoutEngagement = FMath::Max(4.f, 3.f * Tier.SpectacleScore);
	for (TActorIterator<APatchPlayerCharacter> It(GetWorld()); It; ++It)
	{
		UAbilitySystemComponent* ASC = It->GetAbilitySystemComponent();
		const UPatchAttributeSet* A = It->GetPatchAttributes();
		if (!ASC || !A || It->IsFlatlined())
		{
			continue;
		}
		ASC->SetNumericAttributeBase(UPatchAttributeSet::GetOvershieldAttribute(), A->GetMaxOvershield());
		ASC->ApplyModToAttribute(UPatchAttributeSet::GetEngagementAttribute(), EGameplayModOp::Additive, PayoutEngagement);
	}
}

void APatchGameMode::OnOperatorFlatlined(APatchPlayerCharacter* Operator)
{
	for (TActorIterator<APatchPlayerCharacter> It(GetWorld()); It; ++It)
	{
		if (!It->IsFlatlined())
		{
			return;
		}
	}
	GetPatchGameState()->Phase = EPatchRoundPhase::SquadWiped;
	GetWorldTimerManager().SetTimer(PhaseTimer, this, &APatchGameMode::RestartRound, RestartSeconds, false);
}

void APatchGameMode::RestartRound()
{
	for (APatchEnemyCharacter* Enemy : SpawnedEnemies)
	{
		if (IsValid(Enemy)) { Enemy->Destroy(); }
	}
	SpawnedEnemies.Reset();
	AliveEnemies = 0;

	for (FConstPlayerControllerIterator It = GetWorld()->GetPlayerControllerIterator(); It; ++It)
	{
		APlayerController* PC = It->Get();
		if (!PC) { continue; }
		if (APawn* Pawn = PC->GetPawn())
		{
			PC->UnPossess();
			Pawn->Destroy();
		}
		RestartPlayer(PC);
	}

	CurrentWave = -1;
	APatchGameState* GS = GetPatchGameState();
	GS->Phase = EPatchRoundPhase::Warmup;
	GS->WaveNumber = 0;
	GS->EnemiesRemaining = 0;
	GetWorldTimerManager().SetTimer(PhaseTimer, this, &APatchGameMode::NextWave, WarmupSeconds, false);
}
