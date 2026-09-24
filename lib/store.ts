import { create } from 'zustand';
import type { Point, MapData, Viewport, Route } from './types';

interface AppState {
  // 当前选中的地图
  currentMapId: string;
  setCurrentMapId: (id: string) => void;

  // 难度级别 0=普通 1=机密 2=绝密
  modeIndex: number;
  setModeIndex: (index: number) => void;

  // 选中的分组（多选）
  selectedGroups: string[];
  toggleGroup: (groupId: string) => void;
  setAllGroups: (groups: string[]) => void;

  // 选中的类型（多选）
  selectedTypes: string[];
  toggleType: (type: string) => void;
  setAllTypes: () => void;

  // 搜索关键词
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 选中的点位
  selectedPointId: string | null;
  setSelectedPointId: (id: string | null) => void;

  // 视口状态
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;

  // 路线编辑模式
  isRouteMode: boolean;
  setRouteMode: (enabled: boolean) => void;

  // 当前路线
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;

  // 点位数据（包含用户修改）
  pointsData: Record<string, Point[]>; // mapId -> points
  setPointsData: (mapId: string, points: Point[]) => void;
  updatePoint: (mapId: string, pointId: string, updates: Partial<Point>) => void;
  deletePoint: (mapId: string, pointId: string) => void;
  addPoint: (mapId: string, point: Point) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentMapId: 'zero-dam',
  setCurrentMapId: (id) => set({ currentMapId: id }),

  modeIndex: 1, // 默认机密
  setModeIndex: (index) => set({ modeIndex: index }),

  selectedGroups: ['pickup'], // 默认只看直接拾取
  toggleGroup: (groupId) => set((state) => {
    const groups = state.selectedGroups;
    const index = groups.indexOf(groupId);
    if (index >= 0) {
      // 如果是最后一个，取消后回到全选
      const newGroups = groups.filter(g => g !== groupId);
      return { selectedGroups: newGroups.length === 0 ? ['all'] : newGroups };
    } else {
      // 添加分组
      const newGroups = groups.filter(g => g !== 'all').concat(groupId);
      return { selectedGroups: newGroups };
    }
  }),
  setAllGroups: (groups) => set({ selectedGroups: groups }),

  selectedTypes: ['all'],
  toggleType: (type) => set((state) => {
    if (type === 'all') {
      return { selectedTypes: ['all'] };
    }
    const types = state.selectedTypes.filter(t => t !== 'all');
    const index = types.indexOf(type);
    if (index >= 0) {
      const newTypes = types.filter(t => t !== type);
      return { selectedTypes: newTypes.length === 0 ? ['all'] : newTypes };
    } else {
      return { selectedTypes: [...types, type] };
    }
  }),
  setAllTypes: () => set({ selectedTypes: ['all'] }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedPointId: null,
  setSelectedPointId: (id) => set({ selectedPointId: id }),

  viewport: { x: 0, y: 0, w: 1 },
  setViewport: (viewport) => set({ viewport }),

  isRouteMode: false,
  setRouteMode: (enabled) => set({ isRouteMode: enabled }),

  currentRoute: null,
  setCurrentRoute: (route) => set({ currentRoute: route }),

  pointsData: {},
  setPointsData: (mapId, points) => set((state) => ({
    pointsData: { ...state.pointsData, [mapId]: points }
  })),

  updatePoint: (mapId, pointId, updates) => set((state) => {
    const points = state.pointsData[mapId] || [];
    const newPoints = points.map(p =>
      p.i === pointId ? { ...p, ...updates } : p
    );
    return {
      pointsData: { ...state.pointsData, [mapId]: newPoints }
    };
  }),

  deletePoint: (mapId, pointId) => set((state) => {
    const points = state.pointsData[mapId] || [];
    return {
      pointsData: {
        ...state.pointsData,
        [mapId]: points.filter(p => p.i !== pointId)
      }
    };
  }),

  addPoint: (mapId, point) => set((state) => {
    const points = state.pointsData[mapId] || [];
    return {
      pointsData: {
        ...state.pointsData,
        [mapId]: [...points, point]
      }
    };
  }),
}));
