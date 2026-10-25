#include "Characters/PatchPlayerCharacter.h"
#include "Abilities/PatchAttributeSet.h"
#include "Abilities/PatchGA_RebootShield.h"
#include "AbilitySystemComponent.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Core/PatchGameMode.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "Engine/LocalPlayer.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "InputAction.h"
#include "InputMappingContext.h"
#include "InputModifiers.h"
#include "Net/UnrealNetwork.h"
#include "Rules/PatchRulesSubsystem.h"
#include "Weapons/PatchWeapon.h"

APatchPlayerCharacter::APatchPlayerCharacter()
{
	// Shooter controls: the body always faces where the camera looks.
	bUseControllerRotationYaw = true;
	bUseControllerRotationPitch = false;
	bUseControllerRotationRoll = false;

	UCharacterMovementComponent* Move = GetCharacterMovement();
	Move->bOrientRotationToMovement = false;
	Move->JumpZVelocity = 620.f;
	Move->AirControl = 0.35f;
	Move->MaxWalkSpeed = 550.f;
	Move->BrakingDecelerationWalking = 2000.f;

	// First person: camera at eye height, pitching with the controller.
	FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
	FollowCamera->SetupAttachment(RootComponent);
	FollowCamera->SetRelativeLocation(FVector(-10.f, 0.f, 64.f));
	FollowCamera->bUsePawnControlRotation = true;
	FollowCamera->SetFieldOfView(90.f);

	// Hide our own placeholder body from our camera; other players still see it.
	BodyMesh->SetOwnerNoSee(true);
	VisorMesh->SetOwnerNoSee(true);

	WeaponClass = APatchWeapon::StaticClass();

	FPatchBuildProfile Ghost;
	Ghost.Label = TEXT("GHOST");
	Ghost.Hardware = 2; Ghost.System = 4; Ghost.Overshield = 19; Ghost.Defense = 16;
	Ghost.WalkSpeed = 650.f; Ghost.BodyScale = 0.9f; Ghost.Color = FLinearColor(0.2f, 0.9f, 1.f);
	BuildProfiles.Add(EPatchBuild::Ghost, Ghost);

	FPatchBuildProfile Specialist;
	Specialist.Label = TEXT("SPECIALIST");
	Specialist.Hardware = 3; Specialist.System = 3; Specialist.Overshield = 25; Specialist.Defense = 15;
	Specialist.WalkSpeed = 550.f; Specialist.BodyScale = 1.f; Specialist.Color = FLinearColor(0.3f, 1.f, 0.4f);
	BuildProfiles.Add(EPatchBuild::Specialist, Specialist);

	FPatchBuildProfile Brute;
	Brute.Label = TEXT("BRUTE");
	Brute.Hardware = 5; Brute.System = 2; Brute.Overshield = 31; Brute.Defense = 14;
	Brute.WalkSpeed = 450.f; Brute.BodyScale = 1.15f; Brute.Color = FLinearColor(1.f, 0.55f, 0.1f);
	BuildProfiles.Add(EPatchBuild::Brute, Brute);
}

void APatchPlayerCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);
	DOREPLIFETIME(APatchPlayerCharacter, Weapon);
	DOREPLIFETIME(APatchPlayerCharacter, Build);
	DOREPLIFETIME(APatchPlayerCharacter, bSprinting);
}

const FPatchBuildProfile& APatchPlayerCharacter::GetBuildProfile(EPatchBuild InBuild) const
{
	static const FPatchBuildProfile Fallback;
	const FPatchBuildProfile* Found = BuildProfiles.Find(InBuild);
	return Found ? *Found : Fallback;
}

void APatchPlayerCharacter::PossessedBy(AController* NewController)
{
	Super::PossessedBy(NewController);
	AbilitySystem->GiveAbility(FGameplayAbilitySpec(UPatchGA_RebootShield::StaticClass(), 1));
}

void APatchPlayerCharacter::BeginPlay()
{
	Super::BeginPlay();

	if (HasAuthority())
	{
		FActorSpawnParameters Params;
		Params.Owner = this;
		Params.Instigator = this;
		Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
		Weapon = GetWorld()->SpawnActor<APatchWeapon>(WeaponClass, GetActorTransform(), Params);
		if (Weapon)
		{
			Weapon->AttachToComponent(FollowCamera, FAttachmentTransformRules::KeepRelativeTransform);
			Weapon->SetActorRelativeLocation(FVector(40.f, 18.f, -16.f));
		}
	}
	ApplyBuild();
}

void APatchPlayerCharacter::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	if (HasAuthority() && Weapon)
	{
		Weapon->Destroy();
	}
	Super::EndPlay(EndPlayReason);
}

void APatchPlayerCharacter::ServerSetBuild_Implementation(EPatchBuild NewBuild)
{
	// Builds are locked once a fight has hurt you; swap between waves or while at full vitals.
	const UPatchAttributeSet* A = GetPatchAttributes();
	const bool bFull = A->GetHardwareIntegrity() >= A->GetMaxHardwareIntegrity() && A->GetOvershield() >= A->GetMaxOvershield();
	if (NewBuild == Build || IsFlatlined() || !bFull)
	{
		return;
	}
	Build = NewBuild;
	ApplyBuild();
}

void APatchPlayerCharacter::OnRep_Build()
{
	ApplyBuild();
}

void APatchPlayerCharacter::ApplyBuild()
{
	const FPatchBuildProfile& Profile = GetBuildProfile(Build);

	if (HasAuthority())
	{
		const UPatchRulesSubsystem* Rules = UPatchRulesSubsystem::Get(this);
		const int32 MaxHardware = Rules ? Rules->GetDerived(Profile.Hardware).Hardware : 5 + 5 * Profile.Hardware;
		const int32 MaxAP = Rules ? Rules->GetDerived(Profile.System).AP : 1 + Profile.System / 2;
		int32 Shield = Profile.Overshield;
		if (Rules) { Shield = FMath::Clamp(Shield, Rules->GetOvershieldMin(), Rules->GetOvershieldMax()); }
		InitVitals(MaxHardware, Shield, MaxAP, Profile.Defense);
	}

	SetActorScale3D(FVector(Profile.BodyScale));
	SetBodyColor(Profile.Color);
	UpdateMoveSpeed();
}

void APatchPlayerCharacter::UpdateMoveSpeed()
{
	const float Base = GetBuildProfile(Build).WalkSpeed;
	GetCharacterMovement()->MaxWalkSpeed = bSprinting ? Base * SprintMultiplier : Base;
}

void APatchPlayerCharacter::HandleFlatlined(AActor* DamageInstigator)
{
	Super::HandleFlatlined(DamageInstigator);
	if (Weapon) { Weapon->StopFire(); }
	if (APatchGameMode* GM = GetWorld()->GetAuthGameMode<APatchGameMode>())
	{
		GM->OnOperatorFlatlined(this);
	}
}

void APatchPlayerCharacter::CreateInput()
{
	auto MakeAction = [this](const TCHAR* Name, EInputActionValueType Type)
	{
		UInputAction* Action = NewObject<UInputAction>(this, Name);
		Action->ValueType = Type;
		return Action;
	};

	MoveAction = MakeAction(TEXT("IA_Move"), EInputActionValueType::Axis2D);
	LookAction = MakeAction(TEXT("IA_Look"), EInputActionValueType::Axis2D);
	JumpAction = MakeAction(TEXT("IA_Jump"), EInputActionValueType::Boolean);
	FireAction = MakeAction(TEXT("IA_Fire"), EInputActionValueType::Boolean);
	ReloadAction = MakeAction(TEXT("IA_Reload"), EInputActionValueType::Boolean);
	SprintAction = MakeAction(TEXT("IA_Sprint"), EInputActionValueType::Boolean);
	RebootShieldAction = MakeAction(TEXT("IA_RebootShield"), EInputActionValueType::Boolean);
	BuildGhostAction = MakeAction(TEXT("IA_BuildGhost"), EInputActionValueType::Boolean);
	BuildSpecialistAction = MakeAction(TEXT("IA_BuildSpecialist"), EInputActionValueType::Boolean);
	BuildBruteAction = MakeAction(TEXT("IA_BuildBrute"), EInputActionValueType::Boolean);

	MappingContext = NewObject<UInputMappingContext>(this, TEXT("IMC_Operator"));
	auto Map = [this](UInputAction* Action, const FKey& Key, bool bSwizzle = false, bool bNegate = false)
	{
		FEnhancedActionKeyMapping& Mapping = MappingContext->MapKey(Action, Key);
		if (bSwizzle) { Mapping.Modifiers.Add(NewObject<UInputModifierSwizzleAxis>(MappingContext)); }
		if (bNegate) { Mapping.Modifiers.Add(NewObject<UInputModifierNegate>(MappingContext)); }
	};

	// Move: X = right, Y = forward.
	Map(MoveAction, EKeys::W, true);
	Map(MoveAction, EKeys::S, true, true);
	Map(MoveAction, EKeys::D);
	Map(MoveAction, EKeys::A, false, true);
	Map(MoveAction, EKeys::Gamepad_Left2D);

	Map(LookAction, EKeys::Mouse2D);
	Map(LookAction, EKeys::Gamepad_Right2D);

	Map(JumpAction, EKeys::SpaceBar);
	Map(JumpAction, EKeys::Gamepad_FaceButton_Bottom);
	Map(FireAction, EKeys::LeftMouseButton);
	Map(FireAction, EKeys::Gamepad_RightTrigger);
	Map(ReloadAction, EKeys::R);
	Map(ReloadAction, EKeys::Gamepad_FaceButton_Left);
	Map(SprintAction, EKeys::LeftShift);
	Map(SprintAction, EKeys::Gamepad_LeftThumbstick);
	Map(RebootShieldAction, EKeys::Q);
	Map(RebootShieldAction, EKeys::Gamepad_LeftShoulder);
	Map(BuildGhostAction, EKeys::One);
	Map(BuildSpecialistAction, EKeys::Two);
	Map(BuildBruteAction, EKeys::Three);
}

void APatchPlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);

	if (!MappingContext)
	{
		CreateInput();
	}

	if (const APlayerController* PC = Cast<APlayerController>(GetController()))
	{
		if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
		{
			Subsystem->ClearAllMappings();
			Subsystem->AddMappingContext(MappingContext, 0);
		}
	}

	UEnhancedInputComponent* Input = CastChecked<UEnhancedInputComponent>(PlayerInputComponent);
	Input->BindAction(MoveAction, ETriggerEvent::Triggered, this, &APatchPlayerCharacter::Move);
	Input->BindAction(LookAction, ETriggerEvent::Triggered, this, &APatchPlayerCharacter::Look);
	Input->BindAction(JumpAction, ETriggerEvent::Started, this, &ACharacter::Jump);
	Input->BindAction(JumpAction, ETriggerEvent::Completed, this, &ACharacter::StopJumping);
	Input->BindAction(FireAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::FirePressed);
	Input->BindAction(FireAction, ETriggerEvent::Completed, this, &APatchPlayerCharacter::FireReleased);
	Input->BindAction(ReloadAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::ReloadPressed);
	Input->BindAction(SprintAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::SprintPressed);
	Input->BindAction(SprintAction, ETriggerEvent::Completed, this, &APatchPlayerCharacter::SprintReleased);
	Input->BindAction(RebootShieldAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::RebootShieldPressed);
	Input->BindAction(BuildGhostAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::SelectGhost);
	Input->BindAction(BuildSpecialistAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::SelectSpecialist);
	Input->BindAction(BuildBruteAction, ETriggerEvent::Started, this, &APatchPlayerCharacter::SelectBrute);
}

void APatchPlayerCharacter::Move(const FInputActionValue& Value)
{
	if (!Controller || IsFlatlined())
	{
		return;
	}
	const FVector2D Axis = Value.Get<FVector2D>();
	const FRotator YawRotation(0.f, Controller->GetControlRotation().Yaw, 0.f);
	AddMovementInput(FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X), Axis.Y);
	AddMovementInput(FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y), Axis.X);
}

void APatchPlayerCharacter::Look(const FInputActionValue& Value)
{
	const FVector2D Axis = Value.Get<FVector2D>();
	AddControllerYawInput(Axis.X);
	AddControllerPitchInput(-Axis.Y);
}

void APatchPlayerCharacter::FirePressed()
{
	if (Weapon && !IsFlatlined()) { Weapon->StartFire(); }
}

void APatchPlayerCharacter::FireReleased()
{
	if (Weapon) { Weapon->StopFire(); }
}

void APatchPlayerCharacter::ReloadPressed()
{
	if (Weapon && !IsFlatlined()) { Weapon->Reload(); }
}

void APatchPlayerCharacter::SprintPressed()
{
	bSprinting = true;
	UpdateMoveSpeed();
	ServerSetSprinting(true);
}

void APatchPlayerCharacter::SprintReleased()
{
	bSprinting = false;
	UpdateMoveSpeed();
	ServerSetSprinting(false);
}

void APatchPlayerCharacter::ServerSetSprinting_Implementation(bool bNewSprinting)
{
	bSprinting = bNewSprinting;
	UpdateMoveSpeed();
}

void APatchPlayerCharacter::RebootShieldPressed()
{
	AbilitySystem->TryActivateAbilityByClass(UPatchGA_RebootShield::StaticClass());
}
