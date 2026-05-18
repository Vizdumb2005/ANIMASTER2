import { Container, Graphics } from 'pixi.js';
import type { StoryAnchor } from '@animaster/shared/scene';

export function drawStoryAnchors(layer: Container, anchors: StoryAnchor[]) {
  for (const anchor of anchors) {
    const g = new Graphics();
    const color = 0x334455;
    const alpha = 0.35;

    switch (anchor.type) {
      case 'bench':
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y, anchor.width, anchor.height * 0.4)
          .fill({ color, alpha });
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y - anchor.height * 0.6, 4, anchor.height * 0.6)
          .fill({ color, alpha });
        g.rect(anchor.position.x + anchor.width / 2 - 4, anchor.position.y - anchor.height * 0.6, 4, anchor.height * 0.6)
          .fill({ color, alpha });
        break;

      case 'window_silhouette':
      case 'rain_window':
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y - anchor.height / 2, anchor.width, anchor.height)
          .fill({ color: 0x223344, alpha: 0.25 });
        g.rect(anchor.position.x - 1, anchor.position.y - anchor.height / 2, 2, anchor.height)
          .fill({ color, alpha: 0.4 });
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y - 1, anchor.width, 2)
          .fill({ color, alpha: 0.4 });
        break;

      case 'doorway':
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y - anchor.height * 0.5, anchor.width, anchor.height)
          .fill({ color: 0x1a1a2e, alpha: 0.3 });
        g.rect(anchor.position.x - anchor.width / 2 - 3, anchor.position.y - anchor.height * 0.5, 3, anchor.height)
          .fill({ color, alpha: 0.45 });
        g.rect(anchor.position.x + anchor.width / 2, anchor.position.y - anchor.height * 0.5, 3, anchor.height)
          .fill({ color, alpha: 0.45 });
        break;

      case 'hallway':
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y - anchor.height * 0.3, anchor.width, anchor.height)
          .fill({ color: 0x111122, alpha: 0.2 });
        break;

      case 'corner_wall':
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y - anchor.height * 0.4, anchor.width, anchor.height)
          .fill({ color, alpha: 0.4 });
        break;

      case 'streetlight_silhouette':
        g.rect(anchor.position.x - 2, anchor.position.y, 4, anchor.height)
          .fill({ color, alpha: 0.4 });
        g.circle(anchor.position.x, anchor.position.y, 6)
          .fill({ color: 0x998866, alpha: 0.2 });
        break;

      case 'skyline':
        for (let i = 0; i < 6; i++) {
          const bx = anchor.position.x - anchor.width / 2 + i * 52;
          const bh = 15 + (i % 3) * 12;
          g.rect(bx, anchor.position.y - bh, 40, bh)
            .fill({ color, alpha: 0.2 });
        }
        break;

      case 'rooftop_ledge':
        g.rect(anchor.position.x - anchor.width / 2, anchor.position.y, anchor.width, anchor.height)
          .fill({ color, alpha: 0.35 });
        break;
    }

    layer.addChild(g);
  }
}
