import type { Table } from "@/types";

export const getSpriteSheet = (source: string, table: Table) =>
  table.spriteSheets[source] || null;
