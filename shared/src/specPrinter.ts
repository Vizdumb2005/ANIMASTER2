import { SceneGraph } from './scene.js';
import YAML from 'yaml';

export class SpecPrinter {
  static print(graph: SceneGraph): string {
    return YAML.stringify(graph, {
      sortMapEntries: true
    });
  }
}
