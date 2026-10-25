#pragma once

#include "CoreMinimal.h"
#include "PatchDice.generated.h"

/** A tabletop dice expression such as "4d6+1" or "1d8". */
USTRUCT(BlueprintType)
struct PATCHGAME_API FPatchDice
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dice")
	int32 Count = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dice")
	int32 Sides = 6;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dice")
	int32 Bonus = 0;

	FPatchDice() = default;
	FPatchDice(int32 InCount, int32 InSides, int32 InBonus = 0) : Count(InCount), Sides(InSides), Bonus(InBonus) {}

	/** Parses "XdY", "XdY+Z" or "XdY-Z". Returns a zero dice (always 0) on bad input. */
	static FPatchDice Parse(const FString& Expression);

	int32 Roll() const;
	float Average() const { return Count * (Sides + 1) * 0.5f + Bonus; }
	bool IsValid() const { return Count > 0 && Sides > 0; }
	FString ToString() const;
};
