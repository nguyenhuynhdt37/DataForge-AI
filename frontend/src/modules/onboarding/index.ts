/**
 * Domain Module: Onboarding & CVAT Host Integration
 * Dự án: GreenSM MLOps Platform — VinFast Hackathon
 * Tuân thủ: docs/api-specs/CVAT_ONBOARDING_API_SPECIFICATION.md
 */

// Types
export * from './types';

// Services
export { onboardingApi } from './services/onboardingApi';

// Hooks
export { useOnboarding } from './hooks/useOnboarding';

// Components
export { OnboardingModal } from './components/OnboardingModal';
export { CvatLoginForm } from './components/CvatLoginForm';
export { CvatTokenForm } from './components/CvatTokenForm';
export { CvatConnectedView } from './components/CvatConnectedView';

