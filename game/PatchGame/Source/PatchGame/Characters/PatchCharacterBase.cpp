#include "Characters/PatchCharacterBase.h"
#include "Abilities/PatchAttributeSet.h"
#include "AbilitySystemComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Core/PatchGameplayTags.h"
#include "DrawDebugHelpers.h"
#include "Engine/StaticMesh.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "TimerManager.h"
#include "UObject/ConstructorHelpers.h"

APatchCharacterBase::APatchCharacterBase()
{
	PrimaryActorTick.bCanEverTick = true;

	AbilitySystem = CreateDefaultSubobject<UAbilitySystemComponent>(TEXT("AbilitySystem"));
	AbilitySystem->SetIsReplicated(true);
	AbilitySystem->SetReplicationMode(EGameplayEffectReplicationMode::Mixed);

	Attributes = CreateDefaultSubobject<UPatchAttributeSet>(TEXT("Attributes"));

	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cylinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));

	// Capsule is 34 x 88 (half height). Engine shapes are 100 uu, centered.
	BodyMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("BodyMesh"));
	BodyMesh->SetupAttachment(GetCapsuleComponent());
	BodyMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	BodyMesh->SetRelativeScale3D(FVector(0.68f, 0.68f, 1.76f));
	if (Cylinder.Succeeded()) { BodyMesh->SetStaticMesh(Cylinder.Object); }

	VisorMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("VisorMesh"));
	VisorMesh->SetupAttachment(GetCapsuleComponent());
	VisorMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	VisorMesh->SetRelativeLocation(FVector(30.f, 0.f, 55.f));
	VisorMesh->SetRelativeScale3D(FVector(0.15f, 0.5f, 0.12f));
	if (Cube.Succeeded()) { VisorMesh->SetStaticMesh(Cube.Object); }
}

UAbilitySystemComponent* APatchCharacterBase::GetAbilitySystemComponent() const
{
	return AbilitySystem;
}

void APatchCharacterBase::PossessedBy(AController* NewController)
{
	Super::PossessedBy(NewController);
	AbilitySystem->InitAbilityActorInfo(this, this);
	bAbilityActorInfoReady = true;
}

void APatchCharacterBase::BeginPlay()
{
	Super::BeginPlay();

	if (!bAbilityActorInfoReady)
	{
		AbilitySystem->InitAbilityActorInfo(this, this);
		bAbilityActorInfoReady = true;
	}

	BodyMaterial = BodyMesh->CreateAndSetMaterialInstanceDynamic(0);

	if (HasAuthority())
	{
		GetWorldTimerManager().SetTimer(RoundTimer, this, &APatchCharacterBase::StartRound, RoundSeconds, true);
	}
}

bool APatchCharacterBase::IsFlatlined() const
{
	return Attributes && Attributes->IsFlatlined();
}

void APatchCharacterBase::InitVitals(float MaxHardware, float MaxShield, float MaxActionPoints, float DefenseValue)
{
	check(HasAuthority());
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetMaxHardwareIntegrityAttribute(), MaxHardware);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetHardwareIntegrityAttribute(), MaxHardware);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetMaxOvershieldAttribute(), MaxShield);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetOvershieldAttribute(), MaxShield);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetMaxAPAttribute(), MaxActionPoints);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetAPAttribute(), MaxActionPoints);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetDefenseAttribute(), DefenseValue);
	AbilitySystem->SetLooseGameplayTagCount(PatchTags::State_NeuralShock, 0);
	AbilitySystem->SetLooseGameplayTagCount(PatchTags::State_Flatlined, 0);
}

void APatchCharacterBase::StartRound()
{
	if (IsFlatlined())
	{
		return;
	}
	const float Penalty = Attributes->IsInNeuralShock() ? 1.f : 0.f;
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetAPAttribute(), FMath::Max(0.f, Attributes->GetMaxAP() - Penalty));
}

void APatchCharacterBase::OnDamaged(float ShieldDamage, float HardwareDamage, AActor* DamageInstigator)
{
}

void APatchCharacterBase::HandleFlatlined(AActor* DamageInstigator)
{
	GetCharacterMovement()->DisableMovement();
	GetWorldTimerManager().ClearTimer(RoundTimer);
	AbilitySystem->SetNumericAttributeBase(UPatchAttributeSet::GetAPAttribute(), 0.f);
}

void APatchCharacterBase::MulticastTracer_Implementation(FVector_NetQuantize Start, FVector_NetQuantize End, FColor Color)
{
#if ENABLE_DRAW_DEBUG
	DrawDebugLine(GetWorld(), Start, End, Color, false, 0.08f, 0, 1.5f);
	DrawDebugPoint(GetWorld(), End, 8.f, Color, false, 0.15f);
#endif
}

void APatchCharacterBase::SetBodyColor(const FLinearColor& Color)
{
	if (BodyMaterial)
	{
		// /Engine/BasicShapes/BasicShapeMaterial exposes a "Color" vector parameter.
		BodyMaterial->SetVectorParameterValue(TEXT("Color"), Color);
	}
}
