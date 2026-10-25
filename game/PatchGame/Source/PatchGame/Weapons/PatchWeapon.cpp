#include "Weapons/PatchWeapon.h"
#include "Abilities/PatchCombatStatics.h"
#include "Characters/PatchCharacterBase.h"
#include "Characters/PatchPlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Core/PatchGame.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "Net/UnrealNetwork.h"
#include "Rules/PatchRulesSubsystem.h"
#include "TimerManager.h"
#include "UObject/ConstructorHelpers.h"

APatchWeapon::APatchWeapon()
{
	bReplicates = true;
	PrimaryActorTick.bCanEverTick = false;

	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	Mesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	Mesh->SetRelativeScale3D(FVector(0.6f, 0.08f, 0.1f));
	if (Cube.Succeeded()) { Mesh->SetStaticMesh(Cube.Object); }
	RootComponent = Mesh;
}

void APatchWeapon::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);
	DOREPLIFETIME(APatchWeapon, Ammo);
	DOREPLIFETIME(APatchWeapon, bReloading);
}

void APatchWeapon::BeginPlay()
{
	Super::BeginPlay();

	if (const UPatchRulesSubsystem* Rules = UPatchRulesSubsystem::Get(this))
	{
		if (const FPatchGearStats* Gear = Rules->FindGear(GearId))
		{
			Damage = Gear->Damage;
			RangeUU = Gear->RangeMeters * PatchMetersToUU;
			DisplayName = Gear->Name;
		}
		else
		{
			UE_LOG(LogPatch, Warning, TEXT("Weapon gear id %s not found in rules.json"), *GearId.ToString());
		}
	}
	Ammo = MagazineSize;
}

APatchPlayerCharacter* APatchWeapon::GetOwningOperator() const
{
	return Cast<APatchPlayerCharacter>(GetOwner());
}

void APatchWeapon::StartFire()
{
	if (bReloading)
	{
		return;
	}
	if (Ammo <= 0)
	{
		Reload();
		return;
	}
	const double Now = GetWorld()->GetTimeSeconds();
	const float Delay = float(LastFireTime + FireInterval - Now);
	if (Delay <= 0.f)
	{
		FireShot();
		GetWorldTimerManager().SetTimer(FireTimer, this, &APatchWeapon::FireShot, FireInterval, true);
	}
	else
	{
		// Tapping faster than the fire rate waits for the next allowed shot.
		GetWorldTimerManager().SetTimer(FireTimer, this, &APatchWeapon::FireShot, FireInterval, true, Delay);
	}
}

void APatchWeapon::StopFire()
{
	GetWorldTimerManager().ClearTimer(FireTimer);
}

void APatchWeapon::FireShot()
{
	APatchPlayerCharacter* Operator = GetOwningOperator();
	if (!Operator || Operator->IsFlatlined() || bReloading)
	{
		StopFire();
		return;
	}
	if (Ammo <= 0)
	{
		StopFire();
		Reload();
		return;
	}

	FVector Origin, Direction;
	if (ComputeAim(Origin, Direction))
	{
		LastFireTime = GetWorld()->GetTimeSeconds();
		ServerFireShot(Origin, Direction);
	}
}

bool APatchWeapon::ComputeAim(FVector& OutOrigin, FVector& OutDirection) const
{
	const APatchPlayerCharacter* Operator = GetOwningOperator();
	const UCameraComponent* Camera = Operator ? Operator->GetFollowCamera() : nullptr;
	if (!Camera)
	{
		return false;
	}

	// Find what the crosshair is on, then shoot at it from the weapon.
	const FVector CamStart = Camera->GetComponentLocation();
	const FVector CamEnd = CamStart + Camera->GetForwardVector() * (RangeUU + 1000.f);
	FCollisionQueryParams Params(SCENE_QUERY_STAT(PatchAim), true, Operator);
	FHitResult Hit;
	const FVector AimPoint = GetWorld()->LineTraceSingleByChannel(Hit, CamStart, CamEnd, ECC_Visibility, Params) ? Hit.ImpactPoint : CamEnd;

	OutOrigin = GetActorLocation();
	OutDirection = (AimPoint - OutOrigin).GetSafeNormal();
	return !OutDirection.IsNearlyZero();
}

void APatchWeapon::ServerFireShot_Implementation(FVector_NetQuantize Origin, FVector_NetQuantizeNormal Direction)
{
	APatchPlayerCharacter* Operator = GetOwningOperator();
	if (!Operator || Operator->IsFlatlined() || bReloading || Ammo <= 0)
	{
		return;
	}
	// Light sanity check: the shot has to start near the weapon.
	if (FVector::DistSquared(Origin, GetActorLocation()) > FMath::Square(300.f))
	{
		Origin = GetActorLocation();
	}

	--Ammo;

	const FVector ShotDir = FMath::VRandCone(Direction, FMath::DegreesToRadians(SpreadDegrees));
	const FVector End = Origin + ShotDir * RangeUU;
	FCollisionQueryParams Params(SCENE_QUERY_STAT(PatchShot), true, Operator);
	Params.AddIgnoredActor(this);

	FHitResult Hit;
	const bool bHit = GetWorld()->LineTraceSingleByChannel(Hit, Origin, End, ECC_Visibility, Params);
	FColor TracerColor = FColor::Cyan;

	if (bHit)
	{
		APatchCharacterBase* Target = Cast<APatchCharacterBase>(Hit.GetActor());
		if (Target && Target != Operator && !Target->IsFlatlined())
		{
			const float Amount = FMath::Max(1.f, Damage.Roll() * DamageScale);
			UPatchCombatStatics::ApplyPatchDamage(Operator, Target, Amount);
			TracerColor = FColor::Yellow;
		}
	}
	Operator->MulticastTracer(Origin, bHit ? Hit.ImpactPoint : End, TracerColor);
}

void APatchWeapon::Reload()
{
	if (!bReloading && Ammo < MagazineSize)
	{
		StopFire();
		ServerReload();
	}
}

void APatchWeapon::ServerReload_Implementation()
{
	if (bReloading || Ammo >= MagazineSize)
	{
		return;
	}
	bReloading = true;
	GetWorldTimerManager().SetTimer(ReloadTimer, this, &APatchWeapon::FinishReload, ReloadSeconds, false);
}

void APatchWeapon::FinishReload()
{
	Ammo = MagazineSize;
	bReloading = false;
}
