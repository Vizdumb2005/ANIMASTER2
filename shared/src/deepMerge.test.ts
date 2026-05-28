/**
 * shared/src/deepMerge.test.ts
 *
 * Tests for deep merge utility - sparse mutation patches.
 */

import { describe, it, expect } from 'vitest';
import { deepMerge, applyPatch, createPatch, type MergeOptions } from './deepMerge.js';

describe('deepMerge', () => {
  describe('basic object merging', () => {
    it('should merge simple properties', () => {
      const target = { name: 'Alice', age: 30 };
      const patch = { age: 31 };

      const result = deepMerge(target, patch);

      expect(result).toEqual({ name: 'Alice', age: 31 });
    });

    it('should add new properties from patch', () => {
      const target = { name: 'Alice' };
      const patch = { age: 30 };

      const result = deepMerge(target, patch);

      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should not mutate the original target', () => {
      const target = { name: 'Alice', age: 30 };
      const patch = { age: 31 };

      deepMerge(target, patch);

      expect(target).toEqual({ name: 'Alice', age: 30 });
    });

    it('should not mutate the original patch', () => {
      const target = { name: 'Alice' };
      const patch = { age: 30 };

      deepMerge(target, patch);

      expect(patch).toEqual({ age: 30 });
    });
  });

  describe('nested object merging', () => {
    it('should recursively merge nested objects', () => {
      const target = {
        user: {
          name: 'Alice',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      };
      const patch = {
        user: {
          address: {
            zip: '10002'
          }
        }
      };

      const result = deepMerge(target, patch);

      expect(result).toEqual({
        user: {
          name: 'Alice',
          address: {
            city: 'New York',
            zip: '10002'
          }
        }
      });
    });

    it('should preserve nested properties not in patch', () => {
      const target = {
        user: {
          name: 'Alice',
          age: 30,
          preferences: {
            theme: 'dark',
            language: 'en'
          }
        }
      };
      const patch = {
        user: {
          age: 31
        }
      };

      const result = deepMerge(target, patch);

      expect(result.user.name).toBe('Alice');
      expect(result.user.age).toBe(31);
      expect(result.user.preferences).toEqual({
        theme: 'dark',
        language: 'en'
      });
    });

    it('should add new nested objects from patch', () => {
      const target = { name: 'Alice' };
      const patch = {
        metadata: {
          createdAt: '2024-01-01',
          version: 1
        }
      };

      const result = deepMerge(target, patch);

      expect(result).toEqual({
        name: 'Alice',
        metadata: {
          createdAt: '2024-01-01',
          version: 1
        }
      });
    });
  });

  describe('array merging by ID', () => {
    it('should merge arrays of objects by id field', () => {
      const target = {
        actors: [
          { id: 'a1', name: 'Alice', emotion: 'neutral' },
          { id: 'a2', name: 'Bob', emotion: 'happy' }
        ]
      };
      const patch = {
        actors: [
          { id: 'a1', emotion: 'sad' }
        ]
      };

      const result = deepMerge(target, patch);

      expect(result.actors).toEqual([
        { id: 'a1', name: 'Alice', emotion: 'sad' },
        { id: 'a2', name: 'Bob', emotion: 'happy' }
      ]);
    });

    it('should add new items to arrays by ID', () => {
      const target = {
        actors: [
          { id: 'a1', name: 'Alice' }
        ]
      };
      const patch = {
        actors: [
          { id: 'a2', name: 'Bob' }
        ]
      };

      const result = deepMerge(target, patch);

      expect(result.actors).toEqual([
        { id: 'a1', name: 'Alice' },
        { id: 'a2', name: 'Bob' }
      ]);
    });

    it('should support custom ID fields', () => {
      const target = {
        items: [
          { key: 'i1', value: 'first' },
          { key: 'i2', value: 'second' }
        ]
      };
      const patch = {
        items: [
          { key: 'i1', value: 'updated' }
        ]
      };

      const result = deepMerge(target, patch, { idField: 'key' });

      expect(result.items).toEqual([
        { key: 'i1', value: 'updated' },
        { key: 'i2', value: 'second' }
      ]);
    });

    it('should replace arrays entirely when mergeArrays is false', () => {
      const target = {
        items: [
          { id: 'i1', value: 'first' },
          { id: 'i2', value: 'second' }
        ]
      };
      const patch = {
        items: [
          { id: 'i3', value: 'third' }
        ]
      };

      const result = deepMerge(target, patch, { mergeArrays: false });

      expect(result.items).toEqual([
        { id: 'i3', value: 'third' }
      ]);
    });

    it('should handle arrays with nested objects by ID', () => {
      const target = {
        actors: [
          {
            id: 'a1',
            name: 'Alice',
            position: { x: 0, y: 0 }
          }
        ]
      };
      const patch = {
        actors: [
          {
            id: 'a1',
            position: { x: 10, y: 20 }
          }
        ]
      };

      const result = deepMerge(target, patch);

      expect(result.actors).toEqual([
        { id: 'a1', name: 'Alice', position: { x: 10, y: 20 } }
      ]);
    });
  });

  describe('null and undefined handling', () => {
    it('should set fields to null when patch contains null', () => {
      const target = { name: 'Alice', age: 30 };
      const patch = { age: null };

      const result = deepMerge(target, patch);

      expect(result.age).toBeNull();
      expect(result.name).toBe('Alice');
    });

    it('should preserve original values when patch contains undefined (default)', () => {
      const target = { name: 'Alice', age: 30 };
      const patch = { age: undefined };

      const result = deepMerge(target, patch);

      expect(result.age).toBe(30);
    });

    it('should delete fields when patch contains undefined and deleteOnUndefined is true', () => {
      const target = { name: 'Alice', age: 30 };
      const patch = { age: undefined };

      const result = deepMerge(target, patch, { deleteOnUndefined: true });

      expect('age' in result).toBe(false);
      expect(result).toEqual({ name: 'Alice' });
    });

    it('should handle null in nested objects', () => {
      const target = {
        user: {
          name: 'Alice',
          metadata: {
            tags: ['admin']
          }
        }
      };
      const patch = {
        user: {
          metadata: null
        }
      };

      const result = deepMerge(target, patch);

      expect(result.user.metadata).toBeNull();
      expect(result.user.name).toBe('Alice');
    });

    it('should return null when patch is null', () => {
      const target = { name: 'Alice' };
      const patch = null as unknown as Partial<typeof target>;

      const result = deepMerge(target, patch);

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const target = {};
      const patch = { name: 'Alice' };

      const result = deepMerge(target, patch);

      expect(result).toEqual({ name: 'Alice' });
    });

    it('should handle empty patches', () => {
      const target = { name: 'Alice', age: 30 };
      const patch = {};

      const result = deepMerge(target, patch);

      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should handle empty arrays', () => {
      const target = { items: [] };
      const patch = { items: [{ id: 'i1', name: 'Item 1' }] };

      const result = deepMerge(target, patch);

      expect(result.items).toEqual([{ id: 'i1', name: 'Item 1' }]);
    });

    it('should handle arrays of primitives', () => {
      const target = { tags: ['old', 'tags'] };
      const patch = { tags: ['new', 'tags'] };

      const result = deepMerge(target, patch);

      expect(result.tags).toEqual(['new', 'tags']);
    });

    it('should handle deeply nested structures', () => {
      const target = {
        level1: {
          level2: {
            level3: {
              value: 'original'
            }
          }
        }
      };
      const patch = {
        level1: {
          level2: {
            level3: {
              value: 'updated'
            }
          }
        }
      };

      const result = deepMerge(target, patch);

      expect(result.level1.level2.level3.value).toBe('updated');
    });
  });

  describe('cycle detection', () => {
    it('should throw on circular references in patch', () => {
      const target = { name: 'Alice' };
      const patch: Record<string, unknown> = { age: 30 };
      patch.self = patch; // Create circular reference

      expect(() => deepMerge(target, patch)).toThrow('Circular reference detected');
    });

    it('should throw on circular references in target', () => {
      const target: Record<string, unknown> = { name: 'Alice' };
      target.self = target; // Create circular reference
      const patch = { age: 30 };

      expect(() => deepMerge(target, patch)).toThrow('Circular reference detected');
    });
  });

  describe('type preservation', () => {
    it('should preserve number types', () => {
      const target = { count: 0, price: 9.99 };
      const patch = { count: 5 };

      const result = deepMerge(target, patch);

      expect(typeof result.count).toBe('number');
      expect(result.count).toBe(5);
      expect(result.price).toBe(9.99);
    });

    it('should preserve boolean types', () => {
      const target = { active: true, visible: false };
      const patch = { active: false };

      const result = deepMerge(target, patch);

      expect(typeof result.active).toBe('boolean');
      expect(result.active).toBe(false);
      expect(result.visible).toBe(false);
    });

    it('should handle Date objects gracefully', () => {
      const date = new Date('2024-01-01');
      const target = { createdAt: date };
      const patch = { name: 'Alice' };

      const result = deepMerge(target, patch);

      expect(result.createdAt).toBe(date); // Same reference, not cloned
      expect(result.name).toBe('Alice');
    });
  });
});

describe('applyPatch', () => {
  it('should be a convenience wrapper for deepMerge', () => {
    const target = { name: 'Alice', age: 30 };
    const patch = { age: 31 };

    const result = applyPatch(target, patch);

    expect(result).toEqual({ name: 'Alice', age: 31 });
  });

  it('should pass options through to deepMerge', () => {
    const target = { name: 'Alice', age: 30 };
    const patch = { age: undefined };

    const result = applyPatch(target, patch, { deleteOnUndefined: true });

    expect('age' in result).toBe(false);
  });
});

describe('createPatch', () => {
  it('should create a type-safe partial patch', () => {
    interface Character {
      id: string;
      name: string;
      emotion: string;
      intensity: number;
    }

    const patch = createPatch<Character>({
      emotion: 'happy',
      intensity: 0.8
    });

    expect(patch).toEqual({
      emotion: 'happy',
      intensity: 0.8
    });
  });
});

describe('real-world use cases', () => {
  it('should handle SceneGraph-like mutations', () => {
    const target = {
      id: 'scene-1',
      version: 1,
      actors: [
        {
          id: 'actor-1',
          name: 'Hero',
          emotion: 'neutral',
          position: { x: 100, y: 200 }
        },
        {
          id: 'actor-2',
          name: 'Villain',
          emotion: 'angry',
          position: { x: 300, y: 200 }
        }
      ],
      atmosphere: {
        effects: ['fog'],
        lightingTint: '#ffffff'
      }
    };

    const patch = {
      version: 2,
      actors: [
        {
          id: 'actor-1',
          emotion: 'happy',
          position: { x: 150, y: 200 }
        }
      ],
      atmosphere: {
        effects: ['fog', 'rain']
      }
    };

    const result = deepMerge(target, patch);

    expect(result.version).toBe(2);
    expect(result.actors).toEqual([
      {
        id: 'actor-1',
        name: 'Hero',
        emotion: 'happy',
        position: { x: 150, y: 200 }
      },
      {
        id: 'actor-2',
        name: 'Villain',
        emotion: 'angry',
        position: { x: 300, y: 200 }
      }
    ]);
    expect(result.atmosphere).toEqual({
      effects: ['fog', 'rain'],
      lightingTint: '#ffffff'
    });
  });

  it('should handle relationship updates', () => {
    const target = {
      relationships: [
        {
          actorAId: 'a1',
          actorBId: 'a2',
          type: 'stranger',
          tension: 0
        }
      ]
    };

    const patch = {
      relationships: [
        {
          actorAId: 'a1',
          actorBId: 'a2',
          type: 'confronting',
          tension: 0.8
        }
      ]
    };

    const result = deepMerge(target, patch, { idField: 'actorAId' });

    expect(result.relationships).toEqual([
      {
        actorAId: 'a1',
        actorBId: 'a2',
        type: 'confronting',
        tension: 0.8
      }
    ]);
  });
});
