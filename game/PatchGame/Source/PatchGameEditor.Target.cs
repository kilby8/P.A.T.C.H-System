using UnrealBuildTool;

public class PatchGameEditorTarget : TargetRules
{
	public PatchGameEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("PatchGame");
	}
}
