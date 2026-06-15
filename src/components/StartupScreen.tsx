import { AiAgentsOnboardingPrompt } from './AiAgentsOnboardingPrompt'
import { Toast } from './Toast'
import { WelcomeScreen } from './WelcomeScreen'
import type { useAiAgentsOnboarding } from '../hooks/useAiAgentsOnboarding'
import type { useAiAgentsStatus } from '../hooks/useAiAgentsStatus'
import type { useOnboarding } from '../hooks/useOnboarding'
import type { useVaultSwitcher } from '../hooks/useVaultSwitcher'
import type { NoteWindowParams } from '../utils/windowMode'

type OnboardingState = ReturnType<typeof useOnboarding>
type VaultSwitcherState = ReturnType<typeof useVaultSwitcher>
type AiAgentsOnboardingState = ReturnType<typeof useAiAgentsOnboarding>

export interface StartupScreenParams {
  aiAgentsOnboarding: AiAgentsOnboardingState
  aiAgentsStatus: ReturnType<typeof useAiAgentsStatus>
  isOffline: boolean
  noteWindowParams: NoteWindowParams | null
  onboarding: OnboardingState
  runtimeMissingVaultPath: string | null
  shouldResumeFreshStartOnboarding: boolean
  showMcpSetupDialog: boolean
  setToastMessage: (message: string | null) => void
  toastMessage: string | null
  vaultSwitcher: VaultSwitcherState
}

function shouldShowWelcomeView(params: StartupScreenParams): boolean {
  return !params.noteWindowParams
    && (
      Boolean(params.runtimeMissingVaultPath)
      || params.onboarding.state.status === 'welcome'
      || params.onboarding.state.status === 'vault-missing'
      || params.shouldResumeFreshStartOnboarding
    )
}

function welcomeOnboardingState(params: StartupScreenParams): OnboardingState {
  if (params.runtimeMissingVaultPath) {
    return {
      ...params.onboarding,
      state: {
        status: 'vault-missing' as const,
        vaultPath: params.runtimeMissingVaultPath,
        defaultPath: params.vaultSwitcher.defaultPath || params.runtimeMissingVaultPath,
      },
    }
  }
  if (params.shouldResumeFreshStartOnboarding) {
    return { ...params.onboarding, state: { status: 'welcome' as const, defaultPath: params.vaultSwitcher.vaultPath } }
  }
  return params.onboarding
}

function shouldShowAiAgentsOnboarding(params: StartupScreenParams): boolean {
  return !params.noteWindowParams
    && params.onboarding.state.status === 'ready'
    && params.aiAgentsOnboarding.showPrompt
    && !params.showMcpSetupDialog
}

function WelcomeView({ onboarding, isOffline }: { onboarding: OnboardingState; isOffline: boolean }) {
  const state = onboarding.state as { status: 'welcome' | 'vault-missing'; defaultPath: string; vaultPath?: string }
  return (
    <div className="app-shell">
      <WelcomeScreen
        mode={state.status === 'welcome' ? 'welcome' : 'vault-missing'}
        missingPath={state.status === 'vault-missing' ? state.vaultPath : undefined}
        defaultVaultPath={state.defaultPath}
        onCreateVault={onboarding.handleCreateVault}
        onRetryCreateVault={onboarding.retryCreateVault}
        onCreateEmptyVault={onboarding.handleCreateEmptyVault}
        onOpenFolder={onboarding.handleOpenFolder}
        isOffline={isOffline}
        creatingAction={onboarding.creatingAction}
        error={onboarding.error}
        canRetryTemplate={onboarding.canRetryTemplate}
      />
    </div>
  )
}

function AiAgentsOnboardingView({
  statuses,
  onContinue,
}: {
  statuses: ReturnType<typeof useAiAgentsStatus>
  onContinue: () => void
}) {
  return (
    <div className="app-shell">
      <AiAgentsOnboardingPrompt statuses={statuses} onContinue={onContinue} />
    </div>
  )
}

export function StartupScreen(params: StartupScreenParams) {
  if (shouldShowWelcomeView(params)) {
    return (
      <WelcomeView
        onboarding={welcomeOnboardingState(params)}
        isOffline={params.isOffline}
      />
    )
  }

  if (!shouldShowAiAgentsOnboarding(params)) return null
  return (
    <>
      <AiAgentsOnboardingView
        statuses={params.aiAgentsStatus}
        onContinue={params.aiAgentsOnboarding.dismissPrompt}
      />
      <Toast message={params.toastMessage} onDismiss={() => params.setToastMessage(null)} />
    </>
  )
}
