'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { loadLootData, getMapImage } from '@/lib/data-loader';
import { MapCanvas } from '@/components/MapCanvas';
import type { LootData, Point } from '@/lib/types';

export default function EditorPage() {
  const [data, setData] = useState<LootData | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    currentMapId,
    setCurrentMapId,
    pointsData,
    setPointsData,
    updatePoint,
    deletePoint,
    addPoint,
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
  }, [pointsData, setPointsData]);

  const handleExportData = () => {
    if (!data) return;

    // 导出修改后的数据
    const exportData = {
      ...data,
      maps: data.maps.map(map => ({
        ...map,
        points: pointsData[map.id] || map.points
      }))
    };

    const blob = new Blob(
      ['window.LOOT_DATA = ' + JSON.stringify(exportData, null, 2)],
      { type: 'text/javascript' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-${Date.now()}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkVerified = (pointId: string, verified: boolean) => {
    updatePoint(currentMapId, pointId, { verified });
  };

  const handleDeletePoint = (pointId: string) => {
    if (confirm('确定要删除这个点位吗？')) {
      deletePoint(currentMapId, pointId);
      setSelectedPointId(null);
    }
  };

  const handleImageUpload = (pointId: string, file: File) => {
    // 这里简化处理，实际应该上传到服务器
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updatePoint(currentMapId, pointId, { image: dataUrl });
      alert('图片已更新（实际项目中应上传到服务器）');
    };
    reader.readAsDataURL(file);
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
  const selectedPoint = points.find(p => p.i === selectedPointId);

  return (
    <div className="min-h-screen bg-[#0b0e0d] text-[#e6ecea]">
      <div className="max-w-[1800px] mx-auto p-4">
        {/* 顶栏 */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#242a28]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#5cf0bd] to-[#17b57f] flex items-center justify-center">
              <div className="w-3 h-3 bg-[#06251a] rotate-45"></div>
            </div>
            <h1 className="text-base font-bold">数据编辑器</h1>
            <span className="text-xs text-[#6d7874] bg-[#141817] border border-[#333a37] rounded px-2 py-0.5">
              管理员工具
            </span>
          </div>
          <div className="flex-1"></div>
          <a
            href="/"
            className="px-4 py-2 text-sm bg-[#141817] border border-[#333a37] rounded hover:border-[#414a46] transition-colors"
          >
            返回主页
          </a>
          <button
            onClick={handleExportData}
            className="px-4 py-2 text-sm bg-[#2fe0a4]/10 border border-[#2fe0a4]/40 text-[#63f2c1] rounded hover:bg-[#2fe0a4]/20 transition-colors"
          >
            导出数据
          </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          {/* 左侧：地图 */}
          <div className="min-w-0">
            <MapCanvas
              mapImage={getMapImage(currentMapId)}
              points={points}
              types={data.types}
              onPointClick={(point) => setSelectedPointId(point.i)}
            />
          </div>

          {/* 右侧：点位编辑面板 */}
          <div className="min-w-0">
            <div className="bg-[#141817] border border-[#242a28] rounded-lg overflow-hidden">
              {/* 标题 */}
              <div className="px-4 py-3 border-b border-[#242a28] bg-[#181d1b] flex items-center gap-2">
                <div className="w-0.5 h-3 bg-[#2fe0a4] rounded"></div>
                <h2 className="text-sm font-bold">
                  {selectedPoint ? '编辑点位' : '点位列表'}
                </h2>
                {points.length > 0 && (
                  <div className="ml-auto text-xs text-[#9faba6] bg-[#1d2321] border border-[#333a37] rounded px-2 py-0.5">
                    {points.length} 个点位
                  </div>
                )}
              </div>

              {/* 内容 */}
              {selectedPoint ? (
                <div className="p-4 space-y-4">
                  {/* 基本信息 */}
                  <div>
                    <label className="block text-xs text-[#6d7874] mb-1">名称</label>
                    <input
                      type="text"
                      value={selectedPoint.n}
                      onChange={(e) => updatePoint(currentMapId, selectedPoint.i, { n: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
                    />
                  </div>

                  {/* 类型 */}
                  <div>
                    <label className="block text-xs text-[#6d7874] mb-1">类型</label>
                    <select
                      value={selectedPoint.t}
                      onChange={(e) => updatePoint(currentMapId, selectedPoint.i, { t: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
                    >
                      {Object.entries(data.types).map(([id, type]) => (
                        <option key={id} value={id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 备注 */}
                  <div>
                    <label className="block text-xs text-[#6d7874] mb-1">备注</label>
                    <textarea
                      value={selectedPoint.note || ''}
                      onChange={(e) => updatePoint(currentMapId, selectedPoint.i, { note: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] resize-none focus:border-[#2fe0a4]/40 focus:outline-none"
                    />
                  </div>

                  {/* 坐标 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#6d7874] mb-1">X 坐标</label>
                      <input
                        type="number"
                        step="0.001"
                        value={selectedPoint.x}
                        onChange={(e) => updatePoint(currentMapId, selectedPoint.i, { x: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6d7874] mb-1">Y 坐标</label>
                      <input
                        type="number"
                        step="0.001"
                        value={selectedPoint.y}
                        onChange={(e) => updatePoint(currentMapId, selectedPoint.i, { y: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-[#0e1211] border border-[#333a37] rounded text-sm text-[#e6ecea] focus:border-[#2fe0a4]/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 图片上传 */}
                  <div>
                    <label className="block text-xs text-[#6d7874] mb-2">点位图片</label>
                    {selectedPoint.image && (
                      <img
                        src={selectedPoint.image}
                        alt={selectedPoint.n}
                        className="w-full h-40 object-cover rounded mb-2"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(selectedPoint.i, file);
                      }}
                      className="w-full text-xs text-[#9faba6] file:mr-2 file:px-3 file:py-2 file:rounded file:border-0 file:bg-[#2fe0a4]/10 file:text-[#63f2c1] file:cursor-pointer hover:file:bg-[#2fe0a4]/20"
                    />
                  </div>

                  {/* 验证状态 */}
                  <div className="flex items-center gap-3 pt-2 border-t border-[#242a28]">
                    <span className="text-xs text-[#6d7874]">验证状态：</span>
                    <button
                      onClick={() => handleMarkVerified(selectedPoint.i, true)}
                      className={`px-3 py-1 rounded text-xs ${
                        selectedPoint.verified
                          ? 'bg-[#2fe0a4]/20 text-[#63f2c1] border border-[#2fe0a4]/40'
                          : 'bg-[#141817] text-[#9faba6] border border-[#333a37]'
                      }`}
                    >
                      ✓ 已验证
                    </button>
                    <button
                      onClick={() => handleMarkVerified(selectedPoint.i, false)}
                      className={`px-3 py-1 rounded text-xs ${
                        selectedPoint.verified === false
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          : 'bg-[#141817] text-[#9faba6] border border-[#333a37]'
                      }`}
                    >
                      ⚠ 待验证
                    </button>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedPointId(null)}
                      className="flex-1 px-4 py-2 bg-[#141817] border border-[#333a37] rounded text-sm hover:border-[#414a46] transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleDeletePoint(selectedPoint.i)}
                      className="px-4 py-2 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm hover:bg-red-500/20 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-[800px] overflow-y-auto">
                  {points.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[#6d7874] text-sm">
                      当前地图没有点位
                    </div>
                  ) : (
                    points.map((point) => {
                      const type = data.types[point.t];
                      return (
                        <button
                          key={point.i}
                          onClick={() => setSelectedPointId(point.i)}
                          className="w-full px-4 py-3 border-b border-[#242a28] text-left hover:bg-[#181d1b] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0"
                              style={{ backgroundColor: type?.color || '#96948e' }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-[#e6ecea] flex items-center gap-2">
                                {point.n}
                                {point.verified === false && (
                                  <span className="text-xs text-yellow-500">⚠️</span>
                                )}
                                {point.verified && (
                                  <span className="text-xs text-green-500">✓</span>
                                )}
                              </div>
                              <div className="text-xs text-[#6d7874] mt-1">
                                {type?.name || '未知类型'} · ({point.x.toFixed(3)}, {point.y.toFixed(3)})
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* 统计信息 */}
            <div className="mt-4 p-4 bg-[#141817] border border-[#242a28] rounded-lg">
              <h3 className="text-sm font-bold mb-3">数据统计</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9faba6]">总点位数：</span>
                  <span className="text-[#e6ecea]">{points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9faba6]">已验证：</span>
                  <span className="text-green-400">
                    {points.filter(p => p.verified).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9faba6]">待验证：</span>
                  <span className="text-yellow-400">
                    {points.filter(p => p.verified === false).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9faba6]">未标记：</span>
                  <span className="text-[#6d7874]">
                    {points.filter(p => p.verified == null).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
