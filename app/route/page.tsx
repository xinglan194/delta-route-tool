'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { loadLootData, getMapImage } from '@/lib/data-loader';
import { MapCanvas } from '@/components/MapCanvas';
import { RouteEditor } from '@/components/RouteEditor';
import type { LootData, Point, Route } from '@/lib/types';

export default function RoutePage() {
  const [data, setData] = useState<LootData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);

  const {
    currentMapId,
    setCurrentMapId,
    pointsData,
    setPointsData,
    isRouteMode,
    setRouteMode,
    currentRoute,
    setCurrentRoute,
    selectedPointId,
    setSelectedPointId
  } = useAppStore();

  // 加载数据
  useEffect(() => {
    loadLootData().then(loadedData => {
      setData(loadedData);
      loadedData.maps.forEach(map => {
        if (!pointsData[map.id]) {
          setPointsData(map.id, map.points);
        }
      });
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setLoading(false);
    });

    // 启用路线模式
    setRouteMode(true);

    return () => {
      setRouteMode(false);
    };
  }, [pointsData, setPointsData, setRouteMode]);

  // 从 localStorage 加载路线
  useEffect(() => {
    const saved = localStorage.getItem('delta-routes');
    if (saved) {
      try {
        setRoutes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load routes:', e);
      }
    }
  }, []);

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

  const handleExportRoute = (route: Route) => {
    const blob = new Blob([JSON.stringify(route, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${route.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRoute = (file: File) => {
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
  };

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
  if (!currentMap) return null;

  const points = pointsData[currentMapId] || currentMap.points;

  // 筛选出生点和撤离点
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
            <h1 className="text-base font-bold">路线编辑器</h1>
            <span className="text-xs text-[#6d7874] bg-[#141817] border border-[#333a37] rounded px-2 py-0.5">
              跑刀规划工具
            </span>
          </div>
          <div className="flex-1"></div>
          <a
            href="/"
            className="px-4 py-2 text-sm bg-[#141817] border border-[#333a37] rounded hover:border-[#414a46] transition-colors"
          >
            返回主页
          </a>
        </div>

        {/* 地图选择 */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {data.maps.map(map => (
            <button
              key={map.id}
              onClick={() => setCurrentMapId(map.id)}
              className={`
                px-4 py-2 rounded text-xs border whitespace-nowrap transition-colors
                ${map.id === currentMapId
                  ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1] font-semibold'
                  : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
                }
              `}
            >
              {map.name}
            </button>
          ))}
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
          {/* 左侧：地图 */}
          <div className="min-w-0">
            <MapCanvas
              mapImage={getMapImage(currentMapId)}
              points={points}
              types={data.types}
              onPointClick={(point) => {
                setSelectedPointId(point.i);
                // 如果正在编辑路线，点击点位时自动处理
                if (currentRoute) {
                  // 处理逻辑在 RouteEditor 中
                }
              }}
            />

            {/* 使用说明 */}
            <div className="mt-4 p-4 bg-[#141817] border border-[#242a28] rounded-lg">
              <h3 className="text-sm font-bold mb-2">💡 使用说明</h3>
              <div className="text-xs text-[#9faba6] space-y-1">
                <p>1. 点击右侧"新建路线"开始规划</p>
                <p>2. 选择起点（出生点）</p>
                <p>3. 在地图上点击要跑的点位，自动添加到路线</p>
                <p>4. 在右侧路线列表中拖拽调整顺序</p>
                <p>5. 选择终点（撤离点）</p>
                <p>6. 保存或导出路线</p>
              </div>
            </div>
          </div>

          {/* 右侧：路线编辑器 */}
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
              onExportRoute={handleExportRoute}
              onImportRoute={handleImportRoute}
              onLoadRoute={setCurrentRoute}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
