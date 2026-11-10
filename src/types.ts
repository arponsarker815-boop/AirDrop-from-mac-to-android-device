export type DeviceType = 'mac' | 'android' | 'ios' | 'pc';

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'trial' | 'pending' | 'active' | 'expired';

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  avatarColor: string;
  roomCode: string;
  batteryLevel?: number;
  isCharging?: boolean;
  wifiSignalDbm?: number;
  ipAddress?: string;
  isSimulator?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
}

export interface PeerDevice extends DeviceInfo {
  lastSeen?: number;
  distanceLabel?: string;
  transferCount?: number;
}

export interface FileItemDetail {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  resolution?: string;
}

export interface TransferItem {
  id: string;
  senderId: string;
  targetId: string;
  senderName: string;
  senderType: DeviceType;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl?: string;
  textContent?: string;
  status: 'pending' | 'accepted' | 'declined' | 'uploading' | 'downloading' | 'completed' | 'cancelled';
  progress: number;
  speed?: string;
  downloadUrl?: string;
  timestamp: number;
  blob?: Blob;
  files?: FileItemDetail[];
  resolution?: string;
}

export interface HistoryRecord {
  id: string;
  direction: 'sent' | 'received';
  fileName: string;
  fileSize: number;
  fileType: string;
  peerName: string;
  peerType: DeviceType;
  timestamp: number;
  downloadUrl?: string;
  previewUrl?: string;
  textContent?: string;
  resolution?: string;
  fileCount?: number;
}

export interface PaymentRequest {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  plan: SubscriptionPlan;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  senderNumber: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  approvedAt?: number;
  notes?: string;
}

export interface AdminSettings {
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  freeTransfersLimit: number;
  adminPin: string;
  adminEmail: string;
}

export interface UserSubscription {
  status: SubscriptionStatus;
  plan?: SubscriptionPlan;
  expiresAt?: number;
  freeTransfersLeft: number;
  trxId?: string;
  hasSubmittedPayment?: boolean;
}
