import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const DEFAULT_VAULT_PATH = path.resolve(process.cwd(), 'demo-vault-v2')

async function mockFreshStart(
  page: Page,
  options: {
    activeVault: string | null
    checkExistingPath: string
    rememberWelcomeDismissal?: boolean
  },
) {
  await page.addInitScript((config) => {
    type Handler = (args?: Record<string, unknown>) => unknown
    type BrowserWindow = Window & typeof globalThis & {
      __mockHandlers?: Record<string, Handler>
    }

    const browserWindow = window as BrowserWindow

    localStorage.clear()
    localStorage.setItem('tolaria:ai-agents-onboarding-dismissed', '1')
    localStorage.setItem('tolaria:claude-code-onboarding-dismissed', '1')
    if (config.rememberWelcomeDismissal) {
      localStorage.setItem('tolaria_welcome_dismissed', '1')
    }

    const applyOverrides = (handlers?: Record<string, Handler> | null) => {
      if (!handlers) return handlers ?? null

      const originalGetSettings = handlers.get_settings
      handlers.get_settings = () => ({
        ...(typeof originalGetSettings === 'function' ? originalGetSettings() as Record<string, unknown> : {}),
        telemetry_consent: null,
        crash_reporting_enabled: null,
        analytics_enabled: null,
        anonymous_id: null,
      })
      handlers.load_vault_list = () => ({
        vaults: [],
        active_vault: config.activeVault,
        hidden_defaults: [],
      })
      handlers.get_default_vault_path = () => config.checkExistingPath
      handlers.check_vault_exists = (args?: Record<string, unknown>) => args?.path === config.checkExistingPath

      return handlers
    }

    let ref = applyOverrides(browserWindow.__mockHandlers) ?? null

    Object.defineProperty(browserWindow, '__mockHandlers', {
      configurable: true,
      set(value) {
        ref = applyOverrides(value as Record<string, Handler> | undefined) ?? null
      },
      get() {
        return applyOverrides(ref) ?? ref
      },
    })
  }, options)
}

test('a fresh start opens the vault choice wizard directly without a consent dialog @smoke', async ({ page }) => {
  await mockFreshStart(page, {
    activeVault: null,
    checkExistingPath: DEFAULT_VAULT_PATH,
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('Help improve Tolaria')).not.toBeVisible()
  await expect(page.getByTestId('welcome-screen')).toBeVisible()
  await expect(page.getByTestId('welcome-open-folder')).toBeVisible()
  await expect(page.getByTestId('welcome-create-vault')).toBeFocused()
})

test('the welcome wizard is fully keyboard navigable on a fresh start @smoke', async ({ page }) => {
  await mockFreshStart(page, {
    activeVault: null,
    checkExistingPath: DEFAULT_VAULT_PATH,
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('welcome-screen')).toBeVisible()
  await expect(page.getByTestId('welcome-create-vault')).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByTestId('welcome-create-new')).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByTestId('welcome-open-folder')).toBeFocused()

  let dialogHandled = false
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Open vault folder')
    await dialog.dismiss()
    dialogHandled = true
  })
  await page.keyboard.press('Enter')
  await expect.poll(() => dialogHandled).toBe(true)

  await expect(page.getByTestId('welcome-screen')).toBeVisible()

  await page.keyboard.press('Shift+Tab')
  await expect(page.getByTestId('welcome-create-new')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByTestId('welcome-create-vault')).toBeFocused()
})

test('a fresh start with only a remembered default vault resumes onboarding @smoke', async ({ page }) => {
  await mockFreshStart(page, {
    activeVault: DEFAULT_VAULT_PATH,
    checkExistingPath: DEFAULT_VAULT_PATH,
    rememberWelcomeDismissal: true,
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('welcome-screen')).toBeVisible()
  await expect(page.getByTestId('welcome-open-folder')).toBeVisible()
})
