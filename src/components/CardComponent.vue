<script lang="ts" setup>
import { computed, ref } from "vue";

import type { Card, Point, Table } from "@/types";
import { px } from "@/utils/formatting";
import { screenFromAngle, screenVector } from "@/utils/screen";
import {
  getStack,
  getStackFromScreen,
  moveCard,
  stackCards,
} from "@/utils/stack";
import { getSpriteSheet } from "@/utils/spritesheet";

const props = defineProps<{
  card: Card;
  table: Table;
}>();

const touchStart = ref<Point | null>(null);
const touchEnd = ref<Point | null>(null);

const currentSpriteSheet = computed(
  () =>
    props.card &&
    getSpriteSheet(
      props.card.flipped
        ? props.card.backSpriteSheetSource
        : props.card.frontSpriteSheetSource,
      props.table
    )
);

const currentSprite = computed(
  () =>
    props.card &&
    currentSpriteSheet.value &&
    currentSpriteSheet.value.sprites.find(
      (sprite) =>
        props.card &&
        sprite.name ==
          (props.card.flipped ? props.card.backSprite : props.card.frontSprite)
    )
);

const cardScreenVector = computed(() => {
  let stack;
  if (
    !props.card.stackId ||
    !(stack = getStack(props.card.stackId, props.table))
  )
    return {
      x: 0,
      y: 0,
    };
  return screenVector(stack.screen, props.table);
});

const onTouchStart = (evt: TouchEvent) => {
  const [touchObj] = evt.changedTouches;
  touchStart.value = {
    x: touchObj.clientX,
    y: touchObj.clientY,
  };
};

const onTouchEnd = async (evt: TouchEvent) => {
  if (!touchStart.value) return;
  const [touchObj] = evt.changedTouches;
  touchEnd.value = {
    x: touchObj.clientX,
    y: touchObj.clientY,
  };

  const angle =
    Math.atan2(
      touchStart.value.y - touchEnd.value.y,
      touchStart.value.x - touchEnd.value.x
    ) *
    (180 / Math.PI);

  const sourceStack = props.card.stackId
    ? getStack(props.card.stackId, props.table)
    : null;

  if (!sourceStack) return;

  const destScreen = screenFromAngle(angle, props.table);
  const destStack = getStackFromScreen(
    destScreen,
    props.table,
    sourceStack?.destStackName
  );

  if (!destStack) return;

  const cards = stackCards(sourceStack.id, props.table);

  if (sourceStack.taking == "all") {
    for (let i = 0; i < cards.length; i++)
      moveCard(sourceStack.id, destStack.id, props.table);
  } else if (cards.length > 0)
    moveCard(
      sourceStack.id,
      destStack.id,
      props.table,
      sourceStack.taking == "one" ? props.card.id : cards[cards.length - 1].id
    );
};
</script>

<template>
  <div
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    class="card"
    :id="card.id"
    :style="{
      top: px(card.position.y + cardScreenVector.y),
      left: px(card.position.x + cardScreenVector.x),
      'z-index': card.stackIndex + (card.moving ? 1000 : 0),
      transform: `translate(-50%, -50%) rotate(${card.rotation.toFixed(
        2
      )}deg) scale(${card.flipping ? 0 : 1},1)`,
      'background-image': `url(${currentSpriteSheet?.source})`,
      width: px(currentSprite?.width),
      height: px(currentSprite?.height),
      'background-position': `${px(-(currentSprite?.x || 0))} ${px(
        -(currentSprite?.y || 0)
      )}`,
    }"
  ></div>
</template>

<style scoped>
.card {
  position: absolute;
  left: 50%;
  top: 50%;
  cursor: pointer;
  transition: left 1s, top 1s, transform 0.5s, opacity 1s;
}
</style>
