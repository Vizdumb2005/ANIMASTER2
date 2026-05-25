import { Result, ok, err } from './result.js';
import {
  SceneGraph,
  ActorEmotion,
  ActorAction,
  CameraMode,
  SceneTone,
  AtmosphereEffect,
  RelationshipType
} from './scene.js';
import YAML from 'yaml';

export interface ParseError {
  path?: string;
  message: string;
  line?: number;
  column?: number;
}

function formatPath(path: (string | number)[]): string {
  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    } else {
      return index === 0 ? segment : `${acc}.${segment}`;
    }
  }, '');
}

export class SpecParser {
  static parse(yamlStr: string): Result<SceneGraph, ParseError[]> {
    const lineCounter = new YAML.LineCounter();
    const doc = YAML.parseDocument(yamlStr, { lineCounter });
    
    if (doc.errors && doc.errors.length > 0) {
      const parseErrors: ParseError[] = doc.errors.map(e => {
        const lineCol = (e.pos && e.pos.length > 0) ? lineCounter.linePos(e.pos[0]) : { line: undefined, col: undefined };
        return {
          message: e.message,
          line: lineCol.line,
          column: lineCol.col
        };
      });
      return err(parseErrors);
    }

    const val = doc.toJS();

    function getLineColForPath(path: (string | number)[]): { line?: number; column?: number } {
      let node = doc.getIn(path, true) as any;
      const currentPath = [...path];
      while (!node && currentPath.length > 0) {
        currentPath.pop();
        node = doc.getIn(currentPath, true) as any;
      }
      if (node && node.range) {
        const pos = lineCounter.linePos(node.range[0]);
        return { line: pos.line, column: pos.col };
      }
      return {};
    }

    function createError(path: (string | number)[], message: string): ParseError {
      const pathStr = formatPath(path);
      const lineCol = getLineColForPath(path);
      return {
        path: pathStr,
        message,
        line: lineCol.line,
        column: lineCol.column
      };
    }

    const errors: ParseError[] = [];

    if (typeof val !== 'object' || val === null) {
      errors.push(createError([], 'Expected root object for SceneGraph'));
      return err(errors);
    }

    // id: string
    if (val.id === undefined) {
      errors.push(createError(['id'], "Property 'id' is required"));
    } else if (typeof val.id !== 'string') {
      errors.push(createError(['id'], "Property 'id' must be a string"));
    }

    // version: number
    if (val.version === undefined) {
      errors.push(createError(['version'], "Property 'version' is required"));
    } else if (typeof val.version !== 'number') {
      errors.push(createError(['version'], "Property 'version' must be a number"));
    }

    // seed: optional number
    if (val.seed !== undefined && typeof val.seed !== 'number') {
      errors.push(createError(['seed'], "Property 'seed' must be a number"));
    }

    // actors: Actor[]
    if (val.actors === undefined) {
      errors.push(createError(['actors'], "Property 'actors' is required"));
    } else if (!Array.isArray(val.actors)) {
      errors.push(createError(['actors'], "Property 'actors' must be an array"));
    } else {
      val.actors.forEach((actor: any, idx: number) => {
        errors.push(...validateActor(actor, ['actors', idx]));
      });
    }

    // environment: Environment
    if (val.environment === undefined) {
      errors.push(createError(['environment'], "Property 'environment' is required"));
    } else {
      errors.push(...validateEnvironment(val.environment, ['environment']));
    }

    // camera: Camera
    if (val.camera === undefined) {
      errors.push(createError(['camera'], "Property 'camera' is required"));
    } else {
      errors.push(...validateCamera(val.camera, ['camera']));
    }

    // sessionHistory: SessionEntry[]
    if (val.sessionHistory === undefined) {
      errors.push(createError(['sessionHistory'], "Property 'sessionHistory' is required"));
    } else if (!Array.isArray(val.sessionHistory)) {
      errors.push(createError(['sessionHistory'], "Property 'sessionHistory' must be an array"));
    } else {
      val.sessionHistory.forEach((entry: any, idx: number) => {
        errors.push(...validateSessionEntry(entry, ['sessionHistory', idx]));
      });
    }

    // cinematicGrammar: CinematicGrammar
    if (val.cinematicGrammar === undefined) {
      errors.push(createError(['cinematicGrammar'], "Property 'cinematicGrammar' is required"));
    } else {
      errors.push(...validateCinematicGrammar(val.cinematicGrammar, ['cinematicGrammar']));
    }

    // atmosphere: AtmosphereProfile
    if (val.atmosphere === undefined) {
      errors.push(createError(['atmosphere'], "Property 'atmosphere' is required"));
    } else {
      errors.push(...validateAtmosphere(val.atmosphere, ['atmosphere']));
    }

    // relationships: CharacterRelationship[]
    if (val.relationships === undefined) {
      errors.push(createError(['relationships'], "Property 'relationships' is required"));
    } else if (!Array.isArray(val.relationships)) {
      errors.push(createError(['relationships'], "Property 'relationships' must be an array"));
    } else {
      val.relationships.forEach((rel: any, idx: number) => {
        errors.push(...validateRelationship(rel, ['relationships', idx]));
      });
    }

    // rhythm: SceneRhythm
    if (val.rhythm === undefined) {
      errors.push(createError(['rhythm'], "Property 'rhythm' is required"));
    } else {
      errors.push(...validateRhythm(val.rhythm, ['rhythm']));
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok(val as SceneGraph);

    // Helpers
    function validateVector2(v: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof v !== 'object' || v === null) {
        errs.push(createError(path, 'Expected object for Vector2'));
        return errs;
      }
      if (v.x === undefined) {
        errs.push(createError([...path, 'x'], "Property 'x' is required"));
      } else if (typeof v.x !== 'number') {
        errs.push(createError([...path, 'x'], "Property 'x' must be a number"));
      }
      if (v.y === undefined) {
        errs.push(createError([...path, 'y'], "Property 'y' is required"));
      } else if (typeof v.y !== 'number') {
        errs.push(createError([...path, 'y'], "Property 'y' must be a number"));
      }
      return errs;
    }

    function validateJoints(joints: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof joints !== 'object' || joints === null) {
        errs.push(createError(path, 'Expected object for joints'));
        return errs;
      }
      const jointKeys = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
      jointKeys.forEach(key => {
        if (joints[key] === undefined) {
          errs.push(createError([...path, key], `Property '${key}' is required in joints`));
        } else {
          errs.push(...validateVector2(joints[key], [...path, key]));
        }
      });
      return errs;
    }

    function validateActor(actor: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof actor !== 'object' || actor === null) {
        errs.push(createError(path, 'Expected object for Actor'));
        return errs;
      }

      if (actor.id === undefined) {
        errs.push(createError([...path, 'id'], "Property 'id' is required"));
      } else if (typeof actor.id !== 'string') {
        errs.push(createError([...path, 'id'], "Property 'id' must be a string"));
      }

      if (actor.label === undefined) {
        errs.push(createError([...path, 'label'], "Property 'label' is required"));
      } else if (typeof actor.label !== 'string') {
        errs.push(createError([...path, 'label'], "Property 'label' must be a string"));
      }

      if (actor.type === undefined) {
        errs.push(createError([...path, 'type'], "Property 'type' is required"));
      } else if (actor.type !== 'humanoid') {
        errs.push(createError([...path, 'type'], "Property 'type' must be 'humanoid'"));
      }

      if (actor.position === undefined) {
        errs.push(createError([...path, 'position'], "Property 'position' is required"));
      } else {
        errs.push(...validateVector2(actor.position, [...path, 'position']));
      }

      if (actor.targetPosition === undefined) {
        errs.push(createError([...path, 'targetPosition'], "Property 'targetPosition' is required"));
      } else if (actor.targetPosition !== null) {
        errs.push(...validateVector2(actor.targetPosition, [...path, 'targetPosition']));
      }

      const validEmotions: ActorEmotion[] = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];
      if (actor.emotionState === undefined) {
        errs.push(createError([...path, 'emotionState'], "Property 'emotionState' is required"));
      } else if (!validEmotions.includes(actor.emotionState)) {
        errs.push(createError([...path, 'emotionState'], `Property 'emotionState' must be one of: ${validEmotions.join(', ')}`));
      }

      const validActions: ActorAction[] = ['idle', 'walking', 'sitting', 'approaching', 'pacing'];
      if (actor.currentAction === undefined) {
        errs.push(createError([...path, 'currentAction'], "Property 'currentAction' is required"));
      } else if (!validActions.includes(actor.currentAction)) {
        errs.push(createError([...path, 'currentAction'], `Property 'currentAction' must be one of: ${validActions.join(', ')}`));
      }

      if (actor.actionQueue === undefined) {
        errs.push(createError([...path, 'actionQueue'], "Property 'actionQueue' is required"));
      } else if (!Array.isArray(actor.actionQueue)) {
        errs.push(createError([...path, 'actionQueue'], "Property 'actionQueue' must be an array"));
      } else {
        actor.actionQueue.forEach((act: any, idx: number) => {
          if (!validActions.includes(act)) {
            errs.push(createError([...path, 'actionQueue', idx], `Action must be one of: ${validActions.join(', ')}`));
          }
        });
      }

      if (actor.joints === undefined) {
        errs.push(createError([...path, 'joints'], "Property 'joints' is required"));
      } else {
        errs.push(...validateJoints(actor.joints, [...path, 'joints']));
      }

      if (actor.actionElapsed === undefined) {
        errs.push(createError([...path, 'actionElapsed'], "Property 'actionElapsed' is required"));
      } else if (typeof actor.actionElapsed !== 'number') {
        errs.push(createError([...path, 'actionElapsed'], "Property 'actionElapsed' must be a number"));
      }

      return errs;
    }

    function validateEnvironment(env: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof env !== 'object' || env === null) {
        errs.push(createError(path, 'Expected object for environment'));
        return errs;
      }
      const stringKeys = ['type', 'backgroundColor', 'floorColor', 'wallColor'];
      const numberKeys = ['width', 'height'];

      stringKeys.forEach(key => {
        if (env[key] === undefined) {
          errs.push(createError([...path, key], `Property '${key}' is required`));
        } else if (typeof env[key] !== 'string') {
          errs.push(createError([...path, key], `Property '${key}' must be a string`));
        }
      });

      numberKeys.forEach(key => {
        if (env[key] === undefined) {
          errs.push(createError([...path, key], `Property '${key}' is required`));
        } else if (typeof env[key] !== 'number') {
          errs.push(createError([...path, key], `Property '${key}' must be a number`));
        }
      });

      return errs;
    }

    function validateCamera(cam: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof cam !== 'object' || cam === null) {
        errs.push(createError(path, 'Expected object for camera'));
        return errs;
      }
      const numberKeys = ['x', 'y', 'zoom'];
      numberKeys.forEach(key => {
        if (cam[key] === undefined) {
          errs.push(createError([...path, key], `Property '${key}' is required`));
        } else if (typeof cam[key] !== 'number') {
          errs.push(createError([...path, key], `Property '${key}' must be a number`));
        }
      });

      const validModes: CameraMode[] = ['static', 'follow', 'close_up', 'wide_shot', 'over_the_shoulder', 'dramatic_zoom', 'tension'];
      if (cam.mode === undefined) {
        errs.push(createError([...path, 'mode'], "Property 'mode' is required"));
      } else if (!validModes.includes(cam.mode)) {
        errs.push(createError([...path, 'mode'], `Property 'mode' must be one of: ${validModes.join(', ')}`));
      }

      return errs;
    }

    function validateSessionEntry(entry: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof entry !== 'object' || entry === null) {
        errs.push(createError(path, 'Expected object for sessionHistory entry'));
        return errs;
      }
      if (entry.id === undefined) {
        errs.push(createError([...path, 'id'], "Property 'id' is required"));
      } else if (typeof entry.id !== 'string') {
        errs.push(createError([...path, 'id'], "Property 'id' must be a string"));
      }

      if (entry.prompt === undefined) {
        errs.push(createError([...path, 'prompt'], "Property 'prompt' is required"));
      } else if (typeof entry.prompt !== 'string') {
        errs.push(createError([...path, 'prompt'], "Property 'prompt' must be a string"));
      }

      if (entry.createdAt === undefined) {
        errs.push(createError([...path, 'createdAt'], "Property 'createdAt' is required"));
      } else if (typeof entry.createdAt !== 'number') {
        errs.push(createError([...path, 'createdAt'], "Property 'createdAt' must be a number"));
      }

      return errs;
    }

    function validateCinematicTemplate(tmpl: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof tmpl !== 'object' || tmpl === null) {
        errs.push(createError(path, 'Expected object for template'));
        return errs;
      }

      const validModes: CameraMode[] = ['static', 'follow', 'close_up', 'wide_shot', 'over_the_shoulder', 'dramatic_zoom', 'tension'];
      if (tmpl.cameraMode === undefined) {
        errs.push(createError([...path, 'cameraMode'], "Property 'cameraMode' is required"));
      } else if (!validModes.includes(tmpl.cameraMode)) {
        errs.push(createError([...path, 'cameraMode'], `Property 'cameraMode' must be one of: ${validModes.join(', ')}`));
      }

      const numberKeys = ['spacingMultiplier', 'motionEnergyScale', 'pauseFrequency', 'contrastBoost', 'headroom'];
      numberKeys.forEach(key => {
        if (tmpl[key] === undefined) {
          errs.push(createError([...path, key], `Property '${key}' is required`));
        } else if (typeof tmpl[key] !== 'number') {
          errs.push(createError([...path, key], `Property '${key}' must be a number`));
        }
      });

      return errs;
    }

    function validateCinematicGrammar(cg: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof cg !== 'object' || cg === null) {
        errs.push(createError(path, 'Expected object for cinematicGrammar'));
        return errs;
      }

      const validTones: SceneTone[] = ['neutral', 'sad', 'tense', 'lonely', 'awkward', 'energetic', 'romantic', 'threatening'];
      if (cg.tone === undefined) {
        errs.push(createError([...path, 'tone'], "Property 'tone' is required"));
      } else if (!validTones.includes(cg.tone)) {
        errs.push(createError([...path, 'tone'], `Property 'tone' must be one of: ${validTones.join(', ')}`));
      }

      if (cg.template === undefined) {
        errs.push(createError([...path, 'template'], "Property 'template' is required"));
      } else {
        errs.push(...validateCinematicTemplate(cg.template, [...path, 'template']));
      }

      return errs;
    }

    function validateAtmosphere(at: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof at !== 'object' || at === null) {
        errs.push(createError(path, 'Expected object for atmosphere'));
        return errs;
      }

      if (at.effects === undefined) {
        errs.push(createError([...path, 'effects'], "Property 'effects' is required"));
      } else if (!Array.isArray(at.effects)) {
        errs.push(createError([...path, 'effects'], "Property 'effects' must be an array"));
      } else {
        const validEffects: AtmosphereEffect[] = ['rain', 'fog', 'flicker', 'dust', 'snow', 'embers', 'none'];
        at.effects.forEach((eff: any, idx: number) => {
          if (!validEffects.includes(eff)) {
            errs.push(createError([...path, 'effects', idx], `Effect must be one of: ${validEffects.join(', ')}`));
          }
        });
      }

      if (at.lightingTint === undefined) {
        errs.push(createError([...path, 'lightingTint'], "Property 'lightingTint' is required"));
      } else if (typeof at.lightingTint !== 'string') {
        errs.push(createError([...path, 'lightingTint'], "Property 'lightingTint' must be a string"));
      }

      if (at.ambientIntensity === undefined) {
        errs.push(createError([...path, 'ambientIntensity'], "Property 'ambientIntensity' is required"));
      } else if (typeof at.ambientIntensity !== 'number') {
        errs.push(createError([...path, 'ambientIntensity'], "Property 'ambientIntensity' must be a number"));
      }

      return errs;
    }

    function validateRelationship(rel: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof rel !== 'object' || rel === null) {
        errs.push(createError(path, 'Expected object for relationship'));
        return errs;
      }

      if (rel.actorAId === undefined) {
        errs.push(createError([...path, 'actorAId'], "Property 'actorAId' is required"));
      } else if (typeof rel.actorAId !== 'string') {
        errs.push(createError([...path, 'actorAId'], "Property 'actorAId' must be a string"));
      }

      if (rel.actorBId === undefined) {
        errs.push(createError([...path, 'actorBId'], "Property 'actorBId' is required"));
      } else if (typeof rel.actorBId !== 'string') {
        errs.push(createError([...path, 'actorBId'], "Property 'actorBId' must be a string"));
      }

      const validTypes: RelationshipType[] = ['stranger', 'approaching', 'confronting', 'avoiding', 'conversing'];
      if (rel.type === undefined) {
        errs.push(createError([...path, 'type'], "Property 'type' is required"));
      } else if (!validTypes.includes(rel.type)) {
        errs.push(createError([...path, 'type'], `Property 'type' must be one of: ${validTypes.join(', ')}`));
      }

      if (rel.awarenessRadius === undefined) {
        errs.push(createError([...path, 'awarenessRadius'], "Property 'awarenessRadius' is required"));
      } else if (typeof rel.awarenessRadius !== 'number') {
        errs.push(createError([...path, 'awarenessRadius'], "Property 'awarenessRadius' must be a number"));
      }

      if (rel.gazeTarget === undefined) {
        errs.push(createError([...path, 'gazeTarget'], "Property 'gazeTarget' is required"));
      } else if (rel.gazeTarget !== null && typeof rel.gazeTarget !== 'string') {
        errs.push(createError([...path, 'gazeTarget'], "Property 'gazeTarget' must be string or null"));
      }

      const validEmotions: ActorEmotion[] = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];
      if (rel.emotionalReaction === undefined) {
        errs.push(createError([...path, 'emotionalReaction'], "Property 'emotionalReaction' is required"));
      } else if (rel.emotionalReaction !== null && !validEmotions.includes(rel.emotionalReaction)) {
        errs.push(createError([...path, 'emotionalReaction'], `Property 'emotionalReaction' must be null or one of: ${validEmotions.join(', ')}`));
      }

      if (rel.preferredDistance !== undefined && typeof rel.preferredDistance !== 'number') {
        errs.push(createError([...path, 'preferredDistance'], "Property 'preferredDistance' must be a number"));
      }

      if (rel.tension !== undefined && typeof rel.tension !== 'number') {
        errs.push(createError([...path, 'tension'], "Property 'tension' must be a number"));
      }

      return errs;
    }

    function validateRhythm(rhythm: any, path: (string | number)[]): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof rhythm !== 'object' || rhythm === null) {
        errs.push(createError(path, 'Expected object for rhythm'));
        return errs;
      }

      const validTempos = ['slow', 'medium', 'fast'];
      if (rhythm.tempo === undefined) {
        errs.push(createError([...path, 'tempo'], "Property 'tempo' is required"));
      } else if (!validTempos.includes(rhythm.tempo)) {
        errs.push(createError([...path, 'tempo'], `Property 'tempo' must be one of: ${validTempos.join(', ')}`));
      }

      if (rhythm.pauseFrequencyPerMinute === undefined) {
        errs.push(createError([...path, 'pauseFrequencyPerMinute'], "Property 'pauseFrequencyPerMinute' is required"));
      } else if (typeof rhythm.pauseFrequencyPerMinute !== 'number') {
        errs.push(createError([...path, 'pauseFrequencyPerMinute'], "Property 'pauseFrequencyPerMinute' must be a number"));
      }

      const validCurves = ['linear', 'ease-in', 'ease-out', 'sharp'];
      if (rhythm.motionEnergyCurve === undefined) {
        errs.push(createError([...path, 'motionEnergyCurve'], "Property 'motionEnergyCurve' is required"));
      } else if (!validCurves.includes(rhythm.motionEnergyCurve)) {
        errs.push(createError([...path, 'motionEnergyCurve'], `Property 'motionEnergyCurve' must be one of: ${validCurves.join(', ')}`));
      }

      return errs;
    }
  }
}
