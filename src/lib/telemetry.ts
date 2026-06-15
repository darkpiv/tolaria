// Offline fork: PostHog analytics and Sentry crash reporting are removed.
// The trackEvent / isFeatureEnabled API surface is kept so call sites stay
// unchanged, but nothing ever leaves the machine.

type ReleaseChannel = string
type FeatureFlagKey = string
type ProductAnalyticsEventName = string
type ProductAnalyticsProperties = Record<string, string | number>

/** Local defaults for feature flags (no remote flag service in this fork). */
const FEATURE_DEFAULTS: Record<string, boolean> = {}

let currentReleaseChannel: ReleaseChannel = 'stable'

export function setReleaseChannel(channel: ReleaseChannel): void {
  currentReleaseChannel = channel
}

export function isFeatureEnabled(flagKey: FeatureFlagKey): boolean {
  if (currentReleaseChannel === 'alpha') return true
  return (Reflect.get(FEATURE_DEFAULTS, flagKey) as boolean | undefined) ?? false
}

// Intentionally a no-op: this fork sends no product analytics.
export const trackEvent: (
  name: ProductAnalyticsEventName,
  properties?: ProductAnalyticsProperties,
) => void = () => {}
