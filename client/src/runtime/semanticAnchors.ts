import type { Environment, SemanticAnchor } from '@animaster/shared/scene';

export function createDefaultAnchors(environment: Environment): SemanticAnchor[] {
  const floorY = environment.height * 0.67;
  const centerX = environment.width / 2;
  const edgeInset = environment.width * 0.12;

  const common: SemanticAnchor[] = [
    { id: 'anchor_center', type: 'center', label: 'Center', position: { x: centerX, y: floorY }, radius: 70, affordances: ['frame_subject', 'wait'] },
    { id: 'anchor_foreground', type: 'foreground', label: 'Foreground', position: { x: centerX, y: environment.height * 0.76 }, radius: 90, affordances: ['frame_subject', 'wait'] },
    { id: 'anchor_background', type: 'background', label: 'Background', position: { x: centerX, y: environment.height * 0.48 }, radius: 90, affordances: ['approach_from', 'frame_subject'] },
    { id: 'anchor_edge_left', type: 'edge', label: 'Left edge', position: { x: edgeInset, y: floorY }, radius: 70, affordances: ['enter', 'approach_from'] },
    { id: 'anchor_edge_right', type: 'edge', label: 'Right edge', position: { x: environment.width - edgeInset, y: floorY }, radius: 70, affordances: ['enter', 'approach_from'] }
  ];

  if (/street|outdoor|road|alley/i.test(environment.type)) {
    return [
      ...common,
      { id: 'anchor_streetlight', type: 'streetlight', label: 'Streetlight', position: { x: centerX - 60, y: floorY }, radius: 80, affordances: ['stand_under', 'wait', 'frame_subject'] },
      { id: 'anchor_entrance', type: 'entrance', label: 'Distant approach', position: { x: environment.width - edgeInset, y: floorY }, radius: 80, affordances: ['enter', 'approach_from'] }
    ];
  }

  return [
    ...common,
    { id: 'anchor_door', type: 'door', label: 'Door', position: { x: edgeInset, y: floorY }, radius: 70, affordances: ['enter', 'approach_from'] },
    { id: 'anchor_chair', type: 'chair', label: 'Chair', position: { x: centerX + 170, y: floorY }, radius: 70, affordances: ['sit', 'wait'] },
    { id: 'anchor_window', type: 'window', label: 'Window', position: { x: centerX + 230, y: environment.height * 0.36 }, radius: 70, affordances: ['look_out', 'frame_subject'] },
    { id: 'anchor_entrance', type: 'entrance', label: 'Entrance', position: { x: edgeInset, y: floorY }, radius: 70, affordances: ['enter', 'approach_from'] }
  ];
}

export function findAnchor(anchors: SemanticAnchor[] | undefined, idOrType: string): SemanticAnchor | undefined {
  return anchors?.find((anchor) => anchor.id === idOrType || anchor.type === idOrType);
}
