/**
 * Tests for RoundRobinIterator utility
 */
import RoundRobinIterator from '../utils/round-robin-iterator';

describe('RoundRobinIterator', () => {
  test('should initialize with undefined current value', () => {
    const iterator = new RoundRobinIterator(['a', 'b', 'c']);
    expect(iterator.current).toBeUndefined();
  });

  test('should iterate through values in order', () => {
    const iterator = new RoundRobinIterator(['a', 'b', 'c']);
    
    expect(iterator.next()).toBe('a');
    expect(iterator.current).toBe('a');
    
    expect(iterator.next()).toBe('b');
    expect(iterator.current).toBe('b');
    
    expect(iterator.next()).toBe('c');
    expect(iterator.current).toBe('c');
  });

  test('should wrap around to beginning after reaching end', () => {
    const iterator = new RoundRobinIterator(['x', 'y']);
    
    expect(iterator.next()).toBe('x');
    expect(iterator.next()).toBe('y');
    expect(iterator.next()).toBe('x');
    expect(iterator.next()).toBe('y');
  });

  test('should handle single value array', () => {
    const iterator = new RoundRobinIterator(['only']);
    
    expect(iterator.next()).toBe('only');
    expect(iterator.next()).toBe('only');
    expect(iterator.next()).toBe('only');
  });

  test('should work with numeric values', () => {
    const iterator = new RoundRobinIterator([1, 2, 3]);
    
    expect(iterator.next()).toBe(1);
    expect(iterator.next()).toBe(2);
    expect(iterator.next()).toBe(3);
    expect(iterator.next()).toBe(1);
  });
});
