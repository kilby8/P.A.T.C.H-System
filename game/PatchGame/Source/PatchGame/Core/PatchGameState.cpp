#include "Core/PatchGameState.h"
#include "Net/UnrealNetwork.h"

void APatchGameState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);
	DOREPLIFETIME(APatchGameState, Phase);
	DOREPLIFETIME(APatchGameState, WaveNumber);
	DOREPLIFETIME(APatchGameState, WaveCount);
	DOREPLIFETIME(APatchGameState, WaveLabel);
	DOREPLIFETIME(APatchGameState, EnemiesRemaining);
}
