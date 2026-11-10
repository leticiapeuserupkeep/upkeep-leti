import { redirect } from 'next/navigation'

/** The first-run experience lives at /onboarding-v2; this keeps old links working. */
export default function OnboardingRedirect() {
  redirect('/onboarding-v2')
}
