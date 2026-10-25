#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "PatchArenaBlockout.generated.h"

class UStaticMeshComponent;
class UStaticMesh;

/**
 * Grey-box arena built from engine cubes: a floor, perimeter walls and scattered cover.
 * Lets the game run in an empty level. Replace with the real Sector 1 "Data Heist" arena later.
 */
UCLASS()
class PATCHGAME_API APatchArenaBlockout : public AActor
{
	GENERATED_BODY()

public:
	APatchArenaBlockout();

	virtual void OnConstruction(const FTransform& Transform) override;

	/** Arena edge length in uu. */
	UPROPERTY(EditAnywhere, Category = "PATCH|Blockout")
	float ArenaSize = 7000.f;

	UPROPERTY(EditAnywhere, Category = "PATCH|Blockout")
	float WallHeight = 600.f;

	UPROPERTY(EditAnywhere, Category = "PATCH|Blockout")
	int32 CoverCount = 28;

	UPROPERTY(EditAnywhere, Category = "PATCH|Blockout")
	int32 Seed = 1337;

	/** Keep this radius around the actor clear so operators don't spawn inside cover. */
	UPROPERTY(EditAnywhere, Category = "PATCH|Blockout")
	float ClearRadius = 600.f;

protected:
	void Build();
	UStaticMeshComponent* AddBox(const FVector& Center, const FVector& Size, const FLinearColor& Color);

	UPROPERTY()
	TObjectPtr<UStaticMesh> CubeMesh;

	UPROPERTY(Transient)
	TArray<TObjectPtr<UStaticMeshComponent>> Pieces;
};
