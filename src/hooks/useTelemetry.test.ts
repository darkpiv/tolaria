import { describe, expect, it, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTelemetry } from './useTelemetry'
import { isFeatureEnabled, setReleaseChannel } from '../lib/telemetry'
import type { Settings } from '../types'

function settingsWithChannel(channel: string | null): Settings {
  return { release_channel: channel } as Settings
}

describe('useTelemetry (offline fork)', () => {
  afterEach(() => {
    setReleaseChannel('stable')
  })

  it('syncs the release channel used for local feature flags', () => {
    renderHook(() => useTelemetry(settingsWithChannel('alpha'), true))
    expect(isFeatureEnabled('any-flag')).toBe(true)
  })

  it('does not sync the release channel before settings are loaded', () => {
    setReleaseChannel('stable')
    renderHook(() => useTelemetry(settingsWithChannel('alpha'), false))
    expect(isFeatureEnabled('any-flag')).toBe(false)
  })
})
