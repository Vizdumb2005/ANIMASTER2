/**
 * Procedural Skyline Generator — creates silhouette cityscapes,
 * treelines, and horizon features for outdoor environments.
 */
import * as THREE from 'three';

export type SkylineType = 'city' | 'suburban' | 'forest' | 'mountain' | 'industrial';

interface BuildingDef {
  x: number;
  width: number;
  height: number;
  depth: number;
}

export class SkylineGenerator {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
  }

  generate(type: SkylineType, width: number = 40, distance: number = 20): THREE.Group {
    this.clear();

    switch (type) {
      case 'city':
        this.generateCity(width, distance);
        break;
      case 'suburban':
        this.generateSuburban(width, distance);
        break;
      case 'forest':
        this.generateForest(width, distance);
        break;
      case 'mountain':
        this.generateMountain(width, distance);
        break;
      case 'industrial':
        this.generateIndustrial(width, distance);
        break;
    }

    return this.group;
  }

  private generateCity(width: number, distance: number): void {
    const buildings: BuildingDef[] = [];
    let x = -width / 2;

    while (x < width / 2) {
      const w = 1.5 + Math.random() * 3;
      const h = 3 + Math.random() * 12;
      buildings.push({ x: x + w / 2, width: w, height: h, depth: 2 + Math.random() * 3 });
      x += w + Math.random() * 0.5;
    }

    for (const b of buildings) {
      const geom = new THREE.BoxGeometry(b.width, b.height, b.depth);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x111118 + Math.floor(Math.random() * 0x0a0a0a),
        roughness: 0.9,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(b.x, b.height / 2, -distance);
      this.group.add(mesh);

      if (Math.random() > 0.6) {
        const windowCount = Math.floor(b.height / 1.2);
        for (let i = 0; i < windowCount; i++) {
          if (Math.random() > 0.5) {
            const wg = new THREE.PlaneGeometry(0.2, 0.3);
            const wm = new THREE.MeshBasicMaterial({
              color: 0xffdd88,
              transparent: true,
              opacity: 0.3 + Math.random() * 0.4,
            });
            const win = new THREE.Mesh(wg, wm);
            win.position.set(
              b.x + (Math.random() - 0.5) * b.width * 0.6,
              i * 1.2 + 1,
              -distance + b.depth / 2 + 0.01
            );
            this.group.add(win);
          }
        }
      }
    }
  }

  private generateSuburban(width: number, distance: number): void {
    let x = -width / 2;
    while (x < width / 2) {
      const w = 3 + Math.random() * 2;
      const h = 2 + Math.random() * 2;
      const geom = new THREE.BoxGeometry(w, h, 3);
      const mat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.9 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x + w / 2, h / 2, -distance);
      this.group.add(mesh);

      const roofGeom = new THREE.ConeGeometry(w / 1.5, 1.5, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22 });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(x + w / 2, h + 0.75, -distance);
      roof.rotation.y = Math.PI / 4;
      this.group.add(roof);

      x += w + 2 + Math.random() * 3;
    }
  }

  private generateForest(width: number, distance: number): void {
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * width;
      const h = 4 + Math.random() * 6;
      const trunkGeom = new THREE.CylinderGeometry(0.1, 0.15, h, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(x, h / 2, -distance + (Math.random() - 0.5) * 4);
      this.group.add(trunk);

      const crownGeom = new THREE.SphereGeometry(1 + Math.random(), 6, 4);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0x1a3a15 + Math.floor(Math.random() * 0x0a1a0a),
        roughness: 1.0,
      });
      const crown = new THREE.Mesh(crownGeom, crownMat);
      crown.position.set(x, h, -distance + (Math.random() - 0.5) * 4);
      this.group.add(crown);
    }
  }

  private generateMountain(width: number, distance: number): void {
    for (let i = 0; i < 8; i++) {
      const x = (Math.random() - 0.5) * width;
      const h = 5 + Math.random() * 10;
      const geom = new THREE.ConeGeometry(3 + Math.random() * 4, h, 5);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x1a1a22 + Math.floor(Math.random() * 0x0a0a0a),
        roughness: 1.0,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, h / 2, -distance - Math.random() * 10);
      this.group.add(mesh);
    }
  }

  private generateIndustrial(width: number, distance: number): void {
    let x = -width / 2;
    while (x < width / 2) {
      const w = 3 + Math.random() * 5;
      const h = 4 + Math.random() * 6;
      const geom = new THREE.BoxGeometry(w, h, 4);
      const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.95 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x + w / 2, h / 2, -distance);
      this.group.add(mesh);

      if (Math.random() > 0.5) {
        const chimneyGeom = new THREE.CylinderGeometry(0.2, 0.3, 3, 6);
        const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x222230 });
        const chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
        chimney.position.set(x + w / 2 + 0.5, h + 1.5, -distance);
        this.group.add(chimney);
      }

      x += w + 1 + Math.random() * 2;
    }
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }
  }

  dispose(): void {
    this.clear();
  }
}
