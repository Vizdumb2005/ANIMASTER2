/**
 * Environmental Audio Foundations — lightweight ambient sound layers
 * driven by Animaster's semantic scene state.
 * Uses Howler.js for cross-browser audio.
 */
import { Howl } from 'howler';

export type AmbientSoundType =
  | 'rain' | 'wind' | 'city' | 'subway' | 'forest'
  | 'ocean' | 'night' | 'indoor_hum' | 'silence';

interface SoundLayer {
  howl: Howl | null;
  volume: number;
  fadeTarget: number;
  type: AmbientSoundType;
  url: string;
}

interface AmbientSoundConfig {
  volume: number;
  loop: boolean;
  fadeInMs: number;
  fadeOutMs: number;
}

const AMBIENT_CONFIGS: Record<AmbientSoundType, AmbientSoundConfig> = {
  rain: { volume: 0.4, loop: true, fadeInMs: 2000, fadeOutMs: 3000 },
  wind: { volume: 0.25, loop: true, fadeInMs: 3000, fadeOutMs: 4000 },
  city: { volume: 0.2, loop: true, fadeInMs: 2000, fadeOutMs: 3000 },
  subway: { volume: 0.3, loop: true, fadeInMs: 1500, fadeOutMs: 2000 },
  forest: { volume: 0.3, loop: true, fadeInMs: 3000, fadeOutMs: 4000 },
  ocean: { volume: 0.35, loop: true, fadeInMs: 3000, fadeOutMs: 4000 },
  night: { volume: 0.15, loop: true, fadeInMs: 4000, fadeOutMs: 5000 },
  indoor_hum: { volume: 0.1, loop: true, fadeInMs: 2000, fadeOutMs: 3000 },
  silence: { volume: 0, loop: false, fadeInMs: 0, fadeOutMs: 1000 },
};

type ToneKey = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_AMBIENCE: Record<ToneKey, AmbientSoundType[]> = {
  neutral: ['city'],
  lonely: ['wind', 'night'],
  tense: ['indoor_hum'],
  romantic: ['night'],
  sad: ['rain'],
  threatening: ['wind'],
  awkward: ['indoor_hum'],
  energetic: ['city'],
};

export class AmbientAudioManager {
  private layers: Map<string, SoundLayer> = new Map();
  private masterVolume: number = 0.5;
  private muted: boolean = false;
  private audioBasePath: string;

  constructor(audioBasePath: string = '/assets/audio/') {
    this.audioBasePath = audioBasePath;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    for (const layer of this.layers.values()) {
      if (layer.howl) {
        layer.howl.volume(layer.volume * this.masterVolume);
      }
    }
  }

  mute(): void {
    this.muted = true;
    for (const layer of this.layers.values()) {
      layer.howl?.mute(true);
    }
  }

  unmute(): void {
    this.muted = false;
    for (const layer of this.layers.values()) {
      layer.howl?.mute(false);
    }
  }

  addLayer(id: string, type: AmbientSoundType, url?: string): void {
    if (this.layers.has(id)) {
      this.removeLayer(id);
    }

    const config = AMBIENT_CONFIGS[type];
    const audioUrl = url ?? `${this.audioBasePath}${type}.mp3`;

    const howl = new Howl({
      src: [audioUrl],
      loop: config.loop,
      volume: 0,
      preload: true,
      onload: () => {
        howl.play();
        howl.fade(0, config.volume * this.masterVolume, config.fadeInMs);
      },
      onloaderror: () => {
        // Audio file not found — degrade gracefully (silent)
      },
    });

    if (this.muted) {
      howl.mute(true);
    }

    this.layers.set(id, {
      howl,
      volume: config.volume,
      fadeTarget: config.volume,
      type,
      url: audioUrl,
    });
  }

  removeLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer?.howl) {
      const config = AMBIENT_CONFIGS[layer.type];
      layer.howl.fade(layer.howl.volume(), 0, config.fadeOutMs);
      setTimeout(() => {
        layer.howl?.unload();
      }, config.fadeOutMs + 100);
    }
    this.layers.delete(id);
  }

  applyTone(tone: string): void {
    const ambience = TONE_AMBIENCE[tone as ToneKey] ?? TONE_AMBIENCE.neutral;
    const activeIds = new Set(ambience);

    for (const [id] of this.layers) {
      if (!activeIds.has(id as AmbientSoundType)) {
        this.removeLayer(id);
      }
    }

    for (const soundType of ambience) {
      if (!this.layers.has(soundType)) {
        this.addLayer(soundType, soundType);
      }
    }
  }

  applyEnvironment(envType: string): void {
    const envAmbience = getAmbienceForEnvironment(envType);
    for (const soundType of envAmbience) {
      if (!this.layers.has(soundType)) {
        this.addLayer(soundType, soundType);
      }
    }
  }

  clearAll(): void {
    for (const [id] of this.layers) {
      this.removeLayer(id);
    }
  }

  dispose(): void {
    for (const layer of this.layers.values()) {
      layer.howl?.unload();
    }
    this.layers.clear();
  }
}

function getAmbienceForEnvironment(envType: string): AmbientSoundType[] {
  const mapping: Record<string, AmbientSoundType[]> = {
    indoor_room: ['indoor_hum'],
    apartment: ['indoor_hum'],
    hallway: ['indoor_hum'],
    hospital: ['indoor_hum'],
    subway: ['subway'],
    outdoor_street: ['city'],
    outdoor_park: ['forest', 'wind'],
    outdoor_beach: ['ocean', 'wind'],
    outdoor_forest: ['forest'],
    rooftop: ['wind', 'city'],
    staircase: ['indoor_hum'],
  };
  return mapping[envType] ?? [];
}
