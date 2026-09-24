'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { LootData, MapData, Point, Route } from '@/lib/types';

interface RouteEditorProps {
  data: LootData;
  currentMap: MapData;
  points: Point[];
  routes: Route[];
  currentRoute: Route | null;
  spawnPoints: Point[];
  evacPoints: Point[];
  onSaveRoute: (route: Route) => void;
  onDeleteRoute: (routeId: string) => void;
  onExportRoute: (route: Route) => void;
  onImportRoute: (file: File) => void;
  onLoadRoute: (route: Route | null) => void;
}

export function RouteEditor({
  data,
  currentMap,
  points,
  routes,
  currentRoute,
  spawnPoints,
  evacPoints,
  onSaveRoute,
  onDeleteRoute,
  onExportRoute,
  onImportRoute,
  onLoadRoute
}: RouteEditorProps) {
  const { selectedPointId, setSelectedPointId } = useAppStore();
  const [routeName, setRouteName] = useState('');
  const [fromPoint, setFromPoint] = useState('');
  const [toPoint, setToPoint] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // 当选中点位时，自动添加到路线
  useEffect(() => {
    if (!currentRoute || !selectedPointId) return;

    const point = points.find(p => p.i === selectedPointId);
    if (!point) return;

    // 如果是出生点，设为起点
    if (point.g === 'spawn') {
      setFromPoint(point.i);
      return;
    }

    // 如果是撤离点，设为终点
    if (point.g === 'evac') {
      setToPoint(point.i);
      return;
    }

    // 其他点位添加到途经点
    if (!stops.includes(point.i)) {
      setStops([...stops, point.i]);
    }
  }, [selectedPointId, currentRoute, points, stops]);

  // 加载路线时更新状态
  useEffect(() => {
    if (currentRoute) {
      setRouteName(currentRoute.name);
      setFromPoint(currentRoute.from);
      setToPoint(currentRoute.to);
      setStops(currentRoute.stops);
    }
  }, [currentRoute]);

  const handleNewRoute = () => {
    const newRoute: Route = {
      id: Date.now().toString(),
      name: '新路线',
      mapId: currentMap.id,
      from: '',
      stops: [],
      to: '',
      createdAt: Date.now()
    };
    onLoadRoute(newRoute);
    setRouteName('新路线');
    setFromPoint('');
    setToPoint('');
    setStops([]);
  };

  const handleSave = () => {
    if (!currentRoute) return;
    if (!fromPoint) {
      alert('请选择起点（出生点）');
      return;
    }
    if (stops.length === 0) {
      alert('请至少添加一个途经点');
      return;
    }

    const route: Route = {
      ...currentRoute,
      name: routeName || '未命名路线',
      from: fromPoint,
      stops: stops,
      to: toPoint
    };

    onSaveRoute(route);
    alert('路线已保存！');
  };

  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newStops = [...stops];
    const dragItem = newStops[dragIndex];
    newStops.splice(dragIndex, 1);
    newStops.splice(index, 0, dragItem);
    setStops(newStops);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const getPointName = (pointId: string) => {
    const point = points.find(p => p.i === pointId);
    return point?.n || '未知点位';
  };

  const calculateDistance = () => {
    if (!fromPoint || stops.length === 0) return 0;

    let total = 0;
    const allPoints = [fromPoint, ...stops];
    if (toPoint) allPoints.push(toPoint);

    for (let i = 1; i < allPoints.length; i++) {
      const p1 = points.find(p => p.i === allPoints[i - 1]);
      const p2 = points.find(p => p.i === allPoints[i]);
      if (p1 && p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        total += Math.sqrt(dx * dx + dy * dy);
      }
    }

    return (total * 1000).toFixed(0); // 转换为米
  };

  const mapRoutes = routes.filter(r => r.mapId === currentMap.id);

  return (
    <div className="space-y-4">
      {/* 路线列表 */}
      <div className="bg-[#141817] border border-[#242a28] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#242a28] bg-[#181d1b] flex items-center gap-2">
          <div className="w-0.5 h-3 bg-[#2fe0a4] rounded"></div>
          <h2 className="text-sm font-bold">我的路线</h2>
          <div className="ml-auto">
            <button
              onClick={handleNewRoute}
              className="px-3 py-1.5 bg-[#2fe0a4]/10 border border-[#2fe0a4]/40 text-[#63f2c1] rounded text-xs hover:bg-[#2fe0a4]/20 transition-colors"
            >
              + 新建路线
            </button>
          </div>
        </div>

        <div className="max-h-[200px] overflow-y-auto">
          {mapRoutes.length === 0 ? (
            <div className="px-4 py-6 text-center text-[#6d7874] text-sm">
              当前地图还没有保存的路线
            </div>
          ) : (
            mapRoutes.map((route) => (
              <div
                key={route.id}
                className={`
                  px-4 py-3 border-b border-[#242a28] cursor-pointer transition-colors
                  ${currentRoute?.id === route.id ? 'bg-[#2fe0a4]/10' : 'hover:bg-[#181d1b]'}
                `}
                onClick={() => onLoadRoute(route)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#e6ecea]">{route.name}</div>
                    <div className="text-xs text-[#6d7874] mt-1">
                      {route.stops.length} 个点位 · {new Date(route.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportRoute(route);
                      }}
                      className="p-1.5 text-[#9faba6] hover:text-[#63f2c1] hover:bg-[#141817] rounded transition-colors"
                      title="导出"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这条路线吗？')) {
                          onDeleteRoute(route.id);
                        }
                      }}
                      className="p-1.5 text-[#9faba6] hover:text-red-400 hover:bg-[#141817] rounded transition-colors"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 导入按钮 */}
        <div className="px-4 py-3 border-t border-[#242a28] bg-[#181d1b]">
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportRoute(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <span className="inline-block px-3 py-1.5 text-xs bg-[#141817] border border-[#333a37] text-[#9faba6] rounded hover:border-[#414a46] cursor-pointer transition-colors">
              导入路线文件
            </span>
          </label>
        </div>
      </div>

      {/* 路线编辑区 */}
      {currentRoute && (
        <div className="bg-[#141817] border border-[#242a28] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#242a28] bg-[#181d1b] flex items-center gap-2">
            <div className="w-0.5 h-3 bg-[#2fe0a4] rounded"></div>
            <h2 className="text-sm font-bold">编辑路线</h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 路线名称 */}
            <div>
              <label className="block text-xs text-[#6d7874] mb-1">路线名称</label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="例如：速刷房卡路线"
                className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
              />
            </div>

            {/* 起点 */}
            <div>
              <label className="block text-xs text-[#6d7874] mb-1">
                起点（出生点） <span className="text-red-400">*</span>
              </label>
              <select
                value={fromPoint}
                onChange={(e) => setFromPoint(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
              >
                <option value="">请选择出生点</option>
                {spawnPoints.map(p => (
                  <option key={p.i} value={p.i}>{p.n}</option>
                ))}
              </select>
            </div>

            {/* 途经点列表 */}
            <div>
              <label className="block text-xs text-[#6d7874] mb-2">
                途经点 ({stops.length}) <span className="text-[#9faba6]">· 点击地图添加</span>
              </label>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {stops.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[#6d7874] text-xs bg-[#0e1211] border border-[#333a37] rounded">
                    在地图上点击点位添加到路线
                  </div>
                ) : (
                  stops.map((stopId, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center gap-2 px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded
                        cursor-move hover:border-[#414a46] transition-colors
                        ${dragIndex === index ? 'opacity-50' : ''}
                      `}
                    >
                      <span className="text-xs font-bold text-[#63f2c1] w-6 text-center">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-[#e6ecea]">
                        {getPointName(stopId)}
                      </span>
                      <button
                        onClick={() => handleRemoveStop(index)}
                        className="text-[#9faba6] hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 终点 */}
            <div>
              <label className="block text-xs text-[#6d7874] mb-1">
                终点（撤离点） <span className="text-[#9faba6]">可选</span>
              </label>
              <select
                value={toPoint}
                onChange={(e) => setToPoint(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
              >
                <option value="">不设终点</option>
                {evacPoints.map(p => (
                  <option key={p.i} value={p.i}>{p.n} ({p.v})</option>
                ))}
              </select>
            </div>

            {/* 路线信息 */}
            {fromPoint && stops.length > 0 && (
              <div className="pt-3 border-t border-[#242a28]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6d7874]">预估距离：</span>
                  <span className="text-[#63f2c1] font-bold">{calculateDistance()} 米</span>
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onLoadRoute(null)}
                className="flex-1 px-4 py-2 bg-[#141817] border border-[#333a37] rounded text-sm hover:border-[#414a46] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-[#2fe0a4]/10 border border-[#2fe0a4]/40 text-[#63f2c1] rounded text-sm hover:bg-[#2fe0a4]/20 transition-colors font-medium"
              >
                保存路线
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
