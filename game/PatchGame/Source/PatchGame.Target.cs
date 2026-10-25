using UnrealBuildTool;

public class PatchGameTarget : TargetRules
{
	public PatchGameTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("PatchGame");
	}
}
