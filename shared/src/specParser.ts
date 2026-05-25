import { Result, ok, err } from './result.js';
import { SceneGraph } from './scene.js';
import YAML from 'yaml';
import {
  ParseError,
  ParseErrorLocation,
  ACTOR_EMOTIONS,
  ACTOR_ACTIONS,
  CAMERA_MODES,
  SCENE_TONES,
  ATMOSPHERE_EFFECTS,
  RELATIONSHIP_TYPES,
  RHYTHM_TEMPOS,
  MOTION_ENERGY_CURVES,
} from './specSchema.js';

// Re-export ParseError so callers can import from one place.
export type { ParseError } from './specSchema.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatPath(path: (string | number)[]): string {
  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return index === 0 ? segment : `${acc}.${segment}`;
  }, '');
}

/** Sentinel location used when the YAML AST cannot resolve a position. */
const UNKNOWN_LOCATION: ParseErrorLocation = { line: 0, column: 0 };

// ---------------------------------------------------------------------------
// SpecParser
// ---------------------------------------------------------------------------

export class SpecParser {
  static parse(yamlStr: string): Result<SceneGraph, ParseError[]> {
    const lineCounter = new YAML.LineCounter();
    const doc = YAML.parseDocument(yamlStr, { lineCounter });

    // ── Phase 1: YAML syntax errors ──────────────────────────────────────
    if (doc.errors && doc.errors.length > 0) {
      const syntaxErrors: ParseError[] = doc.errors.map(e => {
        const raw =
          e.pos && e.pos.length > 0
            ? lineCounter.linePos(e.pos[0])
            : undefined;
        return {
          code: 'SYNTAX_ERROR' as const,
          location: raw
            ? { line: raw.line, column: raw.col }
            : UNKNOWN_LOCATION,
          message: e.message,
        };
      });
      return err(syntaxErrors);
    }

    let val: any;
    try {
      val = doc.toJS();
    } catch (e: any) {
      return err([
        {
          code: 'SYNTAX_ERROR',
          location: UNKNOWN_LOCATION,
          message: e.message || String(e),
        },
      ]);
    }

    // ── Phase 2: schema validation ────────────────────────────────────────

    /**
     * Walk the YAML AST to find the best source location for a given path.
     * If the exact node is missing (because the field is absent), we walk up
     * the path until we find an ancestor node with a range.
     */
    function locationFor(path: (string | number)[]): ParseErrorLocation {
      let node = doc.getIn(path, true) as YAML.Node | undefined;
      const probe = [...path];
      while (!node && probe.length > 0) {
        probe.pop();
        node = doc.getIn(probe, true) as YAML.Node | undefined;
      }
      if (node && 'range' in node && node.range) {
        const pos = lineCounter.linePos(
          (node.range as unknown as number[])[0],
        );
        return { line: pos.line, column: pos.col };
      }
      return UNKNOWN_LOCATION;
    }

    function missing(path: (string | number)[], label: string): ParseError {
      return {
        code: 'MISSING_REQUIRED',
        location: locationFor(path),
        message: `Property '${label}' is required`,
        context: formatPath(path),
      };
    }

    function outOfRange(path: (string | number)[], message: string): ParseError {
      return {
        code: 'OUT_OF_RANGE',
        location: locationFor(path),
        message,
        context: formatPath(path),
      };
    }

    const errors: ParseError[] = [];

    if (typeof val !== 'object' || val === null) {
      errors.push({
        code: 'SYNTAX_ERROR',
        location: UNKNOWN_LOCATION,
        message: 'Expected root object for SceneGraph',
      });
      return err(errors);
    }
    const validActorIds = new Set<string>();
    if (typeof val === 'object' && val !== null && Array.isArray(val.actors)) {
      val.actors.forEach((actor: unknown) => {
        if (actor && typeof actor === 'object' && 'id' in actor && typeof (actor as any).id === 'string') {
          validActorIds.add((actor as any).id);
        }
      });
    }

    // ── Root scalars ──────────────────────────────────────────────────────

    if (val.id === undefined) {
      errors.push(missing(['id'], 'id'));
    } else if (typeof val.id !== 'string') {
      errors.push(outOfRange(['id'], "Property 'id' must be a string"));
    }

    if (val.version === undefined) {
      errors.push(missing(['version'], 'version'));
    } else if (typeof val.version !== 'number') {
      errors.push(outOfRange(['version'], "Property 'version' must be a number"));
    } else if (val.version < 0) {
      errors.push(outOfRange(['version'], "Property 'version' must be at least 0"));
    }

    if (val.seed !== undefined && typeof val.seed !== 'number') {
      errors.push(outOfRange(['seed'], "Property 'seed' must be a number"));
    }

    // ── actors ────────────────────────────────────────────────────────────

    if (val.actors === undefined) {
      errors.push(missing(['actors'], 'actors'));
    } else if (!Array.isArray(val.actors)) {
      errors.push(outOfRange(['actors'], "Property 'actors' must be an array"));
    } else {
      val.actors.forEach((actor: unknown, idx: number) => {
        errors.push(...validateActor(actor, ['actors', idx]));
      });
    }

    // ── environment ───────────────────────────────────────────────────────

    if (val.environment === undefined) {
      errors.push(missing(['environment'], 'environment'));
    } else {
      errors.push(...validateEnvironment(val.environment, ['environment']));
    }

    // ── camera ────────────────────────────────────────────────────────────

    if (val.camera === undefined) {
      errors.push(missing(['camera'], 'camera'));
    } else {
      errors.push(...validateCamera(val.camera, ['camera']));
    }

    // ── sessionHistory ────────────────────────────────────────────────────

    if (val.sessionHistory === undefined) {
      errors.push(missing(['sessionHistory'], 'sessionHistory'));
    } else if (!Array.isArray(val.sessionHistory)) {
      errors.push(
        outOfRange(
          ['sessionHistory'],
          "Property 'sessionHistory' must be an array",
        ),
      );
    } else {
      val.sessionHistory.forEach((entry: unknown, idx: number) => {
        errors.push(
          ...validateSessionEntry(entry, ['sessionHistory', idx]),
        );
      });
    }

    // ── cinematicGrammar ──────────────────────────────────────────────────

    if (val.cinematicGrammar === undefined) {
      errors.push(missing(['cinematicGrammar'], 'cinematicGrammar'));
    } else {
      errors.push(
        ...validateCinematicGrammar(val.cinematicGrammar, [
          'cinematicGrammar',
        ]),
      );
    }

    // ── atmosphere ────────────────────────────────────────────────────────

    if (val.atmosphere === undefined) {
      errors.push(missing(['atmosphere'], 'atmosphere'));
    } else {
      errors.push(...validateAtmosphere(val.atmosphere, ['atmosphere']));
    }

    // ── relationships ─────────────────────────────────────────────────────

    if (val.relationships === undefined) {
      errors.push(missing(['relationships'], 'relationships'));
    } else if (!Array.isArray(val.relationships)) {
      errors.push(
        outOfRange(
          ['relationships'],
          "Property 'relationships' must be an array",
        ),
      );
    } else {
      val.relationships.forEach((rel: unknown, idx: number) => {
        errors.push(
          ...validateRelationship(rel, ['relationships', idx]),
        );
      });
    }

    // ── rhythm ────────────────────────────────────────────────────────────

    if (val.rhythm === undefined) {
      errors.push(missing(['rhythm'], 'rhythm'));
    } else {
      errors.push(...validateRhythm(val.rhythm, ['rhythm']));
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok(val as SceneGraph);

    // =========================================================================
    // Sub-validators
    // All enum constants are imported from specSchema.ts.
    // =========================================================================

    function validateVector2(
      v: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof v !== 'object' || v === null) {
        errs.push(outOfRange(path, 'Expected object for Vector2'));
        return errs;
      }
      const obj = v as Record<string, unknown>;
      if (obj.x === undefined) {
        errs.push(missing([...path, 'x'], 'x'));
      } else if (typeof obj.x !== 'number') {
        errs.push(outOfRange([...path, 'x'], "Property 'x' must be a number"));
      }
      if (obj.y === undefined) {
        errs.push(missing([...path, 'y'], 'y'));
      } else if (typeof obj.y !== 'number') {
        errs.push(outOfRange([...path, 'y'], "Property 'y' must be a number"));
      }
      return errs;
    }

    function validateJoints(
      joints: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof joints !== 'object' || joints === null) {
        errs.push(outOfRange(path, 'Expected object for joints'));
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
          errs.push({
            code: 'MISSING_REQUIRED',
            location: locationFor([...path, key]),
            message: `Property '${key}' is required in joints`,
            context: formatPath([...path, key]),
          });
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
        errs.push(outOfRange(path, 'Expected object for Actor'));
        return errs;
      }
      const a = actor as Record<string, unknown>;

      if (a.id === undefined) {
        errs.push(missing([...path, 'id'], 'id'));
      } else if (typeof a.id !== 'string') {
        errs.push(outOfRange([...path, 'id'], "Property 'id' must be a string"));
      }

      if (a.label === undefined) {
        errs.push(missing([...path, 'label'], 'label'));
      } else if (typeof a.label !== 'string') {
        errs.push(
          outOfRange([...path, 'label'], "Property 'label' must be a string"),
        );
      }

      if (a.type === undefined) {
        errs.push(missing([...path, 'type'], 'type'));
      } else if (a.type !== 'humanoid') {
        errs.push(
          outOfRange([...path, 'type'], "Property 'type' must be 'humanoid'"),
        );
      }

      if (a.position === undefined) {
        errs.push(missing([...path, 'position'], 'position'));
      } else {
        errs.push(...validateVector2(a.position, [...path, 'position']));
      }

      if (a.targetPosition === undefined) {
        errs.push(missing([...path, 'targetPosition'], 'targetPosition'));
      } else if (a.targetPosition !== null) {
        errs.push(
          ...validateVector2(a.targetPosition, [...path, 'targetPosition']),
        );
      }

      if (a.emotionState === undefined) {
        errs.push(missing([...path, 'emotionState'], 'emotionState'));
      } else if (!ACTOR_EMOTIONS.includes(a.emotionState as never)) {
        errs.push(
          outOfRange(
            [...path, 'emotionState'],
            `Property 'emotionState' must be one of: ${ACTOR_EMOTIONS.join(', ')}`,
          ),
        );
      }

      if (a.emotionIntensity !== undefined) {
        if (typeof a.emotionIntensity !== 'number') {
          errs.push(
            outOfRange(
              [...path, 'emotionIntensity'],
              "Property 'emotionIntensity' must be a number",
            ),
          );
        } else if (a.emotionIntensity < 0 || a.emotionIntensity > 1) {
          errs.push(
            outOfRange(
              [...path, 'emotionIntensity'],
              "Property 'emotionIntensity' must be between 0 and 1",
            ),
          );
        }
      }

      if (a.currentAction === undefined) {
        errs.push(missing([...path, 'currentAction'], 'currentAction'));
      } else if (!ACTOR_ACTIONS.includes(a.currentAction as never)) {
        errs.push(
          outOfRange(
            [...path, 'currentAction'],
            `Property 'currentAction' must be one of: ${ACTOR_ACTIONS.join(', ')}`,
          ),
        );
      }

      if (a.actionQueue === undefined) {
        errs.push(missing([...path, 'actionQueue'], 'actionQueue'));
      } else if (!Array.isArray(a.actionQueue)) {
        errs.push(
          outOfRange(
            [...path, 'actionQueue'],
            "Property 'actionQueue' must be an array",
          ),
        );
      } else {
        a.actionQueue.forEach((act: unknown, idx: number) => {
          if (!ACTOR_ACTIONS.includes(act as never)) {
            errs.push(
              outOfRange(
                [...path, 'actionQueue', idx],
                `Action must be one of: ${ACTOR_ACTIONS.join(', ')}`,
              ),
            );
          }
        });
      }

      if (a.joints === undefined) {
        errs.push(missing([...path, 'joints'], 'joints'));
      } else {
        errs.push(...validateJoints(a.joints, [...path, 'joints']));
      }

      if (a.actionElapsed === undefined) {
        errs.push(missing([...path, 'actionElapsed'], 'actionElapsed'));
      } else if (typeof a.actionElapsed !== 'number') {
        errs.push(
          outOfRange(
            [...path, 'actionElapsed'],
            "Property 'actionElapsed' must be a number",
          ),
        );
      } else if (a.actionElapsed < 0) {
        errs.push(
          outOfRange(
            [...path, 'actionElapsed'],
            "Property 'actionElapsed' must be at least 0",
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
        errs.push(outOfRange(path, 'Expected object for environment'));
        return errs;
      }
      const e = env as Record<string, unknown>;
      const stringKeys = ['type', 'backgroundColor', 'floorColor', 'wallColor'];
      const numberKeys = ['width', 'height'];

      stringKeys.forEach(key => {
        if (e[key] === undefined) {
          errs.push(missing([...path, key], key));
        } else if (typeof e[key] !== 'string') {
          errs.push(
            outOfRange([...path, key], `Property '${key}' must be a string`),
          );
        }
      });

      numberKeys.forEach(key => {
        if (e[key] === undefined) {
          errs.push(missing([...path, key], key));
        } else if (typeof e[key] !== 'number') {
          errs.push(
            outOfRange([...path, key], `Property '${key}' must be a number`),
          );
        } else if ((e[key] as number) < 1) {
          errs.push(
            outOfRange([...path, key], `Property '${key}' must be at least 1`),
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
        errs.push(outOfRange(path, 'Expected object for camera'));
        return errs;
      }
      const c = cam as Record<string, unknown>;
      const numberKeys = ['x', 'y', 'zoom'];
      numberKeys.forEach(key => {
        if (c[key] === undefined) {
          errs.push(missing([...path, key], key));
        } else if (typeof c[key] !== 'number') {
          errs.push(
            outOfRange([...path, key], `Property '${key}' must be a number`),
          );
        } else if (key === 'zoom' && (c[key] as number) < 0) {
          errs.push(
            outOfRange([...path, key], "Property 'zoom' must be at least 0"),
          );
        }
      });

      if (c.mode === undefined) {
        errs.push(missing([...path, 'mode'], 'mode'));
      } else if (!CAMERA_MODES.includes(c.mode as never)) {
        errs.push(
          outOfRange(
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
        errs.push(outOfRange(path, 'Expected object for sessionHistory entry'));
        return errs;
      }
      const en = entry as Record<string, unknown>;

      if (en.id === undefined) {
        errs.push(missing([...path, 'id'], 'id'));
      } else if (typeof en.id !== 'string') {
        errs.push(
          outOfRange([...path, 'id'], "Property 'id' must be a string"),
        );
      }

      if (en.prompt === undefined) {
        errs.push(missing([...path, 'prompt'], 'prompt'));
      } else if (typeof en.prompt !== 'string') {
        errs.push(
          outOfRange([...path, 'prompt'], "Property 'prompt' must be a string"),
        );
      }

      if (en.createdAt === undefined) {
        errs.push(missing([...path, 'createdAt'], 'createdAt'));
      } else if (typeof en.createdAt !== 'number') {
        errs.push(
          outOfRange(
            [...path, 'createdAt'],
            "Property 'createdAt' must be a number",
          ),
        );
      } else if (en.createdAt < 0) {
        errs.push(
          outOfRange(
            [...path, 'createdAt'],
            "Property 'createdAt' must be at least 0",
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
        errs.push(outOfRange(path, 'Expected object for template'));
        return errs;
      }
      const t = tmpl as Record<string, unknown>;

      if (t.cameraMode === undefined) {
        errs.push(missing([...path, 'cameraMode'], 'cameraMode'));
      } else if (!CAMERA_MODES.includes(t.cameraMode as never)) {
        errs.push(
          outOfRange(
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
          errs.push(missing([...path, key], key));
        } else if (typeof t[key] !== 'number') {
          errs.push(
            outOfRange([...path, key], `Property '${key}' must be a number`),
          );
        } else if (key === 'pauseFrequency' && (t[key] as number) < 0) {
          errs.push(
            outOfRange([...path, key], "Property 'pauseFrequency' must be at least 0"),
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
        errs.push(outOfRange(path, 'Expected object for cinematicGrammar'));
        return errs;
      }
      const g = cg as Record<string, unknown>;

      if (g.tone === undefined) {
        errs.push(missing([...path, 'tone'], 'tone'));
      } else if (!SCENE_TONES.includes(g.tone as never)) {
        errs.push(
          outOfRange(
            [...path, 'tone'],
            `Property 'tone' must be one of: ${SCENE_TONES.join(', ')}`,
          ),
        );
      }

      if (g.template === undefined) {
        errs.push(missing([...path, 'template'], 'template'));
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
        errs.push(outOfRange(path, 'Expected object for atmosphere'));
        return errs;
      }
      const a = at as Record<string, unknown>;

      if (a.effects === undefined) {
        errs.push(missing([...path, 'effects'], 'effects'));
      } else if (!Array.isArray(a.effects)) {
        errs.push(
          outOfRange(
            [...path, 'effects'],
            "Property 'effects' must be an array",
          ),
        );
      } else {
        a.effects.forEach((eff: unknown, idx: number) => {
          if (!ATMOSPHERE_EFFECTS.includes(eff as never)) {
            errs.push(
              outOfRange(
                [...path, 'effects', idx],
                `Effect must be one of: ${ATMOSPHERE_EFFECTS.join(', ')}`,
              ),
            );
          }
        });
      }

      if (a.lightingTint === undefined) {
        errs.push(missing([...path, 'lightingTint'], 'lightingTint'));
      } else if (typeof a.lightingTint !== 'string') {
        errs.push(
          outOfRange(
            [...path, 'lightingTint'],
            "Property 'lightingTint' must be a string",
          ),
        );
      }

      if (a.ambientIntensity === undefined) {
        errs.push(missing([...path, 'ambientIntensity'], 'ambientIntensity'));
      } else if (typeof a.ambientIntensity !== 'number') {
        errs.push(
          outOfRange(
            [...path, 'ambientIntensity'],
            "Property 'ambientIntensity' must be a number",
          ),
        );
      } else if (a.ambientIntensity < 0 || a.ambientIntensity > 1) {
        errs.push(
          outOfRange(
            [...path, 'ambientIntensity'],
            "Property 'ambientIntensity' must be between 0 and 1",
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
        errs.push(outOfRange(path, 'Expected object for relationship'));
        return errs;
      }
      const r = rel as Record<string, unknown>;

      if (r.actorAId === undefined) {
        errs.push(missing([...path, 'actorAId'], 'actorAId'));
      } else if (typeof r.actorAId !== 'string') {
        errs.push(
          outOfRange(
            [...path, 'actorAId'],
            "Property 'actorAId' must be a string",
          ),
        );
      } else if (!validActorIds.has(r.actorAId)) {
        errs.push({
          code: 'UNDEFINED_REFERENCE',
          location: locationFor([...path, 'actorAId']),
          message: `Actor ID '${r.actorAId}' in relationship actorAId is not defined in actors`,
          context: formatPath([...path, 'actorAId']),
        });
      }

      if (r.actorBId === undefined) {
        errs.push(missing([...path, 'actorBId'], 'actorBId'));
      } else if (typeof r.actorBId !== 'string') {
        errs.push(
          outOfRange(
            [...path, 'actorBId'],
            "Property 'actorBId' must be a string",
          ),
        );
      } else if (!validActorIds.has(r.actorBId)) {
        errs.push({
          code: 'UNDEFINED_REFERENCE',
          location: locationFor([...path, 'actorBId']),
          message: `Actor ID '${r.actorBId}' in relationship actorBId is not defined in actors`,
          context: formatPath([...path, 'actorBId']),
        });
      }

      if (r.type === undefined) {
        errs.push(missing([...path, 'type'], 'type'));
      } else if (!RELATIONSHIP_TYPES.includes(r.type as never)) {
        errs.push(
          outOfRange(
            [...path, 'type'],
            `Property 'type' must be one of: ${RELATIONSHIP_TYPES.join(', ')}`,
          ),
        );
      }

      if (r.awarenessRadius === undefined) {
        errs.push(missing([...path, 'awarenessRadius'], 'awarenessRadius'));
      } else if (typeof r.awarenessRadius !== 'number') {
        errs.push(
          outOfRange(
            [...path, 'awarenessRadius'],
            "Property 'awarenessRadius' must be a number",
          ),
        );
      } else if (r.awarenessRadius < 0) {
        errs.push(
          outOfRange(
            [...path, 'awarenessRadius'],
            "Property 'awarenessRadius' must be at least 0",
          ),
        );
      }

      if (r.gazeTarget === undefined) {
        errs.push(missing([...path, 'gazeTarget'], 'gazeTarget'));
      } else if (r.gazeTarget !== null && typeof r.gazeTarget !== 'string') {
        errs.push(
          outOfRange(
            [...path, 'gazeTarget'],
            "Property 'gazeTarget' must be string or null",
          ),
        );
      } else if (typeof r.gazeTarget === 'string' && !validActorIds.has(r.gazeTarget)) {
        errs.push({
          code: 'UNDEFINED_REFERENCE',
          location: locationFor([...path, 'gazeTarget']),
          message: `Actor ID '${r.gazeTarget}' in relationship gazeTarget is not defined in actors`,
          context: formatPath([...path, 'gazeTarget']),
        });
      }


      if (r.emotionalReaction === undefined) {
        errs.push(
          missing([...path, 'emotionalReaction'], 'emotionalReaction'),
        );
      } else if (
        r.emotionalReaction !== null &&
        !ACTOR_EMOTIONS.includes(r.emotionalReaction as never)
      ) {
        errs.push(
          outOfRange(
            [...path, 'emotionalReaction'],
            `Property 'emotionalReaction' must be null or one of: ${ACTOR_EMOTIONS.join(', ')}`,
          ),
        );
      }

      if (r.preferredDistance !== undefined) {
        if (typeof r.preferredDistance !== 'number') {
          errs.push(
            outOfRange(
              [...path, 'preferredDistance'],
              "Property 'preferredDistance' must be a number",
            ),
          );
        } else if (r.preferredDistance < 0) {
          errs.push(
            outOfRange(
              [...path, 'preferredDistance'],
              "Property 'preferredDistance' must be at least 0",
            ),
          );
        }
      }

      if (r.tension !== undefined) {
        if (typeof r.tension !== 'number') {
          errs.push(
            outOfRange([...path, 'tension'], "Property 'tension' must be a number"),
          );
        } else if (r.tension < 0 || r.tension > 1) {
          errs.push(
            outOfRange([...path, 'tension'], "Property 'tension' must be between 0 and 1"),
          );
        }
      }

      return errs;
    }

    function validateRhythm(
      rhythm: unknown,
      path: (string | number)[],
    ): ParseError[] {
      const errs: ParseError[] = [];
      if (typeof rhythm !== 'object' || rhythm === null) {
        errs.push(outOfRange(path, 'Expected object for rhythm'));
        return errs;
      }
      const r = rhythm as Record<string, unknown>;

      if (r.tempo === undefined) {
        errs.push(missing([...path, 'tempo'], 'tempo'));
      } else if (!RHYTHM_TEMPOS.includes(r.tempo as never)) {
        errs.push(
          outOfRange(
            [...path, 'tempo'],
            `Property 'tempo' must be one of: ${RHYTHM_TEMPOS.join(', ')}`,
          ),
        );
      }

      if (r.pauseFrequencyPerMinute === undefined) {
        errs.push(
          missing([...path, 'pauseFrequencyPerMinute'], 'pauseFrequencyPerMinute'),
        );
      } else if (typeof r.pauseFrequencyPerMinute !== 'number') {
        errs.push(
          outOfRange(
            [...path, 'pauseFrequencyPerMinute'],
            "Property 'pauseFrequencyPerMinute' must be a number",
          ),
        );
      } else if (r.pauseFrequencyPerMinute < 0) {
        errs.push(
          outOfRange(
            [...path, 'pauseFrequencyPerMinute'],
            "Property 'pauseFrequencyPerMinute' must be at least 0",
          ),
        );
      }

      if (r.motionEnergyCurve === undefined) {
        errs.push(missing([...path, 'motionEnergyCurve'], 'motionEnergyCurve'));
      } else if (!MOTION_ENERGY_CURVES.includes(r.motionEnergyCurve as never)) {
        errs.push(
          outOfRange(
            [...path, 'motionEnergyCurve'],
            `Property 'motionEnergyCurve' must be one of: ${MOTION_ENERGY_CURVES.join(', ')}`,
          ),
        );
      }

      return errs;
    }
  }
}
