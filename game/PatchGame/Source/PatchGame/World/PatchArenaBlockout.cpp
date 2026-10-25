#include "World/PatchArenaBlockout.h"
#include "Components/SceneComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/CollisionProfile.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

APatchArenaBlockout::APatchArenaBlockout()
{
	PrimaryActorTick.bCanEverTick = false;
	RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));

	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
	CubeMesh = Cube.Object;
}

void APatchArenaBlockout::OnConstruction(const FTransform& Transform)
{
	Super::OnConstruction(Transform);
	Build();
}

UStaticMeshComponent* APatchArenaBlockout::AddBox(const FVector& Center, const FVector& Size, const FLinearColor& Color)
{
	UStaticMeshComponent* Box = NewObject<UStaticMeshComponent>(this);
	// Treated like construction-script components: rebuilt from settings every time the actor is constructed.
	Box->CreationMethod = EComponentCreationMethod::UserConstructionScript;
	Box->SetStaticMesh(CubeMesh);
	Box->SetupAttachment(RootComponent);
	Box->SetRelativeLocation(Center);
	Box->SetRelativeScale3D(Size / 100.f); // engine cube is 100 uu
	Box->SetCollisionProfileName(UCollisionProfile::BlockAll_ProfileName);
	Box->SetCanEverAffectNavigation(true);
	Box->RegisterComponent();
	if (UMaterialInstanceDynamic* Mat = Box->CreateAndSetMaterialInstanceDynamic(0))
	{
		Mat->SetVectorParameterValue(TEXT("Color"), Color);
	}
	Pieces.Add(Box);
	return Box;
}

void APatchArenaBlockout::Build()
{
	for (UStaticMeshComponent* Piece : Pieces)
	{
		if (IsValid(Piece)) { Piece->DestroyComponent(); }
	}
	Pieces.Reset();
	if (!CubeMesh)
	{
		return;
	}

	const float Half = ArenaSize * 0.5f;
	const FLinearColor FloorColor(0.08f, 0.09f, 0.11f);
	const FLinearColor WallColor(0.15f, 0.05f, 0.25f);

	// Floor top sits at the actor's origin.
	AddBox(FVector(0.f, 0.f, -50.f), FVector(ArenaSize, ArenaSize, 100.f), FloorColor);

	AddBox(FVector(Half, 0.f, WallHeight * 0.5f), FVector(100.f, ArenaSize, WallHeight), WallColor);
	AddBox(FVector(-Half, 0.f, WallHeight * 0.5f), FVector(100.f, ArenaSize, WallHeight), WallColor);
	AddBox(FVector(0.f, Half, WallHeight * 0.5f), FVector(ArenaSize, 100.f, WallHeight), WallColor);
	AddBox(FVector(0.f, -Half, WallHeight * 0.5f), FVector(ArenaSize, 100.f, WallHeight), WallColor);

	// Cover: low crates you shoot over and tall pillars you hide behind.
	FRandomStream Rand(Seed);
	for (int32 i = 0; i < CoverCount; ++i)
	{
		FVector2D Pos;
		do
		{
			Pos = FVector2D(Rand.FRandRange(-Half + 400.f, Half - 400.f), Rand.FRandRange(-Half + 400.f, Half - 400.f));
		}
		while (Pos.Size() < ClearRadius);

		const bool bTall = Rand.FRand() < 0.35f;
		const FVector Size = bTall
			? FVector(Rand.FRandRange(150.f, 300.f), Rand.FRandRange(150.f, 300.f), Rand.FRandRange(350.f, 500.f))
			: FVector(Rand.FRandRange(150.f, 400.f), Rand.FRandRange(80.f, 160.f), Rand.FRandRange(90.f, 130.f));
		const FLinearColor Color = bTall ? FLinearColor(0.1f, 0.6f, 0.7f) : FLinearColor(0.7f, 0.45f, 0.1f);
		UStaticMeshComponent* Box = AddBox(FVector(Pos.X, Pos.Y, Size.Z * 0.5f), Size, Color);
		Box->SetRelativeRotation(FRotator(0.f, Rand.FRandRange(0.f, 90.f), 0.f));
	}
}
