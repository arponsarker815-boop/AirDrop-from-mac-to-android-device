import React from 'react';
import { Laptop, Smartphone, Monitor, Tablet, Wifi, BatteryCharging, Battery, Zap, Crown } from 'lucide-react';
import { DeviceType, SubscriptionStatus } from '../types';

interface Props {
  type: DeviceType;
  name: string;
  model?: string;
  avatarColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLocal?: boolean;
  isSending?: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  onClick?: () => void;
}

export const DeviceAvatar: React.FC<Props> = ({
  type,
  name,
  model,
  avatarColor = '#0284c7',
  size = 'md',
  isLocal = false,
  isSending = false,
  batteryLevel = 92,
  isCharging = false,
  subscriptionStatus,
  onClick,
}) => {
  const sizeMap = {
    sm: { container: 'w-12 h-12', icon: 18, text: 'text-xs', subtext: 'text-[10px]' },
    md: { container: 'w-18 h-18', icon: 26, text: 'text-xs', subtext: 'text-[11px]' },
    lg: { container: 'w-22 h-22', icon: 34, text: 'text-sm', subtext: 'text-xs' },
    xl: { container: 'w-28 h-28', icon: 42, text: 'text-base', subtext: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  const getDeviceIcon = () => {
    switch (type) {
      case 'mac':
        return <Laptop size={currentSize.icon} className="text-white drop-shadow-md" />;
      case 'android':
        return <Smartphone size={currentSize.icon} className="text-white drop-shadow-md" />;
      case 'ios':
        return <Tablet size={currentSize.icon} className="text-white drop-shadow-md" />;
      default:
        return <Monitor size={currentSize.icon} className="text-white drop-shadow-md" />;
    }
  };

  const getBatteryColor = () => {
    if (isCharging) return 'text-amber-400';
    if (batteryLevel >= 50) return 'text-emerald-400';
    if (batteryLevel >= 20) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocal && !onClick}
      className={`group relative flex flex-col items-center text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-3xl p-2.5 ${
        onClick
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : 'cursor-default'
      }`}
    >
      <div className="relative">
        {/* Active Sending Animation Ring */}
        {isSending && (
          <div className="absolute -inset-2.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        )}

        {/* Ambient Glow */}
        <div
          style={{ backgroundColor: avatarColor }}
          className="absolute inset-0 rounded-full blur-xl opacity-35 group-hover:opacity-70 transition-opacity pointer-events-none"
        />

        {/* Outer Frosted Shell */}
        <div
          style={{
            background: `radial-gradient(circle at 30% 30%, ${avatarColor}dd, #0f172a 90%)`,
          }}
          className={`${currentSize.container} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-white/20 group-hover:ring-sky-400/60 transition-all border border-white/10`}
        >
          {getDeviceIcon()}
        </div>

        {/* Pro Crown Badge */}
        {subscriptionStatus === 'active' && (
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-slate-900">
            <Crown size={12} className="fill-slate-950" />
          </div>
        )}

        {/* High-Resolution OS Badge */}
        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider bg-slate-950/90 border border-slate-700/80 text-sky-400 shadow-md backdrop-blur-sm">
          {type === 'mac' ? 'macOS' : type === 'android' ? 'Android' : type.toUpperCase()}
        </div>

        {/* Local Indicator Badge */}
        {isLocal && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
        )}
      </div>

      <div className="mt-2.5 max-w-[130px]">
        <p className={`font-bold text-white truncate drop-shadow-sm ${currentSize.text}`}>
          {name}
        </p>

        {model && (
          <p className={`text-slate-400 truncate mt-0.5 font-medium ${currentSize.subtext}`}>
            {model}
          </p>
        )}

        {/* Accurate Battery & Charging Indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-400">
          <span className={`flex items-center gap-0.5 font-mono font-bold ${getBatteryColor()}`}>
            {isCharging ? (
              <Zap size={11} className="fill-amber-400 animate-pulse text-amber-400" />
            ) : (
              <Battery size={11} />
            )}
            <span>{batteryLevel}%</span>
            {isCharging && <span className="text-[9px] uppercase tracking-tighter ml-0.5">Plugged</span>}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-0.5 text-sky-400 font-medium">
            <Wifi size={10} />
            <span>5G</span>
          </span>
        </div>

        {isLocal && (
          <span className="inline-block mt-0.5 text-[10px] font-semibold text-sky-400/90">
            (This Device)
          </span>
        )}
      </div>
    </button>
  );
};
