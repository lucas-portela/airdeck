import type { Point, Table } from "@/types";
import { minAngleDiff } from "./math";

export const screenScale = (table: Table) =>
  (table.localScreen == 0 ? table.mainScale : table.handScale) || 1;

export const screenAngle = (screen: number, table: Table): number => {
  let angle = 90;
  if (table.localScreen === 0) {
    const angleGap = 360 / Math.max(table.screenAmount - 1, 1);
    angle = 90 + angleGap * (screen - 1);
  }
  return angle % 360;
};

export const screenVector = (screen: number, table: Table): Point => {
  if (screen == table.localScreen) return { x: 0, y: 0 };
  const rad = screenAngle(screen, table) * (Math.PI / 180);

  return {
    x: -Math.cos(rad) * window.innerWidth * 2,
    y: -Math.sin(rad) * window.innerHeight * 2,
  };
};

export const screenFromAngle = (angle: number, table: Table): number => {
  if (table.localScreen != 0) return 0;
  let minAngleDist = 360;
  let nearestScreen = 0;
  for (let destScreen = 0; destScreen < table.screenAmount; destScreen++) {
    if (destScreen == table.localScreen) continue;
    const destScreenAngle = screenAngle(destScreen, table);
    const destScreenAngleDist = minAngleDiff(angle, destScreenAngle);
    if (destScreenAngleDist < minAngleDist) {
      minAngleDist = destScreenAngleDist;
      nearestScreen = destScreen;
    }
  }

  return nearestScreen;
};
