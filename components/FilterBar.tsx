'use client';

import { useAppStore } from '@/lib/store';
import type { LootData, MapData } from '@/lib/types';

interface FilterBarProps {
  data: LootData;
  currentMap: MapData;
}

export function FilterBar({ data, currentMap }: FilterBarProps) {
  const {
    currentMapId,
    setCurrentMapId,
    modeIndex,
    setModeIndex,
    selectedGroups,
    toggleGroup,
    setAllGroups,
    selectedTypes,
    toggleType,
    setAllTypes,
    searchQuery,
    setSearchQuery
  } = useAppStore();

  const isAllGroups = selectedGroups.includes('all') ||
    data.groups.every(g => selectedGroups.includes(g.id));

  const handleGroupClick = (groupId: string) => {
    if (groupId === 'all') {
      setAllGroups(['all']);
    } else {
      toggleGroup(groupId);
    }
  };

  return (
    <div className="space-y-3">
      {/* 地图选择 */}
      <div className="flex items-start gap-3">
        <label className="text-[10px] font-semibold text-[#6d7874] uppercase tracking-wider w-9 pt-2">
          地图
        </label>
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {data.maps.map(map => (
            <button
              key={map.id}
              onClick={() => setCurrentMapId(map.id)}
              className={`
                px-4 py-2 rounded text-xs border whitespace-nowrap transition-colors
                ${map.id === currentMapId
                  ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1] font-semibold'
                  : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46] hover:text-[#e6ecea]'
                }
              `}
            >
              {map.name}
            </button>
          ))}
        </div>
      </div>

      {/* 难度选择 */}
      <div className="flex items-start gap-3">
        <label className="text-[10px] font-semibold text-[#6d7874] uppercase tracking-wider w-9 pt-2">
          难度
        </label>
        <div className="flex-1 flex gap-1 bg-[#0d1110] border border-[#333a37] rounded p-0.5">
          {data.modes.map((mode, i) => (
            <button
              key={i}
              onClick={() => setModeIndex(i)}
              className={`
                flex-1 px-4 py-1.5 rounded-sm text-xs transition-colors
                ${i === modeIndex
                  ? 'bg-[#1d2321] text-[#63f2c1] font-semibold shadow-[inset_0_0_0_1px_rgba(47,224,164,0.26)]'
                  : 'text-[#6d7874] hover:text-[#9faba6]'
                }
              `}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 分组选择 */}
      <div className="flex items-start gap-3">
        <label className="text-[10px] font-semibold text-[#6d7874] uppercase tracking-wider w-9 pt-2">
          分类
        </label>
        <div className="flex-1 flex gap-2 flex-wrap">
          <button
            onClick={() => handleGroupClick('all')}
            className={`
              px-3 py-1.5 rounded text-xs border transition-colors
              ${isAllGroups
                ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1]'
                : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
              }
            `}
          >
            全部
          </button>
          {data.groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleGroupClick(group.id)}
              className={`
                px-3 py-1.5 rounded text-xs border transition-colors
                ${!isAllGroups && selectedGroups.includes(group.id)
                  ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1]'
                  : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
                }
              `}
              title={group.desc}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* 类型选择 - 多选 */}
      <div className="flex items-start gap-3">
        <label className="text-[10px] font-semibold text-[#6d7874] uppercase tracking-wider w-9 pt-2">
          类型
        </label>
        <div className="flex-1 flex gap-2 flex-wrap max-h-24 overflow-y-auto">
          <button
            onClick={() => setAllTypes()}
            className={`
              px-3 py-1 rounded text-xs border transition-colors
              ${selectedTypes.includes('all')
                ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1]'
                : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
              }
            `}
          >
            全部类型
          </button>
          {Object.entries(data.types).map(([id, type]) => (
            <button
              key={id}
              onClick={() => toggleType(id)}
              className={`
                px-2 py-1 rounded text-xs border transition-colors
                ${!selectedTypes.includes('all') && selectedTypes.includes(id)
                  ? 'bg-[#2fe0a4]/10 border-[#2fe0a4]/40 text-[#63f2c1]'
                  : 'bg-[#141817] border-[#333a37] text-[#9faba6] hover:border-[#414a46]'
                }
              `}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索 */}
      <div className="flex items-start gap-3">
        <label className="text-[10px] font-semibold text-[#6d7874] uppercase tracking-wider w-9 pt-2">
          搜索
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜点位名 / 区域 / 产出..."
          className="flex-1 px-3 py-2 bg-[#141817] border border-[#333a37] rounded text-sm text-[#e6ecea] placeholder-[#6d7874] focus:border-[#2fe0a4]/40 focus:outline-none focus:ring-2 focus:ring-[#2fe0a4]/10"
        />
      </div>
    </div>
  );
}
