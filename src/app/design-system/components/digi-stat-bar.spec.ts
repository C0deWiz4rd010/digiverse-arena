import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { DigiStatBar } from './digi-stat-bar';
import { attributeColorVar } from './attribute-color';

@Component({
  imports: [DigiStatBar],
  template: `<digi-stat-bar label="HP" [value]="value" [max]="100" />`,
})
class HostComponent {
  value = 75;
}

describe('DigiStatBar', () => {
  it('renders the label and value', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.stat__label')?.textContent).toContain('HP');
    expect(el.querySelector('.stat__value')?.textContent).toContain('75');
  });

  it('clamps the fill width to a percentage of max', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value = 200;
    fixture.detectChanges();
    await fixture.whenStable();
    const fill = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.stat__fill');
    expect(fill?.style.width).toBe('100%');
  });
});

describe('attributeColorVar', () => {
  it('maps known attributes to themed CSS variables', () => {
    expect(attributeColorVar('Vaccine')).toBe('var(--color-vaccine)');
    expect(attributeColorVar('virus')).toBe('var(--color-virus)');
    expect(attributeColorVar('Data')).toBe('var(--color-data)');
    expect(attributeColorVar('Free')).toBe('var(--color-free)');
    expect(attributeColorVar('Variable')).toBe('var(--color-free)');
  });

  it('falls back to unknown for empty or unexpected values', () => {
    expect(attributeColorVar('')).toBe('var(--color-unknown)');
    expect(attributeColorVar(null)).toBe('var(--color-unknown)');
    expect(attributeColorVar('Mystery')).toBe('var(--color-unknown)');
  });
});
