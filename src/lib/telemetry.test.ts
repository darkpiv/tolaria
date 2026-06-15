import { describe, expect, it, afterEach } from 'vitest'
import { isFeatureEnabled, setReleaseChannel, trackEvent } from './telemetry'

describe('telemetry (offline fork)', () => {
  afterEach(() => {
    setReleaseChannel('stable')
  })

  it('returns local defaults for feature flags on the stable channel', () => {
    setReleaseChannel('stable')
    expect(isFeatureEnabled('any-unknown-flag')).toBe(false)
  })

  it('enables all feature flags on the alpha channel', () => {
    setReleaseChannel('alpha')
    expect(isFeatureEnabled('any-unknown-flag')).toBe(true)
  })

  it('accepts product analytics events without sending anything', () => {
    expect(() => trackEvent('some_event', { value: 1 })).not.toThrow()
    expect(() => trackEvent('some_event')).not.toThrow()
  })
})
