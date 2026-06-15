import { useEffect } from 'react'
import { setReleaseChannel } from '../lib/telemetry'
import { normalizeReleaseChannel } from '../lib/releaseChannel'
import type { Settings } from '../types'

/**
 * Offline fork: Sentry and PostHog are removed. This hook only keeps the
 * local feature-flag defaults in sync with the configured release channel.
 */
export function useTelemetry(settings: Settings, loaded: boolean): void {
  useEffect(() => {
    if (!loaded) return
    setReleaseChannel(normalizeReleaseChannel(settings.release_channel))
  }, [loaded, settings.release_channel])
}
