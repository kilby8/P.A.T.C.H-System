#pragma once

#include "CoreMinimal.h"
#include "GameplayEffect.h"
#include "PatchGameplayEffects.generated.h"

/** Instant damage. Magnitude comes from SetByCaller "Damage"; routed through Overshield by UPatchAttributeSet. */
UCLASS()
class PATCHGAME_API UPatchGE_Damage : public UGameplayEffect
{
	GENERATED_BODY()

public:
	UPatchGE_Damage();
};
