// 数据类型定义
export interface Point {
  i: string;           // ID
  n: string;           // 名称
  x: number;           // X坐标 (0-1)
  y: number;           // Y坐标 (0-1)
  t: string;           // 类型
  g: string;           // 分组
  r?: string;          // 区域ID
  rx?: number;         // 区域内相对X
  ry?: number;         // 区域内相对Y
  tier?: number;       // 难度等级 0=普通 1=机密 2=绝密
  s?: string;          // 刷新类型
  v?: string;          // 额外信息
  note?: string;       // 备注
  verified?: boolean;  // 是否已验证
  image?: string;      // 图片路径
  manual?: number;     // 是否手工添加
}

export interface PointType {
  name: string;
  group: string;
  color: string;
  shape: 'circle' | 'square' | 'diamond' | 'tri' | 'ring';
  size: number;
}

export interface Group {
  id: string;
  name: string;
  desc: string;
}

export interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapData {
  id: string;
  name: string;
  brief?: string;
  image: string;
  regions: Region[];
  points: Point[];
}

export interface LootData {
  version: string;
  modes: string[];
  groups: Group[];
  types: Record<string, PointType>;
  maps: MapData[];
}

export interface Route {
  id: string;
  name: string;
  mapId: string;
  from: string;      // 起点点位ID
  stops: string[];   // 途经点位ID数组
  to: string;        // 终点点位ID
  author?: string;
  createdAt: number;
  likes?: number;
}

export interface Viewport {
  x: number;
  y: number;
  w: number;
  scale?: number;
}
