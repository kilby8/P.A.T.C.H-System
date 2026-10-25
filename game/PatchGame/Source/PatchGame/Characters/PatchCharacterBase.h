#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "AbilitySystemInterface.h"
#include "PatchCharacterBase.generated.h"

class UAbilitySystemComponent;
class UPatchAttributeSet;
class UStaticMeshComponent;
class UMaterialInstanceDynamic;

/**
 * Shared base for operators and bestiary entities: owns the ability system, the P.A.T.C.H. vitals,
 * the round clock that refills AP, and a placeholder body so the game is playable with zero art.
 */
UCLASS(Abstract)
class PATCHGAME_API APatchCharacterBase : public ACharacter, public IAbilitySystemInterface
{
	GENERATED_BODY()

public:
	APatchCharacterBase();

	virtual UAbilitySystemComponent* GetAbilitySystemComponent() const override;
	UPatchAttributeSet* GetPatchAttributes() const { return Attributes; }

	virtual void PossessedBy(AController* NewController) override;
	virtual void BeginPlay() override;

	/** SYSTEM attribute value (1-5), used by Reboot Shield and AP. */
	virtual int32 GetSystemAttribute() const { return 2; }

	UFUNCTION(BlueprintPure, Category = "PATCH")
	bool IsFlatlined() const;

	/** Server: called by the attribute set after damage is split. */
	virtual void OnDamaged(float ShieldDamage, float HardwareDamage, AActor* DamageInstigator);

	/** Server: Hardware Integrity reached 0. */
	virtual void HandleFlatlined(AActor* DamageInstigator);

	/** Cosmetic shot line for everyone. Placeholder until weapon VFX exist. */
	UFUNCTION(NetMulticast, Unreliable)
	void MulticastTracer(FVector_NetQuantize Start, FVector_NetQuantize End, FColor Color);

	/** Length of a tabletop round in seconds. AP refills at the start of each round. */
	UPROPERTY(EditDefaultsOnly, Category = "PATCH")
	float RoundSeconds = 6.f;

protected:
	/** Server: set every vital to full. */
	void InitVitals(float MaxHardware, float MaxShield, float MaxActionPoints, float DefenseValue);

	/** Server: start of a round. Refill AP, minus 1 while in Neural Shock. */
	virtual void StartRound();

	void SetBodyColor(const FLinearColor& Color);

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "PATCH")
	TObjectPtr<UAbilitySystemComponent> AbilitySystem;

	UPROPERTY()
	TObjectPtr<UPatchAttributeSet> Attributes;

	/** Placeholder body: an engine cylinder. Swap for a skeletal mesh once art exists. */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "PATCH")
	TObjectPtr<UStaticMeshComponent> BodyMesh;

	/** Placeholder "visor" cube so facing is readable. */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "PATCH")
	TObjectPtr<UStaticMeshComponent> VisorMesh;

	UPROPERTY(Transient)
	TObjectPtr<UMaterialInstanceDynamic> BodyMaterial;

	FTimerHandle RoundTimer;
	bool bAbilityActorInfoReady = false;
};
