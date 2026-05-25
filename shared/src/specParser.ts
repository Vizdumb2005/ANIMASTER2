import { Result, ok, err } from './result.js';
import { SceneGraph } from './scene.js';
import YAML from 'yaml';
import {
  ACTOR_EMOTIONS,
  ACTOR_ACTIONS,
  CAMERA_MODES,
  SCENE_TONES,
  ATMOSPHERE_EFFECTS,
  RELATIONSHIP_TYPES,
  RHYTHM_TEMPOS,
  MOTION_ENERGY_CURVES,
} from './specSchema.js';

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
        const lineCol =
          e.pos && e.pos.length > 0
            ? lineCounter.linePos(e.pos[0])
            : { line: undefined, col: undefined };
        return {
          message: e.message,
          line: lineCol.line,
          column: lineCol.col,
        };
      });
      return err(parseErrors);
    }

    const val = doc.toJS();

    function getLineColForPath(
      path: (string | number)[],
    ): { line?: number; column?: number } {
      let node = doc.getIn(path, true) as YAML.Node | undefined;
      const currentPath = [...path];
      while (!node && currentPath.length > 0) {
        currentPath.pop();
        node = doc.getIn(currentPath, true) as YAML.Node | undefined;
      }
      if (node && 'range' in node && node.range) {
        const pos = lineCounter.linePos((node.range as unknown as number[])[0]);
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
        column: lineCol.column,
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
      val.actors.forEach((actor: unknown, idx: number) => {
        errors.push(...validateActor(actor, ['actors', idx]));
      });
    }

    // environment: Environment
    if (val.environment === undefined) {
      errors.push(
        createError(['environment'], "Property 'environment' is required"),
      );
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
      errors.push(
        createError(
          ['sessionHistory'],
          "Property 'sessionHistory' is required",
        ),
      );
    } else if (!Array.isArray(val.sessionHistory)) {
      errors.push(
        createError(
          ['sessionHistory'],
          "Property 'sessionHistory' must be an array",
        ),
      );
    } else {
      val.sessionHistory.forEach((entry: unknown, idx: number) => {
        errors.push(...validateSessionEntry(entry, ['sessionHistory', idx]));
      });
    }

    // cinematicGrammar: CinematicGrammar
    if (val.cinematicGrammar === undefined) {
      errors.push(
        createError(
          ['cinematicGrammar'],
          "Property 'cinematicGrammar' is required",
        ),
      );
    } else {
      errors.push(
        ...validateCinematicGrammar(val.cinematicGrammar, ['cinematicGrammar']),
      );
    }

    // atmosphere: AtmosphereProfile
    if (val.atmosphere === undefined) {
      errors.push(
        createError(['atmosphere'], "Property 'atmosphere' is required"),
      );
    } else {
      errors.push(...validateAtmosphere(val.atmosphere, ['atmosphere']));
    }

    // relationships: CharacterRelationship[]
    if (val.relationships === undefined) {
      errors.push(
        createError(
          ['relationships'],
          "Property 'relationships' is required",
        ),
      );
    } else if (!Array.isArray(val.relationships)) {
      errors.push(
        createError(
          ['relationships'],
          "Property 'relationships' must be an array",
        ),
      );
    } else {
      val.relationships.forEach((rel: unknown, idx: number) => {
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

    // -------------------------------------------------------------------------
    // Helpers — all enum constants come from specSchema.ts
    // -------------------------------------------------------------------------

    function validateVector2(
      v: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof v !== 'object' || v === null) {
        errs.push(createError(path, 'Expected object for Vector2'));
        return errs;
      }
      const obj = v as Record<string, unknown>;
      if (obj.x === undefined) {
        errs.push(createError([...path, 'x'], "Property 'x' is required"));
      } else if (typeof obj.x !== 'number') {
        errs.push(createError([...path, 'x'], "Property 'x' must be a number"));
      }
      if (obj.y === undefined) {
        errs.push(createError([...path, 'y'], "Property 'y' is required"));
      } else if (typeof obj.y !== 'number') {
        errs.push(createError([...path, 'y'], "Property 'y' must be a number"));
      }
      return errs;
    }

    function validateJoints(
      joints: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof joints !== 'object' || joints === null) {
        errs.push(createError(path, 'Expected object for joints'));
        return errs;
      }
      const obj = joints as Record<string, unknown>;
      const jointKeys = [
        'head',
        'torso',
        'leftArm',
        'rightArm',
        'leftLeg',
        'rightLeg',
      ] as const;
      jointKeys.forEach(key => {
        if (obj[key] === undefined) {
          errs.push(
            createError(
              [...path, key],
              `Property '${key}' is required in joints`,
            ),
          );
        } else {
          errs.push(...validateVector2(obj[key], [...path, key]));
        }
      });
      return errs;
    }

    function validateActor(
      actor: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof actor !== 'object' || actor === null) {
        errs.push(createError(path, 'Expected object for Actor'));
        return errs;
      }
      const a = actor as Record<string, unknown>;

      if (a.id === undefined) {
        errs.push(createError([...path, 'id'], "Property 'id' is required"));
      } else if (typeof a.id !== 'string') {
        errs.push(
          createError([...path, 'id'], "Property 'id' must be a string"),
        );
      }

      if (a.label === undefined) {
        errs.push(
          createError([...path, 'label'], "Property 'label' is required"),
        );
      } else if (typeof a.label !== 'string') {
        errs.push(
          createError([...path, 'label'], "Property 'label' must be a string"),
        );
      }

      if (a.type === undefined) {
        errs.push(
          createError([...path, 'type'], "Property 'type' is required"),
        );
      } else if (a.type !== 'humanoid') {
        errs.push(
          createError([...path, 'type'], "Property 'type' must be 'humanoid'"),
        );
      }

      if (a.position === undefined) {
        errs.push(
          createError(
            [...path, 'position'],
            "Property 'position' is required",
          ),
        );
      } else {
        errs.push(...validateVector2(a.position, [...path, 'position']));
      }

      if (a.targetPosition === undefined) {
        errs.push(
          createError(
            [...path, 'targetPosition'],
            "Property 'targetPosition' is required",
          ),
        );
      } else if (a.targetPosition !== null) {
        errs.push(
          ...validateVector2(a.targetPosition, [...path, 'targetPosition']),
        );
      }

      // ACTOR_EMOTIONS from specSchema
      if (a.emotionState === undefined) {
        errs.push(
          createError(
            [...path, 'emotionState'],
            "Property 'emotionState' is required",
          ),
        );
      } else if (!ACTOR_EMOTIONS.includes(a.emotionState as never)) {
        errs.push(
          createError(
            [...path, 'emotionState'],
            `Property 'emotionState' must be one of: ${ACTOR_EMOTIONS.join(', ')}`,
          ),
        );
      }

      // ACTOR_ACTIONS from specSchema
      if (a.currentAction === undefined) {
        errs.push(
          createError(
            [...path, 'currentAction'],
            "Property 'currentAction' is required",
          ),
        );
      } else if (!ACTOR_ACTIONS.includes(a.currentAction as never)) {
        errs.push(
          createError(
            [...path, 'currentAction'],
            `Property 'currentAction' must be one of: ${ACTOR_ACTIONS.join(', ')}`,
          ),
        );
      }

      if (a.actionQueue === undefined) {
        errs.push(
          createError(
            [...path, 'actionQueue'],
            "Property 'actionQueue' is required",
          ),
        );
      } else if (!Array.isArray(a.actionQueue)) {
        errs.push(
          createError(
            [...path, 'actionQueue'],
            "Property 'actionQueue' must be an array",
          ),
        );
      } else {
        a.actionQueue.forEach((act: unknown, idx: number) => {
          if (!ACTOR_ACTIONS.includes(act as never)) {
            errs.push(
              createError(
                [...path, 'actionQueue', idx],
                `Action must be one of: ${ACTOR_ACTIONS.join(', ')}`,
              ),
            );
          }
        });
      }

      if (a.joints === undefined) {
        errs.push(
          createError([...path, 'joints'], "Property 'joints' is required"),
        );
      } else {
        errs.push(...validateJoints(a.joints, [...path, 'joints']));
      }

      if (a.actionElapsed === undefined) {
        errs.push(
          createError(
            [...path, 'actionElapsed'],
            "Property 'actionElapsed' is required",
          ),
        );
      } else if (typeof a.actionElapsed !== 'number') {
        errs.push(
          createError(
            [...path, 'actionElapsed'],
            "Property 'actionElapsed' must be a number",
          ),
        );
      }

      return errs;
    }

    function validateEnvironment(
      env: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof env !== 'object' || env === null) {
        errs.push(createError(path, 'Expected object for environment'));
        return errs;
      }
      const e = env as Record<string, unknown>;
      const stringKeys = ['type', 'backgroundColor', 'floorColor', 'wallColor'];
      const numberKeys = ['width', 'height'];

      stringKeys.forEach(key => {
        if (e[key] === undefined) {
          errs.push(
            createError([...path, key], `Property '${key}' is required`),
          );
        } else if (typeof e[key] !== 'string') {
          errs.push(
            createError([...path, key], `Property '${key}' must be a string`),
          );
        }
      });

      numberKeys.forEach(key => {
        if (e[key] === undefined) {
          errs.push(
            createError([...path, key], `Property '${key}' is required`),
          );
        } else if (typeof e[key] !== 'number') {
          errs.push(
            createError([...path, key], `Property '${key}' must be a number`),
          );
        }
      });

      return errs;
    }

    function validateCamera(
      cam: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof cam !== 'object' || cam === null) {
        errs.push(createError(path, 'Expected object for camera'));
        return errs;
      }
      const c = cam as Record<string, unknown>;
      const numberKeys = ['x', 'y', 'zoom'];
      numberKeys.forEach(key => {
        if (c[key] === undefined) {
          errs.push(
            createError([...path, key], `Property '${key}' is required`),
          );
        } else if (typeof c[key] !== 'number') {
          errs.push(
            createError([...path, key], `Property '${key}' must be a number`),
          );
        }
      });

      // CAMERA_MODES from specSchema
      if (c.mode === undefined) {
        errs.push(
          createError([...path, 'mode'], "Property 'mode' is required"),
        );
      } else if (!CAMERA_MODES.includes(c.mode as never)) {
        errs.push(
          createError(
            [...path, 'mode'],
            `Property 'mode' must be one of: ${CAMERA_MODES.join(', ')}`,
          ),
        );
      }

      return errs;
    }

    function validateSessionEntry(
      entry: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof entry !== 'object' || entry === null) {
        errs.push(
          createError(path, 'Expected object for sessionHistory entry'),
        );
        return errs;
      }
      const en = entry as Record<string, unknown>;
      if (en.id === undefined) {
        errs.push(createError([...path, 'id'], "Property 'id' is required"));
      } else if (typeof en.id !== 'string') {
        errs.push(
          createError([...path, 'id'], "Property 'id' must be a string"),
        );
      }

      if (en.prompt === undefined) {
        errs.push(
          createError([...path, 'prompt'], "Property 'prompt' is required"),
        );
      } else if (typeof en.prompt !== 'string') {
        errs.push(
          createError(
            [...path, 'prompt'],
            "Property 'prompt' must be a string",
          ),
        );
      }

      if (en.createdAt === undefined) {
        errs.push(
          createError(
            [...path, 'createdAt'],
            "Property 'createdAt' is required",
          ),
        );
      } else if (typeof en.createdAt !== 'number') {
        errs.push(
          createError(
            [...path, 'createdAt'],
            "Property 'createdAt' must be a number",
          ),
        );
      }

      return errs;
    }

    function validateCinematicTemplate(
      tmpl: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof tmpl !== 'object' || tmpl === null) {
        errs.push(createError(path, 'Expected object for template'));
        return errs;
      }
      const t = tmpl as Record<string, unknown>;

      // CAMERA_MODES from specSchema
      if (t.cameraMode === undefined) {
        errs.push(
          createError(
            [...path, 'cameraMode'],
            "Property 'cameraMode' is required",
          ),
        );
      } else if (!CAMERA_MODES.includes(t.cameraMode as never)) {
        errs.push(
          createError(
            [...path, 'cameraMode'],
            `Property 'cameraMode' must be one of: ${CAMERA_MODES.join(', ')}`,
          ),
        );
      }

      const numberKeys = [
        'spacingMultiplier',
        'motionEnergyScale',
        'pauseFrequency',
        'contrastBoost',
        'headroom',
      ];
      numberKeys.forEach(key => {
        if (t[key] === undefined) {
          errs.push(
            createError([...path, key], `Property '${key}' is required`),
          );
        } else if (typeof t[key] !== 'number') {
          errs.push(
            createError([...path, key], `Property '${key}' must be a number`),
          );
        }
      });

      return errs;
    }

    function validateCinematicGrammar(
      cg: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof cg !== 'object' || cg === null) {
        errs.push(createError(path, 'Expected object for cinematicGrammar'));
        return errs;
      }
      const g = cg as Record<string, unknown>;

      // SCENE_TONES from specSchema
      if (g.tone === undefined) {
        errs.push(
          createError([...path, 'tone'], "Property 'tone' is required"),
        );
      } else if (!SCENE_TONES.includes(g.tone as never)) {
        errs.push(
          createError(
            [...path, 'tone'],
            `Property 'tone' must be one of: ${SCENE_TONES.join(', ')}`,
          ),
        );
      }

      if (g.template === undefined) {
        errs.push(
          createError([...path, 'template'], "Property 'template' is required"),
        );
      } else {
        errs.push(
          ...validateCinematicTemplate(g.template, [...path, 'template']),
        );
      }

      return errs;
    }

    function validateAtmosphere(
      at: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof at !== 'object' || at === null) {
        errs.push(createError(path, 'Expected object for atmosphere'));
        return errs;
      }
      const a = at as Record<string, unknown>;

      if (a.effects === undefined) {
        errs.push(
          createError([...path, 'effects'], "Property 'effects' is required"),
        );
      } else if (!Array.isArray(a.effects)) {
        errs.push(
          createError(
            [...path, 'effects'],
            "Property 'effects' must be an array",
          ),
        );
      } else {
        // ATMOSPHERE_EFFECTS from specSchema
        a.effects.forEach((eff: unknown, idx: number) => {
          if (!ATMOSPHERE_EFFECTS.includes(eff as never)) {
            errs.push(
              createError(
                [...path, 'effects', idx],
                `Effect must be one of: ${ATMOSPHERE_EFFECTS.join(', ')}`,
              ),
            );
          }
        });
      }

      if (a.lightingTint === undefined) {
        errs.push(
          createError(
            [...path, 'lightingTint'],
            "Property 'lightingTint' is required",
          ),
        );
      } else if (typeof a.lightingTint !== 'string') {
        errs.push(
          createError(
            [...path, 'lightingTint'],
            "Property 'lightingTint' must be a string",
          ),
        );
      }

      if (a.ambientIntensity === undefined) {
        errs.push(
          createError(
            [...path, 'ambientIntensity'],
            "Property 'ambientIntensity' is required",
          ),
        );
      } else if (typeof a.ambientIntensity !== 'number') {
        errs.push(
          createError(
            [...path, 'ambientIntensity'],
            "Property 'ambientIntensity' must be a number",
          ),
        );
      }

      return errs;
    }

    function validateRelationship(
      rel: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof rel !== 'object' || rel === null) {
        errs.push(createError(path, 'Expected object for relationship'));
        return errs;
      }
      const r = rel as Record<string, unknown>;

      if (r.actorAId === undefined) {
        errs.push(
          createError(
            [...path, 'actorAId'],
            "Property 'actorAId' is required",
          ),
        );
      } else if (typeof r.actorAId !== 'string') {
        errs.push(
          createError(
            [...path, 'actorAId'],
            "Property 'actorAId' must be a string",
          ),
        );
      }

      if (r.actorBId === undefined) {
        errs.push(
          createError(
            [...path, 'actorBId'],
            "Property 'actorBId' is required",
          ),
        );
      } else if (typeof r.actorBId !== 'string') {
        errs.push(
          createError(
            [...path, 'actorBId'],
            "Property 'actorBId' must be a string",
          ),
        );
      }

      // RELATIONSHIP_TYPES from specSchema
      if (r.type === undefined) {
        errs.push(
          createError([...path, 'type'], "Property 'type' is required"),
        );
      } else if (!RELATIONSHIP_TYPES.includes(r.type as never)) {
        errs.push(
          createError(
            [...path, 'type'],
            `Property 'type' must be one of: ${RELATIONSHIP_TYPES.join(', ')}`,
          ),
        );
      }

      if (r.awarenessRadius === undefined) {
        errs.push(
          createError(
            [...path, 'awarenessRadius'],
            "Property 'awarenessRadius' is required",
          ),
        );
      } else if (typeof r.awarenessRadius !== 'number') {
        errs.push(
          createError(
            [...path, 'awarenessRadius'],
            "Property 'awarenessRadius' must be a number",
          ),
        );
      }

      if (r.gazeTarget === undefined) {
        errs.push(
          createError(
            [...path, 'gazeTarget'],
            "Property 'gazeTarget' is required",
          ),
        );
      } else if (r.gazeTarget !== null && typeof r.gazeTarget !== 'string') {
        errs.push(
          createError(
            [...path, 'gazeTarget'],
            "Property 'gazeTarget' must be string or null",
          ),
        );
      }

      // ACTOR_EMOTIONS from specSchema (nullable)
      if (r.emotionalReaction === undefined) {
        errs.push(
          createError(
            [...path, 'emotionalReaction'],
            "Property 'emotionalReaction' is required",
          ),
        );
      } else if (
        r.emotionalReaction !== null &&
        !ACTOR_EMOTIONS.includes(r.emotionalReaction as never)
      ) {
        errs.push(
          createError(
            [...path, 'emotionalReaction'],
            `Property 'emotionalReaction' must be null or one of: ${ACTOR_EMOTIONS.join(', ')}`,
          ),
        );
      }

      if (
        r.preferredDistance !== undefined &&
        typeof r.preferredDistance !== 'number'
      ) {
        errs.push(
          createError(
            [...path, 'preferredDistance'],
            "Property 'preferredDistance' must be a number",
          ),
        );
      }

      if (r.tension !== undefined && typeof r.tension !== 'number') {
        errs.push(
          createError(
            [...path, 'tension'],
            "Property 'tension' must be a number",
          ),
        );
      }

      return errs;
    }

    function validateRhythm(
      rhythm: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof rhythm !== 'object' || rhythm === null) {
        errs.push(createError(path, 'Expected object for rhythm'));
        return errs;
      }
      const r = rhythm as Record<string, unknown>;

      // RHYTHM_TEMPOS from specSchema
      if (r.tempo === undefined) {
        errs.push(
          createError([...path, 'tempo'], "Property 'tempo' is required"),
        );
      } else if (!RHYTHM_TEMPOS.includes(r.tempo as never)) {
        errs.push(
          createError(
            [...path, 'tempo'],
            `Property 'tempo' must be one of: ${RHYTHM_TEMPOS.join(', ')}`,
          ),
        );
      }

      if (r.pauseFrequencyPerMinute === undefined) {
        errs.push(
          createError(
            [...path, 'pauseFrequencyPerMinute'],
            "Property 'pauseFrequencyPerMinute' is required",
          ),
        );
      } else if (typeof r.pauseFrequencyPerMinute !== 'number') {
        errs.push(
          createError(
            [...path, 'pauseFrequencyPerMinute'],
            "Property 'pauseFrequencyPerMinute' must be a number",
          ),
        );
      }

      // MOTION_ENERGY_CURVES from specSchema
      if (r.motionEnergyCurve === undefined) {
        errs.push(
          createError(
            [...path, 'motionEnergyCurve'],
            "Property 'motionEnergyCurve' is required",
          ),
        );
      } else if (!MOTION_ENERGY_CURVES.includes(r.motionEnergyCurve as never)) {
        errs.push(
          createError(
            [...path, 'motionEnergyCurve'],
            `Property 'motionEnergyCurve' must be one of: ${MOTION_ENERGY_CURVES.join(', ')}`,
          ),
        );
      }

      return errs;
    }
  }
}
