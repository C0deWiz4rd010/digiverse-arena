import { z } from 'zod';

/**
 * Zod schemas for the RAW DAPI response shapes (validation boundary only).
 * Fields are kept permissive (defaults / nullable) because the API is occasionally inconsistent.
 * See docs/04-api-data-model.md and docs/api-samples/.
 */

export const pageableSchema = z.object({
  currentPage: z.number().default(0),
  elementsOnPage: z.number().default(0),
  totalElements: z.number().default(0),
  totalPages: z.number().default(0),
  previousPage: z.string().default(''),
  nextPage: z.string().default(''),
});

export const digimonListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  href: z.string().optional().default(''),
  image: z.string().nullish(),
});

export const digimonListResponseSchema = z.object({
  content: z.array(digimonListItemSchema).default([]),
  pageable: pageableSchema,
});

const imageSchema = z.object({
  href: z.string(),
  transparent: z.boolean().default(false),
});

const levelSchema = z.object({ id: z.number(), level: z.string() });
const typeSchema = z.object({ id: z.number(), type: z.string() });
const attributeSchema = z.object({ id: z.number(), attribute: z.string() });
const fieldSchema = z.object({ id: z.number(), field: z.string(), image: z.string().nullish() });
const descriptionSchema = z.object({
  origin: z.string().default(''),
  language: z.string().default(''),
  description: z.string().default(''),
});
const skillSchema = z.object({
  id: z.number(),
  skill: z.string(),
  translation: z.string().default(''),
  description: z.string().default(''),
});
const evolutionSchema = z.object({
  id: z.number(),
  digimon: z.string(),
  condition: z.string().default(''),
  image: z.string().nullish(),
  url: z.string().optional().default(''),
});

export const digimonDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  xAntibody: z.boolean().default(false),
  images: z.array(imageSchema).default([]),
  levels: z.array(levelSchema).default([]),
  types: z.array(typeSchema).default([]),
  attributes: z.array(attributeSchema).default([]),
  fields: z.array(fieldSchema).default([]),
  releaseDate: z.string().nullish(),
  descriptions: z.array(descriptionSchema).default([]),
  skills: z.array(skillSchema).default([]),
  priorEvolutions: z.array(evolutionSchema).default([]),
  nextEvolutions: z.array(evolutionSchema).default([]),
});

const metaFieldSchema = z.object({ id: z.number(), name: z.string() });

export const metaListResponseSchema = z.object({
  content: z.object({
    name: z.string().default(''),
    description: z.string().default(''),
    fields: z.array(metaFieldSchema).default([]),
  }),
  pageable: pageableSchema,
});

export type RawDigimonListResponse = z.infer<typeof digimonListResponseSchema>;
export type RawDigimonDetail = z.infer<typeof digimonDetailSchema>;
export type RawMetaListResponse = z.infer<typeof metaListResponseSchema>;
