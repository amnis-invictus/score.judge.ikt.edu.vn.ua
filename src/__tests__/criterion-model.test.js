/**
 * Tests for Criterion model and buildCriteria function
 */
import { buildCriteria } from '../models/criterion';

describe('Criterion Model', () => {
  test('should build simple criteria without hierarchy', () => {
    const props = [
      { id: 'c1', name: 'Correctness', limit: 50, position: 0 },
      { id: 'c2', name: 'Performance', limit: 30, position: 1 }
    ];
    
    const [criteria, headerRows] = buildCriteria(props, 1, 1);
    
    expect(criteria).toHaveLength(2);
    expect(criteria[0].id).toBe('c1');
    expect(criteria[0].limit).toBe(50);
    expect(criteria[1].id).toBe('c2');
    expect(criteria[1].limit).toBe(30);
    
    // Check header rows structure
    expect(headerRows).toBeDefined();
    expect(headerRows.length).toBeGreaterThan(0);
  });

  test('should handle criteria with "/" for hierarchical grouping', () => {
    const props = [
      { id: 'c1', name: 'Group 1 / Sub 1', limit: 10, position: 0 },
      { id: 'c2', name: 'Group 1 / Sub 2', limit: 15, position: 1 },
      { id: 'c3', name: 'Group 2 / Sub 1', limit: 20, position: 2 },
      { id: 'c4', name: 'Group 2 / Sub 2', limit: 25, position: 3 },
      { id: 'c5', name: 'Group 2 / Sub 3', limit: 30, position: 4 }
    ];
    
    const [criteria, headerRows] = buildCriteria(props, 1, 1);
    
    // Check that all criteria are processed
    expect(criteria).toHaveLength(5);
    
    // Check that name levels are split correctly
    expect(criteria[0].nameLevels).toEqual(['Group 1', 'Sub 1']);
    expect(criteria[1].nameLevels).toEqual(['Group 1', 'Sub 2']);
    expect(criteria[2].nameLevels).toEqual(['Group 2', 'Sub 1']);
    expect(criteria[3].nameLevels).toEqual(['Group 2', 'Sub 2']);
    expect(criteria[4].nameLevels).toEqual(['Group 2', 'Sub 3']);
    
    // Check header rows are created for hierarchy
    expect(headerRows.length).toBeGreaterThanOrEqual(2);
    
    // First row should contain #, Код, and group headers
    const firstRow = headerRows[0];
    expect(firstRow.some(cell => cell.text === '#')).toBe(true);
    expect(firstRow.some(cell => cell.text === 'Код')).toBe(true);
    expect(firstRow.some(cell => cell.text === 'Group 1')).toBe(true);
    expect(firstRow.some(cell => cell.text === 'Group 2')).toBe(true);
    
    // Check Group 1 has correct colspan (2 subcriteria)
    const group1Cell = firstRow.find(cell => cell.text === 'Group 1');
    expect(group1Cell.colSpan).toBe(2);
    
    // Check Group 2 has correct colspan (3 subcriteria)
    const group2Cell = firstRow.find(cell => cell.text === 'Group 2');
    expect(group2Cell.colSpan).toBe(3);
    
    // Second row should contain sub-criteria
    const secondRow = headerRows[1];
    expect(secondRow.some(cell => cell && cell.text === 'Sub 1')).toBe(true);
    expect(secondRow.some(cell => cell && cell.text === 'Sub 2')).toBe(true);
    expect(secondRow.some(cell => cell && cell.text === 'Sub 3')).toBe(true);
  });

  test('should handle mixed depth criteria with "/"', () => {
    const props = [
      { id: 'c1', name: 'Simple', limit: 10, position: 0 },
      { id: 'c2', name: 'Group / Sub', limit: 20, position: 1 }
    ];
    
    const [criteria, headerRows] = buildCriteria(props, 1, 1);
    
    expect(criteria[0].nameLevels).toEqual(['Simple']);
    expect(criteria[1].nameLevels).toEqual(['Group', 'Sub']);
    
    // Should have at least 2 header rows for mixed depth
    expect(headerRows.length).toBeGreaterThanOrEqual(2);
  });

  test('should calculate sum and result correctly', () => {
    const props = [
      { id: 'c1', name: 'Criterion 1', limit: 25, position: 0 },
      { id: 'c2', name: 'Criterion 2', limit: 35, position: 1 },
      { id: 'c3', name: 'Criterion 3', limit: 40, position: 2 }
    ];
    
    const rmNumerator = 2;
    const rmDenominator = 5;
    
    const [, headerRows] = buildCriteria(props, rmNumerator, rmDenominator);
    
    // Last row should contain limit values
    const lastRow = headerRows[headerRows.length - 1];
    
    // Find sum and result cells
    const sumCell = lastRow.find(cell => cell.key === 'id_sum');
    const resultCell = lastRow.find(cell => cell.key === 'id_result');
    
    expect(sumCell).toBeDefined();
    expect(resultCell).toBeDefined();
    
    // Sum should be 25 + 35 + 40 = 100
    expect(sumCell.text).toBe(100);
    
    // Result should be 100 * 2 / 5 = 40
    expect(resultCell.text).toBe(40);
  });

  test('should apply colors to criteria groups', () => {
    const props = [
      { id: 'c1', name: 'Group 1 / Sub 1', limit: 10, position: 0 },
      { id: 'c2', name: 'Group 1 / Sub 2', limit: 15, position: 1 },
      { id: 'c3', name: 'Group 2 / Sub 1', limit: 20, position: 2 }
    ];
    
    const [criteria] = buildCriteria(props, 1, 1);
    
    // Criteria in same group should have same color
    expect(criteria[0].className).toBe(criteria[1].className);
    
    // Different groups should have different colors
    expect(criteria[0].className).not.toBe(criteria[2].className);
  });

  test('should handle criteria with multiple levels deep', () => {
    const props = [
      { id: 'c1', name: 'Level 1 / Level 2 / Level 3', limit: 10, position: 0 }
    ];
    
    const [criteria, headerRows] = buildCriteria(props, 1, 1);
    
    expect(criteria[0].nameLevels).toEqual(['Level 1', 'Level 2', 'Level 3']);
    expect(headerRows.length).toBeGreaterThanOrEqual(3);
  });

  test('should trim whitespace from criterion names with "/"', () => {
    const props = [
      { id: 'c1', name: 'Group A  /  Sub A  ', limit: 10, position: 0 }
    ];
    
    const [criteria] = buildCriteria(props, 1, 1);
    
    expect(criteria[0].nameLevels).toEqual(['Group A', 'Sub A']);
  });

  test('should handle result multiplier with default denominator', () => {
    const props = [
      { id: 'c1', name: 'Test', limit: 50, position: 0 }
    ];
    
    const [, headerRows] = buildCriteria(props, 3, 1);
    
    const lastRow = headerRows[headerRows.length - 1];
    const resultCell = lastRow.find(cell => cell.key === 'id_result');
    
    // Result should be 50 * 3 / 1 = 150
    expect(resultCell.text).toBe(150);
  });
});
