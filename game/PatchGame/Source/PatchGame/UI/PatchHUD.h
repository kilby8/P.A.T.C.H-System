#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "PatchHUD.generated.h"

/**
 * Canvas HUD so the prototype needs no widget assets: crosshair, Overshield/Hardware bars, AP pips,
 * Engagement, ammo, build and wave status. Replace with a CommonUI/UMG broadcast overlay later.
 */
UCLASS()
class PATCHGAME_API APatchHUD : public AHUD
{
	GENERATED_BODY()

public:
	virtual void DrawHUD() override;

protected:
	void DrawBar(float X, float Y, float W, float H, float Fraction, const FLinearColor& Fill, const FString& Label);
	void DrawCenteredText(const FString& Text, float Y, const FLinearColor& Color, float Scale);
};
