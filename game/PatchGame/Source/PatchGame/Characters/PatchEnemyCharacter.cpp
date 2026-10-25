#include "Characters/PatchEnemyCharacter.h"
#include "AI/PatchEnemyAIController.h"
#include "Abilities/PatchCombatStatics.h"
#include "AbilitySystemComponent.h"
#include "Components/CapsuleComponent.h"
#include "Core/PatchGame.h"
#include "Core/PatchGameMode.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Net/UnrealNetwork.h"
#include "Rules/PatchRulesSubsystem.h"

APatchEnemyCharacter::APatchEnemyCharacter()
{
	AIControllerClass = APatchEnemyAIController::StaticClass();
	AutoPossessAI = EAutoPossessAI::PlacedInWorldOrSpawned;
	AbilitySystem->SetReplicationMode(EGameplayEffectReplicationMode::Minimal);

	bUseControllerRotationYaw = false;
	GetCharacterMovement()->bOrientRotationToMovement = false;
	GetCharacterMovement()->RotationRate = FRotator(0.f, 540.f, 0.f);
	GetCharacterMovement()->bUseControllerDesiredRotation = true;
}

void APatchEnemyCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);
	DOREPLIFETIME(APatchEnemyCharacter, BestiaryId);
}

void APatchEnemyCharacter::BeginPlay()
{
	Super::BeginPlay();
	LoadStats();
}

void APatchEnemyCharacter::OnRep_BestiaryId()
{
	LoadStats();
}

void APatchEnemyCharacter::LoadStats()
{
	if (const UPatchRulesSubsystem* Rules = UPatchRulesSubsystem::Get(this))
	{
		if (const FPatchEnemyStats* Found = Rules->FindEnemy(BestiaryId))
		{
			Stats = *Found;
		}
		else
		{
			UE_LOG(LogPatch, Warning, TEXT("Bestiary id %d not in rules.json"), BestiaryId);
		}
	}

	GetCharacterMovement()->MaxWalkSpeed = FMath::Max(150.f, Stats.MoveMeters * MoveMetersToSpeed);
	if (Stats.MoveMeters <= 0.f) { GetCharacterMovement()->MaxWalkSpeed = 0.f; }

	const float Scale = Stats.Tier == TEXT("Boss") ? 1.6f : (Stats.Tier == TEXT("Tank") ? 1.3f : (Stats.Tier == TEXT("Fodder") ? 0.8f : 1.f));
	SetActorScale3D(FVector(Scale));
	SetBodyColor(GetTierColor());

	if (HasAuthority())
	{
		InitVitals(Stats.Integrity, 0.f, Stats.AP, Stats.Defense);
	}
}

FLinearColor APatchEnemyCharacter::GetTierColor() const
{
	if (Stats.Tier == TEXT("Fodder")) { return FLinearColor(0.6f, 0.6f, 0.6f); }
	if (Stats.Tier == TEXT("Support")) { return FLinearColor(0.7f, 0.3f, 1.f); }
	if (Stats.Tier == TEXT("Tank")) { return FLinearColor(0.5f, 0.15f, 0.1f); }
	if (Stats.Tier == TEXT("Elite")) { return FLinearColor(1.f, 0.85f, 0.1f); }
	if (Stats.Tier == TEXT("Boss")) { return FLinearColor(1.f, 0.f, 0.4f); }
	return FLinearColor(0.9f, 0.1f, 0.1f);
}

float APatchEnemyCharacter::GetAttackRange() const
{
	return Stats.IsMelee() ? 220.f : 2500.f;
}

bool APatchEnemyCharacter::TryAttack(AActor* Target)
{
	const double Now = GetWorld()->GetTimeSeconds();
	if (!HasAuthority() || IsFlatlined() || !Target || Now < NextAttackTime)
	{
		return false;
	}

	// AP attacks per round: a Standard entity with 2 AP attacks every 3 seconds.
	NextAttackTime = Now + RoundSeconds / FMath::Max(1, Stats.AP);

	const FVector Start = GetActorLocation() + FVector(0.f, 0.f, 50.f);
	const FVector End = Target->GetActorLocation();
	const bool bHit = UPatchCombatStatics::RollToHit(Stats.Attack, Target);
	if (bHit)
	{
		const float Amount = FMath::Max(1.f, Stats.Damage.Roll() * DamageMultiplier);
		UPatchCombatStatics::ApplyPatchDamage(this, Target, Amount);
	}

	const FVector MissOffset = bHit ? FVector::ZeroVector : FMath::VRand() * 120.f;
	MulticastTracer(Start, End + MissOffset, bHit ? FColor::Red : FColor(255, 120, 120));
	return true;
}

void APatchEnemyCharacter::HandleFlatlined(AActor* DamageInstigator)
{
	Super::HandleFlatlined(DamageInstigator);

	GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	if (AController* AI = GetController())
	{
		AI->UnPossess();
		AI->Destroy();
	}

	if (APatchGameMode* GM = GetWorld()->GetAuthGameMode<APatchGameMode>())
	{
		GM->OnEnemyFlatlined(this, DamageInstigator);
	}
	SetLifeSpan(0.25f);
}
