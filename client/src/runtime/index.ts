// Cinematic Runtime - Organized subsystem re-exports
// This file provides a unified API for the cinematic runtime organized by directorial concerns

// Acting subsystem - character performance and expression
export * from './acting';
export { default as ActingScheduler } from './acting/actingScheduler';
export { default as ExpressiveCharacter } from './acting/expressiveCharacter';

// Camera subsystem - shot composition and movement
export * from './camera';
export { default as CameraRuntime } from './camera/cameraRuntime';
export { default as IntentDrivenCamera } from './camera/intentDrivenCamera';

// Atmosphere subsystem - environment and mood
export * from '../three/atmosphere';

// Composition subsystem - framing and visual hierarchy
export * from './composition';

// Emotional Space integration
export { deriveEmotionalSpaceFromTone, createDefaultEmotionalSpace } from '@animaster/shared/emotionalSpace';
export type { EmotionalSpaceState } from '@animaster/shared/emotionalSpace';

// Pacing subsystem - rhythm and timing  
export * from './timing';
export * from './rhythm';

// Staging subsystem - character positioning
export * from './staging';

// Continuity subsystem - smooth transitions
export * from './continuity';

// Live mutation - real-time scene changes
export * from './liveMutation';

// Directing subsystem - command interpretation
export * from './directing';

// Beats subsystem
export * from './beats';

// Evolution subsystem
export * from './evolution';