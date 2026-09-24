'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { loadLootData, getMapImage } from '@/lib/data-loader';
import { MapCanvas } from '@/components/MapCanvas';
import { FilterBar } from '@/components/FilterBar';
import { PointList } from '@/components/PointList';
import { RouteEditor } from '@/components/RouteEditor';
import type { LootData, Point, Route } from '@/lib/types';

// 长弓溪谷路线初始数据
const LONGBOW_ROUTES: Route[] = [
  {"id":"longbow-route-1","name":"牧场1号位","mapId":"longbow","from":"longbow-423","stops":["longbow-M001","longbow-M005","longbow-M006","longbow-M002","longbow-M003","longbow-M004","longbow-020","longbow-021"],"to":"longbow-445","author":"视频分析","createdAt":Date.now(),"likes":0},
  {"id":"longbow-route-2","name":"9点1号位","mapId":"longbow","from":"longbow-440","stops":["longbow-M001","longbow-M005","longbow-M006","longbow-M002","longbow-M003","longbow-M004","longbow-020","longbow-021"],"to":"longbow-445","author":"视频分析","createdAt":Date.now(),"likes":0},
  {"id":"longbow-route-3","name":"阿米阿小镇1号位","mapId":"longbow","from":"longbow-442","stops":["longbow-M001","longbow-020","longbow-021","longbow-022","longbow-023"],"to":"longbow-445","author":"视频分析","createdAt":Date.now(),"likes":0},
  {"id":"longbow-route-4","name":"马头1号位","mapId":"longbow","from":"longbow-434","stops":["longbow-M001","longbow-M005","longbow-M006","longbow-M002","longbow-M003","longbow-M004","longbow-020","longbow-021"],"to":"longbow-445","author":"视频分析","createdAt":Date.now(),"likes":0},
  {"id":"longbow-route-5","name":"处藏站1号位","mapId":"longbow","from":"longbow-432","stops":["longbow-M001","longbow-020","longbow-021"],"to":"longbow-445","author":"视频分析","createdAt":Date.now(),"likes":0},
  {"id":"longbow-route-6","name":"荒废村庄","mapId":"longbow","from":"longbow-437","stops":["longbow-M001","longbow-020","longbow-021"],"to":"longbow-445","author":"视频分析","createdAt":Date.now(),"likes":0}
];

export default function Home() {
  const [data, setData] = useState<LootData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'edit' | 'route'>('view');
  const [routes, setRoutes] = useState<Route[]>([]);

  const {
    currentMapId,
    modeIndex,
    selectedGroups,
    selectedTypes,
    searchQuery,
    pointsData,
    setPointsData,
    selectedPointId,
    setSelectedPointId,
    isRouteMode,
    setRouteMode,
    currentRoute,
    setCurrentRoute
  } = useAppStore();

  // 加载数据
  useEffect(() => {
    loadLootData().then(loadedData => {
      setData(loadedData);
      // 初始化点位数据
      loadedData.maps.forEach(map => {
        setPointsData(map.id, map.points);
      });
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setLoading(false);
    });
  }, [setPointsData]);

  // 初始化路线数据
  useEffect(() => {
    const saved = localStorage.getItem('delta-routes');
    if (saved) {
      try {
        setRoutes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load routes:', e);
      }
    } else {
      // 首次加载，初始化长弓溪谷路线
      setRoutes(LONGBOW_ROUTES);
      localStorage.setItem('delta-routes', JSON.stringify(LONGBOW_ROUTES));
    }
  }, []);

  // 切换路线模式
  useEffect(() => {
    setRouteMode(mode === 'route');
  }, [mode, setRouteMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e0d] flex items-center justify-center">
        <div className="text-[#e6ecea] text-lg">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0b0e0d] flex items-center justify-center">
        <div className="text-red-400 text-lg">数据加载失败</div>
      </div>
    );
  }

  const currentMap = data.maps.find(m => m.id === currentMapId);
  if (!currentMap) {
    return <div className="text-white">地图未找到</div>;
  }

  // 获取当前地图的点位（包含用户修改）
  const points = pointsData[currentMapId] || currentMap.points;

  // 筛选点位
  const filteredPoints = points.filter(p => {
    // 难度筛选
    if ((p.tier || 0) > modeIndex) return false;

    // 分组筛选
    if (!selectedGroups.includes('all')) {
      if (!selectedGroups.includes(p.g)) return false;
    }

    // 类型筛选
    if (!selectedTypes.includes('all')) {
      if (!selectedTypes.includes(p.t)) return false;
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const region = currentMap.regions.find(r => r.id === p.r);
      const searchText = [
        p.n,
        p.v || '',
        p.note || '',
        region?.name || ''
      ].join(' ').toLowerCase();
      if (!searchText.includes(q)) return false;
    }

    return true;
  });

  const handlePointClick = (point: Point) => {
    setSelectedPointId(point.i === selectedPointId ? null : point.i);
  };

  const handleSaveRoute = (route: Route) => {
    const newRoutes = [...routes];
    const index = newRoutes.findIndex(r => r.id === route.id);
    if (index >= 0) {
      newRoutes[index] = route;
    } else {
      newRoutes.push(route);
    }
    setRoutes(newRoutes);
    localStorage.setItem('delta-routes', JSON.stringify(newRoutes));
    setCurrentRoute(route);
  };

  const handleDeleteRoute = (routeId: string) => {
    const newRoutes = routes.filter(r => r.id !== routeId);
    setRoutes(newRoutes);
    localStorage.setItem('delta-routes', JSON.stringify(newRoutes));
    if (currentRoute?.id === routeId) {
      setCurrentRoute(null);
    }
  };

  const spawnPoints = points.filter(p => p.g === 'spawn');
  const evacPoints = points.filter(p => p.g === 'evac');

  return (
    <div className="min-h-screen bg-[#0b0e0d] text-[#e6ecea]">
      <div className="max-w-[1800px] mx-auto p-4">
        {/* 顶栏 */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#242a28]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#5cf0bd] to-[#17b57f] flex items-center justify-center">
              <div className="w-3 h-3 bg-[#06251a] rotate-45"></div>
            </div>
            <h1 className="text-base font-bold">三角洲 · 跑刀路线工具</h1>
            <span className="text-xs text-[#6d7874] bg-[#141817] border border-[#333a37] rounded px-2 py-0.5">
              v2.0 · 长弓溪谷路线已导入
            </span>
          </div>
          <div className="flex-1"></div>
          {mode === 'view' && (
            <div className="text-xs text-[#9faba6]">
              共 {filteredPoints.length} 个点位
            </div>
          )}
          {mode === 'route' && (
            <div className="text-xs text-[#9faba6]">
              共 {routes.filter(r => r.mapId === currentMapId).length} 条路线
            </div>
          )}
        </div>

        {/* 模式切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('view')}
            className={`px-4 py-2 rounded text-sm border transition-colors ${
              mode === 'view'
                ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1] font-semibold'
                : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
            }`}
          >
            📍 查看地图
          </button>
          <button
            onClick={() => setMode('route')}
            className={`px-4 py-2 rounded text-sm border transition-colors ${
              mode === 'route'
                ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1] font-semibold'
                : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
            }`}
          >
            🗺️ 路线规划
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded text-sm border transition-colors ${
              mode === 'edit'
                ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1] font-semibold'
                : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
            }`}
          >
            ✏️ 数据编辑
          </button>
        </div>

        {/* 查看模式 */}
        {mode === 'view' && (
          <>
            <FilterBar data={data} currentMap={currentMap} />
            <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-4 mt-4">
              <div className="min-w-0">
                <MapCanvas
                  mapImage={getMapImage(currentMapId)}
                  points={filteredPoints}
                  types={data.types}
                  onPointClick={handlePointClick}
                />
              </div>
              <div className="min-w-0">
                <PointList
                  points={filteredPoints}
                  types={data.types}
                  currentMap={currentMap}
                />
              </div>
            </div>
          </>
        )}

        {/* 路线模式 */}
        {mode === 'route' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
            <div className="min-w-0">
              <MapCanvas
                mapImage={getMapImage(currentMapId)}
                points={points}
                types={data.types}
                onPointClick={(point) => {
                  setSelectedPointId(point.i);
                }}
              />
            </div>
            <div className="min-w-0">
              <RouteEditor
                data={data}
                currentMap={currentMap}
                points={points}
                routes={routes}
                currentRoute={currentRoute}
                spawnPoints={spawnPoints}
                evacPoints={evacPoints}
                onSaveRoute={handleSaveRoute}
                onDeleteRoute={handleDeleteRoute}
                onExportRoute={(route) => {
                  const blob = new Blob([JSON.stringify(route, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `route-${route.name}-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onImportRoute={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    try {
                      const route = JSON.parse(e.target?.result as string) as Route;
                      handleSaveRoute(route);
                      alert('路线导入成功！');
                    } catch (err) {
                      alert('路线文件格式错误');
                    }
                  };
                  reader.readAsText(file);
                }}
                onLoadRoute={setCurrentRoute}
              />
            </div>
          </div>
        )}

        {/* 编辑模式 */}
        {mode === 'edit' && (
          <div className="p-6 bg-[#141817] border border-[#242a28] rounded-lg">
            <h2 className="text-lg font-bold mb-4">数据编辑器</h2>
            <p className="text-sm text-[#9faba6] mb-4">
              编辑功能开发中...可以在浏览器开发者工具中修改 localStorage 中的数据
            </p>
            <div className="space-y-2 text-xs text-[#6d7874]">
              <p>• 点位数据: localStorage.getItem('delta-points-{currentMapId}')</p>
              <p>• 路线数据: localStorage.getItem('delta-routes')</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
