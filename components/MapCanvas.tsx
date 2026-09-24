'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group } from 'react-konva';
import { useAppStore } from '@/lib/store';
import type { Point, PointType } from '@/lib/types';
import Konva from 'konva';

interface MapCanvasProps {
  mapImage: string;
  points: Point[];
  types: Record<string, PointType>;
  onPointClick?: (point: Point) => void;
}

const MAP_SIZE = 1000; // 地图参考尺寸

export function MapCanvas({ mapImage, points, types, onPointClick }: MapCanvasProps) {
  const { viewport, setViewport, selectedPointId } = useAppStore();
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // 加载地图图片
  useEffect(() => {
    const img = new window.Image();
    img.src = mapImage;
    img.onload = () => setBgImage(img);
  }, [mapImage]);

  // 计算视口尺寸
  const containerSize = 800;
  const scale = containerSize / (viewport.w * MAP_SIZE);

  // 只渲染视野内的点位（性能优化）
  const visiblePoints = points.filter(p => {
    const buffer = 0.1; // 额外渲染边缘外10%的点
    return p.x >= viewport.x - buffer && p.x <= viewport.x + viewport.w + buffer &&
           p.y >= viewport.y - buffer && p.y <= viewport.y + viewport.w + buffer;
  });

  // 处理缩放
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x / oldScale) + viewport.x * MAP_SIZE,
      y: (pointer.y / oldScale) + viewport.y * MAP_SIZE,
    };

    const delta = e.evt.deltaY > 0 ? 1.1 : 0.9;
    const newW = Math.max(0.1, Math.min(1.6, viewport.w * delta));
    const newScale = containerSize / (newW * MAP_SIZE);

    const newX = (mousePointTo.x - pointer.x / newScale) / MAP_SIZE;
    const newY = (mousePointTo.y - pointer.y / newScale) / MAP_SIZE;

    setViewport({
      x: Math.max(-newW * 0.15, Math.min(1 - newW * 0.85, newX)),
      y: Math.max(-newW * 0.15, Math.min(1 - newW * 0.85, newY)),
      w: newW
    });
  };

  // 处理拖动
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 只有点击背景或地图图片时才允许拖动，点击点位时不拖动
    const clickedOnEmpty = e.target === e.target.getStage() ||
                          e.target.getLayer() === e.target ||
                          e.target.constructor.name === 'Image';

    if (clickedOnEmpty) {
      isDragging.current = true;
      const stage = stageRef.current;
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos) {
          lastPos.current = pos;
        }
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDragging.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const dx = (pos.x - lastPos.current.x) / scale / MAP_SIZE;
    const dy = (pos.y - lastPos.current.y) / scale / MAP_SIZE;

    setViewport({
      x: Math.max(-viewport.w * 0.15, Math.min(1 - viewport.w * 0.85, viewport.x - dx)),
      y: Math.max(-viewport.w * 0.15, Math.min(1 - viewport.w * 0.85, viewport.y - dy)),
      w: viewport.w
    });

    lastPos.current = pos;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // 获取点位颜色
  const getPointColor = (point: Point) => {
    const type = types[point.t];
    return type?.color || '#96948e';
  };

  // 获取点位大小
  const getPointSize = (point: Point) => {
    const type = types[point.t];
    const baseSize = (type?.size || 1) * 6;
    return point.i === selectedPointId ? baseSize * 1.5 : baseSize;
  };

  return (
    <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={containerSize}
        height={containerSize}
        scaleX={scale}
        scaleY={scale}
        x={-viewport.x * MAP_SIZE * scale}
        y={-viewport.y * MAP_SIZE * scale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* 地图底图 */}
        <Layer>
          {bgImage && (
            <KonvaImage
              image={bgImage}
              width={MAP_SIZE}
              height={MAP_SIZE}
            />
          )}
        </Layer>

        {/* 点位层 */}
        <Layer>
          {visiblePoints.map((point) => {
            const isSelected = point.i === selectedPointId;
            return (
              <Group
                key={point.i}
                x={point.x * MAP_SIZE}
                y={point.y * MAP_SIZE}
                onClick={() => onPointClick?.(point)}
              >
                <Circle
                  radius={getPointSize(point)}
                  fill={getPointColor(point)}
                  stroke={isSelected ? '#fff' : '#000'}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={point.verified === false ? 0.6 : 1}
                />
                {isSelected && (
                  <Text
                    text={point.n}
                    fontSize={12}
                    fill="#fff"
                    x={getPointSize(point) + 5}
                    y={-6}
                  />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* 缩放控制 */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-1 bg-gray-800 rounded-md overflow-hidden">
        <button
          onClick={() => setViewport({ ...viewport, w: Math.max(0.1, viewport.w * 0.8) })}
          className="px-3 py-2 hover:bg-gray-700 text-white text-sm"
          title="放大"
        >
          +
        </button>
        <button
          onClick={() => setViewport({ ...viewport, w: Math.min(1.6, viewport.w * 1.2) })}
          className="px-3 py-2 hover:bg-gray-700 text-white text-sm"
          title="缩小"
        >
          −
        </button>
        <button
          onClick={() => setViewport({ x: 0, y: 0, w: 1 })}
          className="px-3 py-2 hover:bg-gray-700 text-white text-sm"
          title="复位"
        >
          ⊡
        </button>
      </div>
    </div>
  );
}
