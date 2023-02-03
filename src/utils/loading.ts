import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import type { Card, Table } from "@/types";
import {
  newCardAngleInStack,
  newCardPositionInStack,
  organizeSideBySide,
} from "./stack";

export const fetchJson = <Type extends any>(src: string) =>
  fetch(src + "?rnd=" + Math.random()).then(
    (res) => res.json() as Promise<Type>
  );

export const loadTable = async (src: string) => {
  const table = await fetchJson<Table>(src);
  table.id = uuidv4();
  table.spriteSheets = {};
  table.cards = [];
  table.localScreen = 0;
  table.screenAmount = 1;
  table.open = true;

  for (const stack of table.stacks) {
    stack.id = uuidv4();
    stack.screen = 0;
    stack.tableId = table.id;
    stack.height = 0;
    stack.messinessRotation = 0;
    const cards: Card[] = [];

    if (stack.frontSpriteSheetSource && stack.backSpriteSheetSource) {
      if (!table.spriteSheets[stack.frontSpriteSheetSource])
        table.spriteSheets[stack.frontSpriteSheetSource] = await fetchJson(
          stack.frontSpriteSheetSource
        );
      if (!table.spriteSheets[stack.backSpriteSheetSource])
        table.spriteSheets[stack.backSpriteSheetSource] = await fetchJson(
          stack.backSpriteSheetSource
        );

      if (stack.deck)
        for (let i = 0; i < (stack.repeat || 1); i++)
          stack.deck.forEach(({ frontSprite, backSprite }) =>
            cards.push({
              id: uuidv4(),
              stackId: stack.id,
              frontSprite,
              backSprite,
              frontSpriteSheetSource: stack.frontSpriteSheetSource,
              backSpriteSheetSource: stack.backSpriteSheetSource,
              flipped: stack.flipped,
              flipping: false,
              moving: false,
            } as Card)
          );

      if (stack.shuffle) cards.sort(() => Math.random() - 0.5);

      let stackIndex = 0;
      cards.forEach((card) => {
        card.stackIndex = stackIndex++;
        card.rotation = newCardAngleInStack(stack);
        card.position = newCardPositionInStack(stack);
      });

      table.cards.push(...cards);

      if (stack.style == "side-by-side") organizeSideBySide(stack, table);
    }
  }

  return table;
};
