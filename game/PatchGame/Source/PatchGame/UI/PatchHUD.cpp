#include "UI/PatchHUD.h"
#include "Abilities/PatchAttributeSet.h"
#include "Characters/PatchPlayerCharacter.h"
#include "Core/PatchGameState.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/Font.h"
#include "Weapons/PatchWeapon.h"

void APatchHUD::DrawBar(float X, float Y, float W, float H, float Fraction, const FLinearColor& Fill, const FString& Label)
{
	DrawRect(FLinearColor(0.f, 0.f, 0.f, 0.6f), X - 2.f, Y - 2.f, W + 4.f, H + 4.f);
	DrawRect(Fill, X, Y, W * FMath::Clamp(Fraction, 0.f, 1.f), H);
	DrawText(Label, FLinearColor::White, X + 6.f, Y + 1.f, GEngine->GetSmallFont());
}

void APatchHUD::DrawCenteredText(const FString& Text, float Y, const FLinearColor& Color, float Scale)
{
	UFont* Font = GEngine->GetLargeFont();
	float W = 0.f, H = 0.f;
	GetTextSize(Text, W, H, Font, Scale);
	DrawText(Text, Color, (Canvas->ClipX - W) * 0.5f, Y, Font, Scale);
}

void APatchHUD::DrawHUD()
{
	Super::DrawHUD();
	if (!Canvas)
	{
		return;
	}

	const float CX = Canvas->ClipX * 0.5f;
	const float CY = Canvas->ClipY * 0.5f;
	const APatchPlayerCharacter* Operator = Cast<APatchPlayerCharacter>(GetOwningPawn());
	const UPatchAttributeSet* A = Operator ? Operator->GetPatchAttributes() : nullptr;

	// Crosshair
	const FLinearColor Cross(1.f, 1.f, 1.f, 0.85f);
	DrawLine(CX - 10.f, CY, CX - 3.f, CY, Cross, 2.f);
	DrawLine(CX + 3.f, CY, CX + 10.f, CY, Cross, 2.f);
	DrawLine(CX, CY - 10.f, CX, CY - 3.f, Cross, 2.f);
	DrawLine(CX, CY + 3.f, CX, CY + 10.f, Cross, 2.f);

	if (A)
	{
		const float X = 40.f;
		float Y = Canvas->ClipY - 130.f;
		const float W = 320.f;

		DrawText(Operator->GetBuildProfile(Operator->GetBuild()).Label + TEXT("   [1] Ghost  [2] Specialist  [3] Brute"),
			FLinearColor(0.7f, 0.9f, 1.f), X, Y - 24.f, GEngine->GetSmallFont());

		DrawBar(X, Y, W, 18.f, A->GetMaxOvershield() > 0.f ? A->GetOvershield() / A->GetMaxOvershield() : 0.f, FLinearColor(0.1f, 0.75f, 1.f),
			FString::Printf(TEXT("OVERSHIELD %d / %d"), FMath::RoundToInt(A->GetOvershield()), FMath::RoundToInt(A->GetMaxOvershield())));
		Y += 26.f;
		DrawBar(X, Y, W, 18.f, A->GetMaxHardwareIntegrity() > 0.f ? A->GetHardwareIntegrity() / A->GetMaxHardwareIntegrity() : 0.f,
			A->IsInNeuralShock() ? FLinearColor(1.f, 0.35f, 0.f) : FLinearColor(0.9f, 0.15f, 0.2f),
			FString::Printf(TEXT("HARDWARE %d / %d"), FMath::RoundToInt(A->GetHardwareIntegrity()), FMath::RoundToInt(A->GetMaxHardwareIntegrity())));
		Y += 30.f;

		// AP pips
		const int32 MaxAP = FMath::RoundToInt(A->GetMaxAP());
		const int32 AP = FMath::RoundToInt(A->GetAP());
		for (int32 i = 0; i < MaxAP; ++i)
		{
			DrawRect(i < AP ? FLinearColor(1.f, 0.85f, 0.2f) : FLinearColor(0.25f, 0.25f, 0.25f, 0.8f), X + i * 28.f, Y, 22.f, 12.f);
		}
		DrawText(TEXT("AP   [Q] Reboot Shield (2 AP)"), FLinearColor::White, X + MaxAP * 28.f + 8.f, Y - 2.f, GEngine->GetSmallFont());

		// Engagement, top right
		const FString Eng = FString::Printf(TEXT("ENGAGEMENT %d"), FMath::RoundToInt(A->GetEngagement()));
		DrawText(Eng, FLinearColor(1.f, 0.3f, 0.6f), Canvas->ClipX - 260.f, 30.f, GEngine->GetLargeFont());

		if (A->IsInNeuralShock() && !A->IsFlatlined())
		{
			DrawCenteredText(TEXT("NEURAL SHOCK  -1 AP"), CY + 60.f, FLinearColor(1.f, 0.4f, 0.f), 1.f);
		}
		if (A->IsFlatlined())
		{
			DrawCenteredText(TEXT("FLATLINED"), CY - 80.f, FLinearColor(1.f, 0.1f, 0.1f), 2.f);
		}
	}

	if (const APatchWeapon* Weapon = Operator ? Operator->GetWeapon() : nullptr)
	{
		const FString Ammo = Weapon->IsReloading() ? TEXT("RELOADING")
			: FString::Printf(TEXT("%s  %d / %d"), *Weapon->GetDisplayName(), Weapon->GetAmmo(), Weapon->GetMagazineSize());
		DrawText(Ammo, FLinearColor::White, Canvas->ClipX - 340.f, Canvas->ClipY - 70.f, GEngine->GetMediumFont());
	}

	if (const APatchGameState* GS = GetWorld()->GetGameState<APatchGameState>())
	{
		FString Status;
		switch (GS->Phase)
		{
		case EPatchRoundPhase::Warmup: Status = TEXT("GOING LIVE..."); break;
		case EPatchRoundPhase::Fighting: Status = FString::Printf(TEXT("WAVE %d/%d  %s  -  %d LEFT"), GS->WaveNumber, GS->WaveCount, *GS->WaveLabel.ToUpper(), GS->EnemiesRemaining); break;
		case EPatchRoundPhase::WaveCleared: Status = TEXT("WAVE CLEARED  -  OVERSHIELDS RESET"); break;
		case EPatchRoundPhase::RoundWon: Status = TEXT("ROUND CLEARED  -  THE CROWD GOES WILD"); break;
		case EPatchRoundPhase::SquadWiped: Status = TEXT("SQUAD WIPED  -  RESTARTING"); break;
		}
		DrawCenteredText(Status, 24.f, FLinearColor::White, 1.f);
	}
}
