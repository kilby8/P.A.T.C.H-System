#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Rules/PatchDice.h"
#include "PatchWeapon.generated.h"

class APatchPlayerCharacter;
class UStaticMeshComponent;

/**
 * Hitscan weapon whose damage and range come from a rules.json gear entry.
 * The owning client runs the fire timer and sends each shot's aim to the server, which traces and applies damage.
 */
UCLASS()
class PATCHGAME_API APatchWeapon : public AActor
{
	GENERATED_BODY()

public:
	APatchWeapon();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
	virtual void BeginPlay() override;

	/** Owning client. */
	void StartFire();
	void StopFire();
	void Reload();

	UFUNCTION(BlueprintPure, Category = "PATCH|Weapon") int32 GetAmmo() const { return Ammo; }
	UFUNCTION(BlueprintPure, Category = "PATCH|Weapon") int32 GetMagazineSize() const { return MagazineSize; }
	UFUNCTION(BlueprintPure, Category = "PATCH|Weapon") bool IsReloading() const { return bReloading; }
	const FString& GetDisplayName() const { return DisplayName; }

	/** rules.json gear id. Damage dice and range are read from it. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "PATCH|Weapon")
	FName GearId = TEXT("i-tactical-carbine");

	/** Seconds between shots while the trigger is held. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "PATCH|Weapon")
	float FireInterval = 0.15f;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "PATCH|Weapon")
	int32 MagazineSize = 24;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "PATCH|Weapon")
	float ReloadSeconds = 1.8f;

	/** Half-angle of the random spread cone, degrees. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "PATCH|Weapon")
	float SpreadDegrees = 1.2f;

	/** Tuning knob between tabletop damage and real-time feel. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "PATCH|Weapon")
	float DamageScale = 1.f;

protected:
	void FireShot();
	bool ComputeAim(FVector& OutOrigin, FVector& OutDirection) const;
	APatchPlayerCharacter* GetOwningOperator() const;

	UFUNCTION(Server, Reliable)
	void ServerFireShot(FVector_NetQuantize Origin, FVector_NetQuantizeNormal Direction);

	UFUNCTION(Server, Reliable)
	void ServerReload();

	void FinishReload();

	UPROPERTY(VisibleAnywhere, Category = "PATCH|Weapon")
	TObjectPtr<UStaticMeshComponent> Mesh;

	UPROPERTY(Replicated)
	int32 Ammo = 24;

	UPROPERTY(Replicated)
	bool bReloading = false;

	FPatchDice Damage = FPatchDice(2, 6);
	float RangeUU = 6000.f;
	FString DisplayName = TEXT("Tactical Carbine");

	FTimerHandle FireTimer;
	FTimerHandle ReloadTimer;
	double LastFireTime = -1000.0;
};
