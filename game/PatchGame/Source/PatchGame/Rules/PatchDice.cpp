#include "Rules/PatchDice.h"

FPatchDice FPatchDice::Parse(const FString& Expression)
{
	FString Expr = Expression.TrimStartAndEnd().ToLower();
	Expr.ReplaceInline(TEXT(" "), TEXT(""));

	FString CountStr, Rest;
	if (!Expr.Split(TEXT("d"), &CountStr, &Rest))
	{
		return FPatchDice(0, 6, FCString::Atoi(*Expr));
	}

	int32 Sign = 0;
	int32 SignIndex = INDEX_NONE;
	if (Rest.FindChar(TEXT('+'), SignIndex)) { Sign = 1; }
	else if (Rest.FindChar(TEXT('-'), SignIndex)) { Sign = -1; }

	FPatchDice Dice;
	Dice.Count = CountStr.IsEmpty() ? 1 : FCString::Atoi(*CountStr);
	if (Sign != 0)
	{
		Dice.Sides = FCString::Atoi(*Rest.Left(SignIndex));
		Dice.Bonus = Sign * FCString::Atoi(*Rest.Mid(SignIndex + 1));
	}
	else
	{
		Dice.Sides = FCString::Atoi(*Rest);
	}
	return Dice;
}

int32 FPatchDice::Roll() const
{
	int32 Total = Bonus;
	for (int32 i = 0; i < Count; ++i)
	{
		Total += FMath::RandRange(1, FMath::Max(1, Sides));
	}
	return Total;
}

FString FPatchDice::ToString() const
{
	if (Bonus == 0) { return FString::Printf(TEXT("%dd%d"), Count, Sides); }
	return FString::Printf(TEXT("%dd%d%+d"), Count, Sides, Bonus);
}
