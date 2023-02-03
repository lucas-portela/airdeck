export type Size = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Sprite = {
  name: string;
} & Point &
  Size;

// name="card([^"]+).png"\s*(\w+)="(\d+)"\s*(\w+)="(\d+)"\s*(\w+)="(\d+)"\s*(\w+)="(\d+)"
export type SpriteSheet = {
  source: string;
  sprites: Sprite[];
};

export type Card = {
  id: string;
  stackId: string | null;
  stackIndex: number;
  frontSprite: string;
  backSprite: string;
  frontSpriteSheetSource: string;
  backSpriteSheetSource: string;
  position: Point;
  rotation: number;
  flipped: boolean;
  flipping: boolean;
  moving: boolean;
};

export type Stack = {
  id: string;
  screen: number;
  tableId: string;
  position: Point;
  flipped: boolean;
  rotation: number;
  elevation: number;
  height: number;
  messinessRotation: number;
  shuffle?: boolean;
  autoArrange?: boolean;
  style: "messy" | "simple" | "side-by-side";
  taking: "one" | "all" | "top";
  frontSpriteSheetSource?: string;
  backSpriteSheetSource?: string;
  repeat?: number;
  deck?: Pick<Card, "frontSprite" | "backSprite">[];
  defaultStack?: boolean;
  name?: string;
  destStackName?: string;
};

export type NetworkingMessage = {
  sender?: number;
  cmd: string;
  data: any;
};

export type NetworkingMessageSenderInterface = (
  message: NetworkingMessage,
  skip?: number[]
) => void;

export type TableStateUpdaterInterface = (table: Table) => void;

export type Table = {
  id: string;
  background: string;
  pointToScreen?: number;
  mainScale?: number;
  handScale?: number;
  stacks: Stack[];
  cards: Card[];
  spriteSheets: { [source: string]: SpriteSheet };
  localScreen: number;
  screenAmount: number;
  open: boolean;
  sendNetworkingMessage?: NetworkingMessageSenderInterface;
};
