// Phase 8 — Task Group 2: Server-side Live Mutation Processor

export interface LiveMutationRequest {
  command: string;
  currentTone: string;
  currentEnvironment: string;
  actorCount: number;
  currentEffects: string[];
}

export interface LiveMutationResponse {
  mutations: LiveMutationOp[];
  reasoning: string;
}

export type LiveMutationOp =
  | { type: 'tone'; value: string }
  | { type: 'emotion'; actorId: string; emotion: string; intensity: number }
  | { type: 'camera'; mode: string; push: number }
  | { type: 'atmosphere'; effect: string }
  | { type: 'lighting'; tint: string; ambientDelta: number }
  | { type: 'pacing'; tempo: string; pauseWeight: number }
  | { type: 'spacing'; delta: number };

const TONE_MAP: Record<string, string[]> = {
  lonely: ['lonely', 'lonelier', 'isolation', 'isolated', 'alone', 'solitary'],
  tense: ['tense', 'tension', 'pressure', 'trapped', 'claustrophobic', 'suffocating'],
  sad: ['sad', 'melancholy', 'sorrow', 'grief', 'depressed'],
  awkward: ['awkward', 'uncomfortable', 'uneasy', 'cringe'],
  romantic: ['romantic', 'intimate', 'tender', 'love', 'affection'],
  energetic: ['energetic', 'chaotic', 'frantic', 'urgent', 'manic'],
  threatening: ['threatening', 'menacing', 'danger', 'sinister'],
};

export function processLiveMutation(request: LiveMutationRequest): LiveMutationResponse {
  const { command } = request;
  const lower = command.toLowerCase();
  const mutations: LiveMutationOp[] = [];
  const reasons: string[] = [];

  // Tone detection
  for (const [tone, keywords] of Object.entries(TONE_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      mutations.push({ type: 'tone', value: tone });
      reasons.push(`Detected tonal intent: ${tone}`);
      break;
    }
  }

  // Camera
  if (/push.*closer|push.*in|camera.*closer/i.test(command)) {
    mutations.push({ type: 'camera', mode: 'close_up', push: 0.3 });
    reasons.push('Camera push-in requested');
  } else if (/pull.*back|widen|wider/i.test(command)) {
    mutations.push({ type: 'camera', mode: 'wide_shot', push: -0.3 });
    reasons.push('Camera pull-back requested');
  }

  // Atmosphere
  if (/rain/i.test(command)) {
    mutations.push({ type: 'atmosphere', effect: 'rain' });
    reasons.push('Rain atmosphere added');
  }
  if (/fog|haze/i.test(command)) {
    mutations.push({ type: 'atmosphere', effect: 'fog' });
    reasons.push('Fog atmosphere added');
  }

  // Lighting
  if (/cold|colder|blue/i.test(command)) {
    mutations.push({ type: 'lighting', tint: 'cold', ambientDelta: -0.1 });
    reasons.push('Cold lighting shift');
  } else if (/warm|warmer|golden/i.test(command)) {
    mutations.push({ type: 'lighting', tint: 'warm', ambientDelta: 0.1 });
    reasons.push('Warm lighting shift');
  }

  // Spacing
  if (/emotional.*distance|further.*apart/i.test(command)) {
    mutations.push({ type: 'spacing', delta: 80 });
    reasons.push('Increased emotional spacing');
  } else if (/closer.*together|bring.*closer/i.test(command)) {
    mutations.push({ type: 'spacing', delta: -60 });
    reasons.push('Decreased spacing for intimacy');
  }

  // Pacing
  if (/silence|quiet|still/i.test(command)) {
    mutations.push({ type: 'pacing', tempo: 'slow', pauseWeight: 0.85 });
    reasons.push('Silence/stillness pacing applied');
  } else if (/slow/i.test(command)) {
    mutations.push({ type: 'pacing', tempo: 'slow', pauseWeight: 0.6 });
    reasons.push('Slow pacing applied');
  }

  return {
    mutations,
    reasoning: reasons.length > 0 ? reasons.join('; ') : 'No specific mutations matched'
  };
}
