#pragma once

#include "NativeGameplayTags.h"

namespace PatchTags
{
	// Damage that skips Overshield and hits Hardware Integrity directly (e.g. Fried).
	PATCHGAME_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(Damage_BypassOvershield);

	// Hardware Integrity below 50% of max: 1 less AP each round.
	PATCHGAME_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(State_NeuralShock);

	// Hardware Integrity at 0: down, no AP, can't act.
	PATCHGAME_API UE_DECLARE_GAMEPLAY_TAG_EXTERN(State_Flatlined);
}

namespace PatchSetByCaller
{
	// SetByCaller magnitudes are keyed by name so effect CDOs don't depend on tag registration order.
	inline const FName Damage(TEXT("Damage"));
}
