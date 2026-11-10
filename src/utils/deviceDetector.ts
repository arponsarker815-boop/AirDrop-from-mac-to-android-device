import { DeviceType, DeviceInfo } from '../types';

export function detectCurrentDevice(): DeviceInfo {
  let id = localStorage.getItem('airdrop_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('airdrop_device_id', id);
  }

  const savedName = localStorage.getItem('airdrop_device_name');
  const savedColor = localStorage.getItem('airdrop_avatar_color');
  const savedRoom = localStorage.getItem('airdrop_room_code') || 'wifi-zone-1';

  const ua = navigator.userAgent;
  let type: DeviceType = 'pc';
  let model = 'Web Browser';

  if (/Android/i.test(ua)) {
    type = 'android';
    if (/Samsung/i.test(ua) || /SM-/i.test(ua)) {
      model = 'Samsung Galaxy S24 Ultra';
    } else if (/Pixel/i.test(ua)) {
      model = 'Google Pixel 8 Pro';
    } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
      model = 'Xiaomi Redmi Note';
    } else if (/OnePlus/i.test(ua)) {
      model = 'OnePlus 12';
    } else {
      model = 'Android Smartphone';
    }
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    type = 'mac';
    if (window.screen.width >= 1680) {
      model = 'MacBook Pro 16"';
    } else if (window.screen.width >= 1440) {
      model = 'MacBook Pro 14"';
    } else {
      model = 'MacBook Air M3';
    }
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    type = 'ios';
    model = /iPad/i.test(ua) ? 'iPad Pro' : 'iPhone 15 Pro';
  } else if (/Windows/i.test(ua)) {
    type = 'pc';
    model = 'Windows 11 PC';
  }

  const defaultName = savedName || (type === 'mac' ? 'MacBook Pro (M3)' : type === 'android' ? 'Galaxy Phone' : 'My Device');

  const colors = ['#0284c7', '#0d9488', '#e11d48', '#7c3aed', '#ea580c', '#16a34a'];
  const avatarColor = savedColor || colors[Math.floor(Math.random() * colors.length)];

  return {
    id,
    name: defaultName,
    type,
    model,
    avatarColor,
    roomCode: savedRoom,
    batteryLevel: 92,
    isCharging: false,
    subscriptionStatus: 'trial',
    subscriptionPlan: 'free',
  };
}

// Read actual hardware battery percentage and charging state via Web Battery API
export async function getRealBatteryStatus(): Promise<{ level: number; charging: boolean; supported: boolean }> {
  try {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: !!battery.charging,
        supported: true,
      };
    }
  } catch {
    // Battery API restricted
  }
  return {
    level: 92,
    charging: false,
    supported: false,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileCategory(fileType: string, fileName: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'text' {
  if (fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|heic|raw|dng)$/i.test(fileName)) {
    return 'image';
  }
  if (fileType.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(fileName)) {
    return 'video';
  }
  if (fileType.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(fileName)) {
    return 'audio';
  }
  if (fileType.startsWith('text/') || /\.(txt|md|json|js|ts|html|css|py)$/i.test(fileName)) {
    return 'text';
  }
  if (/\.(zip|tar|gz|rar|7z)$/i.test(fileName)) {
    return 'archive';
  }
  return 'document';
}
