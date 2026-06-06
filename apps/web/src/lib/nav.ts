import { getCollection } from 'astro:content';

export const SECTION_ORDER = [
  'Getting started',
  'Writing evals',
  'Tooling',
  'Going further',
];

export interface NavItem {
  slug: string;
  title: string;
}
export interface NavSection {
  section: string;
  items: NavItem[];
}

export async function getDocsNav(): Promise<NavSection[]> {
  const entries = await getCollection('docs');
  const bySection = new Map<string, NavItem[]>();
  for (const entry of entries) {
    const items = bySection.get(entry.data.section) ?? [];
    items.push({ slug: entry.id, title: entry.data.title });
    bySection.set(entry.data.section, items);
  }
  for (const items of bySection.values()) {
    items.sort((a, b) => {
      const ea = entries.find((e) => e.id === a.slug)!.data.order;
      const eb = entries.find((e) => e.id === b.slug)!.data.order;
      return ea - eb;
    });
  }
  return SECTION_ORDER.filter((s) => bySection.has(s)).map((section) => ({
    section,
    items: bySection.get(section)!,
  }));
}

export async function getFlatDocs(): Promise<NavItem[]> {
  const nav = await getDocsNav();
  return nav.flatMap((s) => s.items);
}
