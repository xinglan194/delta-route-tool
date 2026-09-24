'use client';

import { useAppStore } from '@/lib/store';
import type { Point, PointType, MapData } from '@/lib/types';

interface PointListProps {
  points: Point[];
  types: Record<string, PointType>;
  currentMap: MapData;
}

export function PointList({ points, types, currentMap }: PointListProps) {
  const { selectedPointId, setSelectedPointId, setViewport } = useAppStore();

  const handlePointClick = (point: Point) => {
    setSelectedPointId(point.i);
    // 将视图移动到点位位置
    setViewport({
      x: Math.max(0, point.x - 0.15),
      y: Math.max(0, point.y - 0.15),
      w: 0.3
    });
  };

  const getPointColor = (point: Point) => {
    const type = types[point.t];
    return type?.color || '#96948e';
  };

  const getRegionName = (point: Point) => {
    const region = currentMap.regions.find(r => r.id === point.r);
    return region?.name || '未知区域';
  };

  return (
    <div className="bg-[#141817] border border-[#242a28] rounded-lg overflow-hidden">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-[#242a28] bg-[#181d1b] flex items-center gap-2">
        <div className="w-0.5 h-3 bg-[#2fe0a4] rounded"></div>
        <h2 className="text-sm font-bold">点位列表</h2>
        <div className="ml-auto text-xs text-[#9faba6] bg-[#1d2321] border border-[#333a37] rounded px-2 py-0.5">
          {points.length}
        </div>
      </div>

      {/* 列表 */}
      <div className="max-h-[600px] overflow-y-auto">
        {points.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#6d7874] text-sm">
            未找到符合条件的点位
          </div>
        ) : (
          points.map((point) => {
            const isSelected = point.i === selectedPointId;
            const type = types[point.t];

            return (
              <button
                key={point.i}
                onClick={() => handlePointClick(point)}
                className={`
                  w-full px-4 py-2.5 border-b border-[#242a28] text-left transition-colors relative
                  ${isSelected
                    ? 'bg-[#2fe0a4]/10'
                    : 'hover:bg-[#181d1b]'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#2fe0a4]"></div>
                )}

                <div className="flex items-start gap-3">
                  {/* 图标 */}
                  <div
                    className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: getPointColor(point) }}
                  ></div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${isSelected ? 'text-[#63f2c1]' : 'text-[#e6ecea]'}`}>
                      {point.n}
                      {point.verified === false && (
                        <span className="ml-2 text-xs text-yellow-500">⚠️ 未验证</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-[#6d7874]">
                      <span>{getRegionName(point)}</span>
                      <span className="text-[#3a423e]">•</span>
                      <span>{type?.name || '未知'}</span>
                      {point.v && (
                        <>
                          <span className="text-[#3a423e]">•</span>
                          <span className="text-[#9faba6]">{point.v}</span>
                        </>
                      )}
                    </div>

                    {point.note && (
                      <div className="mt-1 text-xs text-[#9faba6] line-clamp-1">
                        {point.note}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
