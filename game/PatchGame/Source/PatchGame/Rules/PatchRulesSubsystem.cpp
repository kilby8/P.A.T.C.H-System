#include "Rules/PatchRulesSubsystem.h"
#include "Core/PatchGame.h"
#include "AbilitySystemGlobals.h"
#include "Dom/JsonObject.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
	/** "60 m" -> 60, "Reach 2 m" -> 2, "Melee" -> 2. */
	float ParseMeters(const FString& Text, float Fallback)
	{
		FString Digits;
		for (const TCHAR C : Text)
		{
			if (FChar::IsDigit(C) || C == TEXT('.')) { Digits.AppendChar(C); }
			else if (!Digits.IsEmpty()) { break; }
		}
		return Digits.IsEmpty() ? Fallback : FCString::Atof(*Digits);
	}

	FString GetStr(const TSharedPtr<FJsonObject>& Obj, const TCHAR* Field)
	{
		FString Out;
		Obj->TryGetStringField(Field, Out);
		return Out;
	}

	int32 GetInt(const TSharedPtr<FJsonObject>& Obj, const TCHAR* Field, int32 Fallback)
	{
		int32 Out = Fallback;
		Obj->TryGetNumberField(Field, Out);
		return Out;
	}
}

void UPatchRulesSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	if (!UAbilitySystemGlobals::Get().IsAbilitySystemGlobalsInitialized())
	{
		UAbilitySystemGlobals::Get().InitGlobalData();
	}

	const FString Path = FPaths::ProjectContentDir() / TEXT("Data/rules.json");
	bLoaded = LoadFromFile(Path);
	if (bLoaded)
	{
		UE_LOG(LogPatch, Log, TEXT("Rules loaded: %d bestiary, %d gear, %d spectacle tiers"), Enemies.Num(), Gear.Num(), SpectacleTiers.Num());
	}
	else
	{
		UE_LOG(LogPatch, Error, TEXT("Could not load rules from %s. Run Tools/sync_rules.py."), *Path);
	}
}

UPatchRulesSubsystem* UPatchRulesSubsystem::Get(const UObject* WorldContext)
{
	const UWorld* World = WorldContext ? WorldContext->GetWorld() : nullptr;
	const UGameInstance* GI = World ? World->GetGameInstance() : nullptr;
	return GI ? GI->GetSubsystem<UPatchRulesSubsystem>() : nullptr;
}

bool UPatchRulesSubsystem::LoadFromFile(const FString& Path)
{
	FString Text;
	if (!FFileHelper::LoadFileToString(Text, *Path))
	{
		return false;
	}

	TSharedPtr<FJsonObject> Root;
	const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Text);
	if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid())
	{
		return false;
	}

	// constants
	const TSharedPtr<FJsonObject>* Constants = nullptr;
	if (Root->TryGetObjectField(TEXT("constants"), Constants))
	{
		const TArray<TSharedPtr<FJsonValue>>* Range = nullptr;
		if ((*Constants)->TryGetArrayField(TEXT("overshieldRange"), Range) && Range->Num() == 2)
		{
			OvershieldRange = FIntPoint((int32)(*Range)[0]->AsNumber(), (int32)(*Range)[1]->AsNumber());
		}
		const TArray<TSharedPtr<FJsonValue>>* LadderArr = nullptr;
		if ((*Constants)->TryGetArrayField(TEXT("ladder"), LadderArr))
		{
			for (const TSharedPtr<FJsonValue>& V : *LadderArr)
			{
				const TSharedPtr<FJsonObject> O = V->AsObject();
				Ladder.Add(GetStr(O, TEXT("label")), GetInt(O, TEXT("target"), 15));
			}
		}
	}

	// derived
	const TArray<TSharedPtr<FJsonValue>>* DerivedArr = nullptr;
	if (Root->TryGetArrayField(TEXT("derived"), DerivedArr))
	{
		for (const TSharedPtr<FJsonValue>& V : *DerivedArr)
		{
			const TSharedPtr<FJsonObject> O = V->AsObject();
			FPatchDerivedRow Row;
			Row.Value = GetInt(O, TEXT("value"), 1);
			Row.Bonus = GetInt(O, TEXT("bonus"), 0);
			Row.Hardware = GetInt(O, TEXT("hardware"), 10);
			Row.HardwareInmate = GetInt(O, TEXT("hardwareInmate"), 15);
			Row.AP = GetInt(O, TEXT("ap"), 1);
			Derived.Add(Row);
		}
		Derived.Sort([](const FPatchDerivedRow& A, const FPatchDerivedRow& B) { return A.Value < B.Value; });
	}

	// bestiary
	const TArray<TSharedPtr<FJsonValue>>* BestiaryArr = nullptr;
	if (Root->TryGetArrayField(TEXT("bestiary"), BestiaryArr))
	{
		for (const TSharedPtr<FJsonValue>& V : *BestiaryArr)
		{
			const TSharedPtr<FJsonObject> O = V->AsObject();
			FPatchEnemyStats E;
			E.Id = GetInt(O, TEXT("id"), 0);
			E.Name = GetStr(O, TEXT("name"));
			E.Role = GetStr(O, TEXT("role"));
			E.Tier = GetStr(O, TEXT("tier"));
			E.Integrity = GetInt(O, TEXT("integrity"), 10);
			E.AP = GetInt(O, TEXT("ap"), 2);
			E.Init = GetInt(O, TEXT("init"), 10);
			E.Defense = GetInt(O, TEXT("defense"), 15);
			E.Attack = FPatchDice::Parse(GetStr(O, TEXT("attack")));
			E.Damage = FPatchDice::Parse(GetStr(O, TEXT("damage")));
			E.Threat = GetInt(O, TEXT("threat"), 1);
			E.MoveMeters = ParseMeters(GetStr(O, TEXT("move")), 6.f);
			E.Tactics = GetStr(O, TEXT("tactics"));
			Enemies.Add(E.Id, E);
		}
	}

	// gear
	const TArray<TSharedPtr<FJsonValue>>* GearArr = nullptr;
	if (Root->TryGetArrayField(TEXT("gear"), GearArr))
	{
		for (const TSharedPtr<FJsonValue>& V : *GearArr)
		{
			const TSharedPtr<FJsonObject> O = V->AsObject();
			FPatchGearStats G;
			G.Id = FName(*GetStr(O, TEXT("id")));
			G.Name = GetStr(O, TEXT("name"));
			G.Category = GetStr(O, TEXT("category"));
			const TSharedPtr<FJsonObject>* RulesObj = nullptr;
			if (O->TryGetObjectField(TEXT("rules"), RulesObj))
			{
				G.Skill = GetStr(*RulesObj, TEXT("skill"));
				G.Damage = FPatchDice::Parse(GetStr(*RulesObj, TEXT("damage")));
				G.DamageType = GetStr(*RulesObj, TEXT("damageType"));
				G.RangeMeters = ParseMeters(GetStr(*RulesObj, TEXT("range")), 2.f);
				G.DefenseBonus = GetInt(*RulesObj, TEXT("defenseBonus"), 0);
				G.Feature = GetStr(*RulesObj, TEXT("feature"));
			}
			Gear.Add(G.Id, G);
		}
	}

	// spectacle (encounter builds)
	const TArray<TSharedPtr<FJsonValue>>* SpectacleArr = nullptr;
	if (Root->TryGetArrayField(TEXT("spectacle"), SpectacleArr))
	{
		for (const TSharedPtr<FJsonValue>& V : *SpectacleArr)
		{
			const TSharedPtr<FJsonObject> O = V->AsObject();
			FPatchSpectacleTier Tier;
			Tier.Key = FName(*GetStr(O, TEXT("key")));
			Tier.Label = GetStr(O, TEXT("label"));
			const TArray<TSharedPtr<FJsonValue>>* ScoreRange = nullptr;
			if (O->TryGetArrayField(TEXT("scoreRange"), ScoreRange) && ScoreRange->Num() > 0)
			{
				Tier.SpectacleScore = (int32)(*ScoreRange)[0]->AsNumber();
			}
			const TArray<TSharedPtr<FJsonValue>>* ForceArr = nullptr;
			if (O->TryGetArrayField(TEXT("force"), ForceArr))
			{
				for (const TSharedPtr<FJsonValue>& F : *ForceArr)
				{
					FPatchSpectacleForce Force;
					Force.BestiaryId = GetInt(F->AsObject(), TEXT("templateId"), 0);
					Force.Count = GetInt(F->AsObject(), TEXT("count"), 1);
					Tier.Force.Add(Force);
				}
			}
			O->TryGetStringArrayField(TEXT("modifiers"), Tier.Modifiers);
			SpectacleTiers.Add(Tier);
		}
	}

	return Enemies.Num() > 0;
}

FPatchDerivedRow UPatchRulesSubsystem::GetDerived(int32 AttributeValue) const
{
	if (Derived.Num() == 0)
	{
		FPatchDerivedRow Fallback;
		Fallback.Value = AttributeValue;
		Fallback.Hardware = 5 + 5 * AttributeValue;
		Fallback.AP = 1 + AttributeValue / 2;
		return Fallback;
	}
	const int32 Index = FMath::Clamp(AttributeValue - Derived[0].Value, 0, Derived.Num() - 1);
	return Derived[Index];
}

int32 UPatchRulesSubsystem::GetLadderTarget(const FString& Label, int32 Fallback) const
{
	const int32* Found = Ladder.Find(Label);
	return Found ? *Found : Fallback;
}
