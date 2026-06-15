import { useMemo } from 'react'

interface StartupOnboardingState {
  status: string
  vaultPath?: string
}

interface StartupVaultSwitcherState {
  allVaults: Array<{ path: string }>
  loaded: boolean
  vaultPath: string
}

interface UseStartupScreenStateArgs {
  aiAgentsPromptVisible: boolean
  isNoteWindow: boolean
  onboardingState: StartupOnboardingState
  runtimeMissingVaultPath: string | null
  selectedVaultPath: string | null
  showMcpSetupDialog: boolean
  vaultIsLoading: boolean
  vaultSwitcher: StartupVaultSwitcherState
}

interface StartupScreenState {
  isStartupLoading: boolean
  isVaultContentLoading: boolean
  shouldResumeFreshStartOnboarding: boolean
  shouldShowStartupScreen: boolean
}

interface ShouldShowStartupScreenArgs {
  aiAgentsPromptVisible: boolean
  isNoteWindow: boolean
  onboardingState: StartupOnboardingState
  runtimeMissingVaultPath: string | null
  shouldResumeFreshStartOnboarding: boolean
  showMcpSetupDialog: boolean
}

function shouldResumeFreshStart(
  onboardingState: StartupOnboardingState,
  selectedVaultPath: string | null,
  vaultSwitcher: StartupVaultSwitcherState,
): boolean {
  if (onboardingState.status !== 'ready' || !vaultSwitcher.loaded) return false

  const remembersOnlyImplicitDefaultVault = selectedVaultPath === null
  const hasOneRegisteredVault = vaultSwitcher.allVaults.length === 1
  const registeredVaultPath = vaultSwitcher.allVaults[0]?.path
  const switcherOwnsOnboardingVault = onboardingState.vaultPath === vaultSwitcher.vaultPath

  return remembersOnlyImplicitDefaultVault
    && hasOneRegisteredVault
    && registeredVaultPath === vaultSwitcher.vaultPath
    && switcherOwnsOnboardingVault
}

function needsAiAgentsOnboarding(
  onboardingState: StartupOnboardingState,
  aiAgentsPromptVisible: boolean,
  showMcpSetupDialog: boolean,
): boolean {
  return onboardingState.status === 'ready' && aiAgentsPromptVisible && !showMcpSetupDialog
}

function shouldShowStartupScreenForState({
  aiAgentsPromptVisible,
  isNoteWindow,
  onboardingState,
  runtimeMissingVaultPath,
  shouldResumeFreshStartOnboarding,
  showMcpSetupDialog,
}: ShouldShowStartupScreenArgs): boolean {
  if (isNoteWindow) return false

  const startupReasons = [
    Boolean(runtimeMissingVaultPath),
    onboardingState.status === 'welcome',
    onboardingState.status === 'vault-missing',
    shouldResumeFreshStartOnboarding,
    needsAiAgentsOnboarding(onboardingState, aiAgentsPromptVisible, showMcpSetupDialog),
  ]
  return startupReasons.some(Boolean)
}

function isVaultContentLoading(
  isNoteWindow: boolean,
  isStartupLoading: boolean,
  onboardingState: StartupOnboardingState,
  vaultIsLoading: boolean,
): boolean {
  const readyVaultIsLoading = onboardingState.status === 'ready' && vaultIsLoading
  return !isNoteWindow && (isStartupLoading || readyVaultIsLoading)
}

export function useStartupScreenState({
  aiAgentsPromptVisible,
  isNoteWindow,
  onboardingState,
  runtimeMissingVaultPath,
  selectedVaultPath,
  showMcpSetupDialog,
  vaultIsLoading,
  vaultSwitcher,
}: UseStartupScreenStateArgs): StartupScreenState {
  const shouldResumeFreshStartOnboarding = useMemo(
    () => shouldResumeFreshStart(onboardingState, selectedVaultPath, vaultSwitcher),
    [onboardingState, selectedVaultPath, vaultSwitcher],
  )

  const isStartupLoading = !isNoteWindow && onboardingState.status === 'loading'
  const shouldShowStartupScreen = shouldShowStartupScreenForState({
    aiAgentsPromptVisible,
    isNoteWindow,
    onboardingState,
    runtimeMissingVaultPath,
    shouldResumeFreshStartOnboarding,
    showMcpSetupDialog,
  })
  const vaultContentLoading = isVaultContentLoading(
    isNoteWindow,
    isStartupLoading,
    onboardingState,
    vaultIsLoading,
  )

  return {
    isStartupLoading,
    isVaultContentLoading: vaultContentLoading,
    shouldResumeFreshStartOnboarding,
    shouldShowStartupScreen,
  }
}
