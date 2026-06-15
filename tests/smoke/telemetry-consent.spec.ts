import { test, expect } from '@playwright/test'

test.describe('Telemetry removal (offline fork)', () => {
  test('consent dialog never appears, even when consent was never recorded', async ({ page }) => {
    await page.addInitScript(() => {
      type Handler = (args?: Record<string, unknown>) => unknown
      type BrowserWindow = Window & typeof globalThis & {
        __mockHandlers?: Record<string, Handler>
      }

      const browserWindow = window as BrowserWindow

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
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Help improve Tolaria')).not.toBeVisible({ timeout: 5000 })
  })

  test('settings panel no longer offers telemetry toggles', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.keyboard.press('Meta+,')
    await expect(page.getByTestId('settings-panel')).toBeVisible({ timeout: 5000 })

    await expect(page.getByText('Privacy & Telemetry')).not.toBeVisible()
    await expect(page.getByTestId('settings-crash-reporting')).not.toBeVisible()
    await expect(page.getByTestId('settings-analytics')).not.toBeVisible()
  })
})
