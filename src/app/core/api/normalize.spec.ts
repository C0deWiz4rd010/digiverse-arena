import { describe, expect, it } from 'vitest';
import { normalizeDigimon, normalizeDigimonList, normalizeMetaList } from './normalize';
import { digimonDetailSchema, digimonListResponseSchema, metaListResponseSchema } from './schemas';
import { primaryDescription } from '../models/digimon';

const rawDetail = {
  id: 1,
  name: 'Agumon',
  xAntibody: false,
  images: [{ href: 'https://x/Agumon.png', transparent: false }],
  levels: [{ id: 4, level: 'Child' }],
  types: [{ id: 1, type: 'Reptile' }],
  attributes: [{ id: 4, attribute: 'Vaccine' }],
  fields: [{ id: 8, field: 'Deep Savers', image: 'https://x/Deep_Savers.png' }],
  releaseDate: '1997',
  descriptions: [
    { origin: 'reference_book', language: 'jap', description: 'JP text' },
    { origin: 'reference_book', language: 'en_us', description: 'EN text' },
  ],
  skills: [{ id: 1, skill: 'Baby Flame', translation: '', description: 'Fire breath.' }],
  priorEvolutions: [
    { id: 36, digimon: 'Koromon', condition: '', image: 'https://x/Koromon.png', url: '' },
  ],
  nextEvolutions: [
    {
      id: 34,
      digimon: 'Greymon',
      condition: 'with Gabumon',
      image: 'https://x/Greymon.png',
      url: '',
    },
  ],
};

describe('normalizeDigimon', () => {
  it('parses and normalizes a raw detail payload', () => {
    const d = normalizeDigimon(digimonDetailSchema.parse(rawDetail));
    expect(d.id).toBe(1);
    expect(d.image).toBe('https://x/Agumon.png');
    expect(d.levels[0]).toEqual({ id: 4, name: 'Child' });
    expect(d.attributes[0]).toEqual({ id: 4, name: 'Vaccine' });
    expect(d.fields[0]).toEqual({ id: 8, name: 'Deep Savers', image: 'https://x/Deep_Savers.png' });
    expect(d.skills[0].name).toBe('Baby Flame');
    expect(d.nextEvolutions[0]).toEqual({
      id: 34,
      name: 'Greymon',
      condition: 'with Gabumon',
      image: 'https://x/Greymon.png',
    });
  });

  it('prefers the English description', () => {
    const d = normalizeDigimon(digimonDetailSchema.parse(rawDetail));
    expect(primaryDescription(d)).toBe('EN text');
  });

  it('tolerates missing optional fields via schema defaults', () => {
    const d = normalizeDigimon(digimonDetailSchema.parse({ id: 9, name: 'Test' }));
    expect(d.image).toBeNull();
    expect(d.levels).toEqual([]);
    expect(d.descriptions).toEqual([]);
  });
});

describe('normalizeDigimonList', () => {
  it('maps content and 0-indexed pageable', () => {
    const page = normalizeDigimonList(
      digimonListResponseSchema.parse({
        content: [{ id: 1, name: 'Agumon', href: '', image: 'https://x/Agumon.png' }],
        pageable: { currentPage: 0, elementsOnPage: 1, totalElements: 1488, totalPages: 743 },
      }),
    );
    expect(page.items[0]).toEqual({ id: 1, name: 'Agumon', image: 'https://x/Agumon.png' });
    expect(page.page).toBe(0);
    expect(page.totalElements).toBe(1488);
  });
});

describe('normalizeMetaList', () => {
  it('flattens metadata fields', () => {
    const meta = normalizeMetaList(
      metaListResponseSchema.parse({
        content: {
          name: 'Attribute',
          description: '',
          fields: [
            { id: 4, name: 'Vaccine' },
            { id: 3, name: 'Virus' },
          ],
        },
        pageable: { currentPage: 0, elementsOnPage: 2, totalElements: 7, totalPages: 1 },
      }),
    );
    expect(meta).toEqual([
      { id: 4, name: 'Vaccine' },
      { id: 3, name: 'Virus' },
    ]);
  });
});
