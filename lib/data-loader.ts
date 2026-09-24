import type { LootData } from './types';

let cachedData: LootData | null = null;

export async function loadLootData(): Promise<LootData> {
  if (cachedData) return cachedData;

  // 动态加载旧版 data.js
  const response = await fetch('/data/data.js');
  const text = await response.text();

  // 执行脚本并提取 window.LOOT_DATA
  const scriptEl = document.createElement('script');
  scriptEl.textContent = text;
  document.head.appendChild(scriptEl);

  const data = (window as any).LOOT_DATA as LootData;
  document.head.removeChild(scriptEl);

  if (!data) {
    throw new Error('Failed to load LOOT_DATA');
  }

  cachedData = data;
  return data;
}

export function getMapImage(mapId: string): string {
  const imageMap: Record<string, string> = {
    'zero-dam': '/maps/zero-dam-bg.jpg',
    'longbow': '/maps/longbow-bg.jpg',
    'az3': '/maps/az3-bg.jpg',
    'bks': '/maps/bks-bg.jpg',
    'prison': '/maps/prison-bg.jpg',
    'htjd': '/maps/htjd-bg.jpg',
  };
  return imageMap[mapId] || imageMap['zero-dam'];
}
