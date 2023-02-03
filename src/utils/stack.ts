import { v4 as uuidv4 } from "uuid";
import type { Card, Stack, Table } from "@/types";
import { getSpriteSheet } from "./spritesheet";
import { waitTimeout } from "./time";
import { screenScale } from "./screen";

export const createStack = (stack: Partial<Stack>, table: Table) => {
  table.stacks.push({
    position: { x: 0, y: 0 },
    rotation: 0,
    style: "simple",
    screen: 0,
    taking: "one",
    elevation: 2,
    messinessRotation: 0,
    flipped: false,
    ...stack,
    tableId: table.id,
    id: uuidv4(),
    height: 0,
  });
};
export const getStack = (id: string, table: Table) =>
  table.stacks.find((x) => x.id == id) || null;

export const getStackFromScreen = (
  screen: number,
  table: Table,
  name?: string
) => {
  const stacks = table.stacks.filter((stack) => stack.screen == screen);
  return (
    stacks.find((stack) => (name ? stack.name == name : stack.defaultStack)) ||
    null
  );
};

export const newCardPositionInStack = (stack: Stack) => {
  stack.height += stack.elevation * (0.5 + Math.abs(Math.random() * 0.5));
  return {
    x: stack.position.x + Math.random() * stack.elevation * 4,
    y: stack.position.y - stack.height,
  };
};

export const newCardAngleInStack = (stack: Stack) => {
  const messiness = 40;
  const minAngle = 35;
  if (stack.style == "messy")
    stack.messinessRotation = Math.round(
      stack.messinessRotation +
        minAngle +
        (messiness - minAngle) * Math.random()
    );
  return (stack.rotation + stack.messinessRotation) % 360;
};

export const organizeStackCards = (stack: Stack, table: Table) => {
  if (stack.autoArrange) autoArrange(stack, table);
  if (stack.style == "side-by-side") organizeSideBySide(stack, table);
};

export const autoArrange = (stack: Stack, table: Table) => {
  const cards = stackCards(stack.id, table);
  cards.sort((a, b) => a.frontSprite.localeCompare(b.frontSprite));
  cards.forEach((card, i) => {
    card.stackIndex = i;
  });
};

export const organizeSideBySide = (stack: Stack, table: Table) => {
  const cards = stackCards(stack.id, table);
  if (cards.length == 0) return;
  const spriteSheet = getSpriteSheet(cards[0].frontSpriteSheetSource, table);
  const standardSprite = spriteSheet.sprites.find(
    (sprite) => sprite.name == cards[0].frontSprite
  );
  const cardWidth = standardSprite?.width || 0;
  const cardHeight = standardSprite?.height || 0;
  const maxStackWidth =
    (window.innerWidth - cardWidth * 2) / screenScale(table);
  const maxSpacingX = cardWidth + 10;
  const minSpacingX = 100 || cardWidth * 1;
  const cardSpacingX = Math.max(
    Math.min(maxStackWidth / cards.length, maxSpacingX),
    minSpacingX
  );
  const stackWidth = cardSpacingX * (cards.length - 1);

  const cardSpacingY = cardHeight * 0.3;
  const stackHeight =
    stackWidth > maxStackWidth
      ? (Math.ceil(stackWidth / maxStackWidth) - 1) * cardSpacingY
      : 0;

  const stackStartX =
    stack.position.x - Math.min(stackWidth, maxStackWidth) / 2;
  const stackStartY = stack.position.y - stackHeight / 2;
  let deltaX = 0;
  let deltaY = 0;
  cards
    .sort((a, b) => a.stackIndex - b.stackIndex)
    .forEach((card) => {
      card.position.x = stackStartX + deltaX;
      card.position.y = stackStartY + deltaY;
      deltaX += cardSpacingX;
      if (deltaX > maxStackWidth) {
        deltaX = 0;
        deltaY += cardSpacingY;
      }
    });
};

export const stackCards = (stackId: string, table: Table) => {
  return table.cards
    .filter((card) => card.stackId == stackId)
    .sort((a, b) => a.stackIndex - b.stackIndex);
};

export const popCardFromStack = (
  stackId: string,
  table: Table,
  cardId?: string
) => {
  const stack = getStack(stackId, table);
  if (!stack) return;

  const cards = stackCards(stackId, table);
  const card = cardId
    ? cards.find((x) => x.id == cardId)
    : cards[cards.length - 1];

  if (!card) return null;

  card.stackId = null;

  if (cards.length > 1)
    stack.height -= stack.elevation * (0.5 + Math.abs(Math.random() * 0.5));

  organizeStackCards(stack, table);
  return card;
};

export const pushCardToStack = async (
  card: Card,
  stackId: string,
  table: Table
) => {
  if (card.stackId)
    throw "Can't push card to new stack, it already has a stack!";

  const stack = getStack(stackId, table);
  if (!stack)
    throw "Can't push card to new stack: no stack with the given id was found!";

  const cards = stackCards(stack.id, table);
  card.stackIndex = cards.length;
  card.stackId = stack.id;
  card.position = newCardPositionInStack(stack);
  card.rotation = newCardAngleInStack(stack);
  card.moving = true;

  organizeStackCards(stack, table);
  setTimeout(() => (card.moving = false), 500);
  if (card.flipped != stack.flipped) {
    card.flipping = true;

    await waitTimeout(250);
    card.flipped = stack.flipped;
    card.flipping = false;

    await waitTimeout(750);
  } else await waitTimeout(1000);

  organizeStackCards(stack, table);
};

export const moveCard = async (
  srcStackId: string,
  destStackId: string,
  table: Table,
  cardId?: string,
  broadcast: boolean = true
) => {
  const card = popCardFromStack(srcStackId, table, cardId);
  if (!card) return;

  if (broadcast && table.sendNetworkingMessage)
    table.sendNetworkingMessage({
      cmd: "move-card",
      data: [srcStackId, destStackId, cardId],
    });

  console.log("Moving card: ", srcStackId, destStackId, cardId);

  await pushCardToStack(card, destStackId, table);
};
