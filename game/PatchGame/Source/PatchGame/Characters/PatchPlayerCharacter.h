#pragma once

#include "CoreMinimal.h"
#include "Characters/PatchCharacterBase.h"
#include "InputActionValue.h"
#include "PatchPlayerCharacter.generated.h"

class APatchWeapon;
class UCameraComponent;
class UInputAction;
class UInputMappingContext;
class USpringArmComponent;

/** Arena builds, mapped from archetype zones: GHOST light, SPECIALIST medium, BRUTE heavy. */
UENUM(BlueprintType)
enum class EPatchBuild : uint8
{
	Ghost,
	Specialist,
	Brute
};

USTRUCT(BlueprintType)
struct FPatchBuildProfile
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") FString Label;
	/** HARDWARE attribute 1-5; max Hardware Integrity comes from the rules "derived" table. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") int32 Hardware = 3;
	/** SYSTEM attribute 1-5; max AP comes from the rules "derived" table. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") int32 System = 3;
	/** Must sit inside the rules' overshieldRange (19-31). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") int32 Overshield = 25;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") int32 Defense = 15;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") float WalkSpeed = 550.f;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") float BodyScale = 1.f;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Build") FLinearColor Color = FLinearColor::White;
};

/** The operator: over-the-shoulder camera, Enhanced Input, a rules-driven weapon and a GAS ability kit. */
UCLASS()
class PATCHGAME_API APatchPlayerCharacter : public APatchCharacterBase
{
	GENERATED_BODY()

public:
	APatchPlayerCharacter();

	virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
	virtual void PossessedBy(AController* NewController) override;
	virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
	virtual void HandleFlatlined(AActor* DamageInstigator) override;
	virtual int32 GetSystemAttribute() const override { return GetBuildProfile(Build).System; }

	UCameraComponent* GetFollowCamera() const { return FollowCamera; }
	APatchWeapon* GetWeapon() const { return Weapon; }
	EPatchBuild GetBuild() const { return Build; }
	const FPatchBuildProfile& GetBuildProfile(EPatchBuild InBuild) const;

	UFUNCTION(Server, Reliable)
	void ServerSetBuild(EPatchBuild NewBuild);

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	TSubclassOf<APatchWeapon> WeaponClass;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	TMap<EPatchBuild, FPatchBuildProfile> BuildProfiles;

	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float SprintMultiplier = 1.45f;

protected:
	void ApplyBuild();
	void CreateInput();

	UFUNCTION()
	void OnRep_Build();

	void Move(const FInputActionValue& Value);
	void Look(const FInputActionValue& Value);
	void FirePressed();
	void FireReleased();
	void ReloadPressed();
	void SprintPressed();
	void SprintReleased();
	void RebootShieldPressed();
	void SelectGhost() { ServerSetBuild(EPatchBuild::Ghost); }
	void SelectSpecialist() { ServerSetBuild(EPatchBuild::Specialist); }
	void SelectBrute() { ServerSetBuild(EPatchBuild::Brute); }

	UFUNCTION(Server, Reliable)
	void ServerSetSprinting(bool bNewSprinting);

	void UpdateMoveSpeed();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "PATCH")
	TObjectPtr<USpringArmComponent> CameraBoom;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "PATCH")
	TObjectPtr<UCameraComponent> FollowCamera;

	UPROPERTY(Replicated, BlueprintReadOnly, Category = "PATCH")
	TObjectPtr<APatchWeapon> Weapon;

	UPROPERTY(ReplicatedUsing = OnRep_Build, BlueprintReadOnly, Category = "PATCH")
	EPatchBuild Build = EPatchBuild::Specialist;

	UPROPERTY(Replicated)
	bool bSprinting = false;

	// Input is built in code so the project runs without any input assets. Swap for assets when designers need them.
	UPROPERTY(Transient) TObjectPtr<UInputMappingContext> MappingContext;
	UPROPERTY(Transient) TObjectPtr<UInputAction> MoveAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> LookAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> JumpAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> FireAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> ReloadAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> SprintAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> RebootShieldAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> BuildGhostAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> BuildSpecialistAction;
	UPROPERTY(Transient) TObjectPtr<UInputAction> BuildBruteAction;
};
