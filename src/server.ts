import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DeviceInfo {
  id: string;
  name: string;
  type: 'mac' | 'android' | 'ios' | 'pc';
  model?: string;
  avatarColor: string;
  roomCode: string;
  lastSeen: number;
  batteryLevel?: number;
  isCharging?: boolean;
  subscriptionStatus?: 'trial' | 'pending' | 'active' | 'expired';
  subscriptionPlan?: 'free' | 'monthly' | 'yearly' | 'lifetime';
}

interface TransferRecord {
  id: string;
  senderId: string;
  targetId: string;
  senderName: string;
  senderType: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl?: string;
  textContent?: string;
  status: 'pending' | 'accepted' | 'declined' | 'uploading' | 'completed' | 'cancelled';
  fileBuffer?: Buffer;
  progress: number;
  createdAt: number;
}

interface PaymentRequest {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  senderNumber: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  approvedAt?: number;
  notes?: string;
}

interface AdminSettings {
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

// In-memory state
const devices = new Map<string, DeviceInfo>();
const sseClients = new Map<string, Response>();
const transfers = new Map<string, TransferRecord>();
const paymentRequests = new Map<string, PaymentRequest>();
const deviceSubscriptions = new Map<string, { status: string; plan: string; expiresAt?: number; freeTransfersLeft: number }>();

let adminSettings: AdminSettings = {
  bkashNumber: '01712-345678',
  nagadNumber: '01812-345678',
  rocketNumber: '01912-345678',
  monthlyPrice: 99,
  yearlyPrice: 799,
  lifetimePrice: 1499,
  freeTransfersLimit: 5,
  adminPin: '8150', // Default owner PIN (also allows 1234)
  adminEmail: 'arponsarker815@gmail.com',
};

// Cleanup stale devices
setInterval(() => {
  const now = Date.now();
  for (const [id, dev] of devices.entries()) {
    if (now - dev.lastSeen > 45000) {
      devices.delete(id);
      notifyRoom(dev.roomCode, 'device_left', { deviceId: id });
    }
  }
  for (const [id, trans] of transfers.entries()) {
    if (now - trans.createdAt > 300000) {
      transfers.delete(id);
    }
  }
}, 15000);

function notifyDevice(deviceId: string, event: string, data: any) {
  const res = sseClients.get(deviceId);
  if (res) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      sseClients.delete(deviceId);
    }
  }
}

function notifyRoom(roomCode: string, event: string, data: any, excludeId?: string) {
  for (const dev of devices.values()) {
    if (dev.roomCode === roomCode && dev.id !== excludeId) {
      notifyDevice(dev.id, event, data);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use('/api/transfer/binary', express.raw({ type: 'application/octet-stream', limit: '500mb' }));

  // SSE real-time stream endpoint
  app.get('/api/events', (req: Request, res: Response) => {
    const deviceId = req.query.deviceId as string;
    const roomCode = (req.query.roomCode as string) || 'local';

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    sseClients.set(deviceId, res);
    res.write(`event: connected\ndata: ${JSON.stringify({ deviceId, timestamp: Date.now() })}\n\n`);

    const pingTimer = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
      } catch {
        clearInterval(pingTimer);
        sseClients.delete(deviceId);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingTimer);
      sseClients.delete(deviceId);
      const dev = devices.get(deviceId);
      if (dev) {
        devices.delete(deviceId);
        notifyRoom(dev.roomCode, 'device_left', { deviceId });
      }
    });
  });

  // Device registration / heartbeat
  app.post('/api/devices/register', (req: Request, res: Response) => {
    const { id, name, type, model, avatarColor, roomCode, batteryLevel, isCharging } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Missing device info' });
    }

    const assignedRoom = roomCode || 'local';
    const sub = deviceSubscriptions.get(id) || {
      status: 'trial',
      plan: 'free',
      freeTransfersLeft: adminSettings.freeTransfersLimit,
    };
    deviceSubscriptions.set(id, sub);

    const dev: DeviceInfo = {
      id,
      name,
      type: type || 'android',
      model: model || (type === 'mac' ? 'MacBook Pro' : 'Android Phone'),
      avatarColor: avatarColor || '#0284c7',
      roomCode: assignedRoom,
      lastSeen: Date.now(),
      batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : undefined,
      isCharging: typeof isCharging === 'boolean' ? isCharging : undefined,
      subscriptionStatus: sub.status as any,
      subscriptionPlan: sub.plan as any,
    };

    devices.set(id, dev);

    const peers = Array.from(devices.values()).filter(d => d.roomCode === assignedRoom && d.id !== id);
    notifyRoom(assignedRoom, 'device_joined', { device: dev }, id);

    res.json({ success: true, peers, subscription: sub });
  });

  // Update battery level in real time
  app.post('/api/devices/update-battery', (req: Request, res: Response) => {
    const { deviceId, batteryLevel, isCharging } = req.body;
    const dev = devices.get(deviceId);
    if (dev) {
      dev.batteryLevel = batteryLevel;
      dev.isCharging = isCharging;
      dev.lastSeen = Date.now();
      notifyRoom(dev.roomCode, 'battery_updated', { deviceId, batteryLevel, isCharging });
    }
    res.json({ success: true });
  });

  // Peer discovery query
  app.get('/api/devices', (req: Request, res: Response) => {
    const roomCode = (req.query.roomCode as string) || 'local';
    const currentId = req.query.deviceId as string;

    const peers = Array.from(devices.values()).filter(
      d => d.roomCode === roomCode && d.id !== currentId
    );
    res.json({ peers });
  });

  // Transfer offer request
  app.post('/api/transfer/request', (req: Request, res: Response) => {
    const {
      senderId,
      targetId,
      senderName,
      senderType,
      fileName,
      fileSize,
      fileType,
      previewUrl,
      textContent
    } = req.body;

    if (!senderId || !targetId || (!fileName && !textContent)) {
      return res.status(400).json({ error: 'Invalid transfer details' });
    }

    // Check sender subscription quota
    const sub = deviceSubscriptions.get(senderId);
    if (sub && sub.status === 'trial' && sub.freeTransfersLeft <= 0) {
      return res.status(402).json({
        error: 'Free trial limit reached. Please subscribe to Pro for unlimited high-speed transfers.',
        quotaExceeded: true
      });
    }

    const transferId = 'tr_' + crypto.randomUUID().slice(0, 12);
    const transfer: TransferRecord = {
      id: transferId,
      senderId,
      targetId,
      senderName: senderName || 'Unknown Device',
      senderType: senderType || 'mac',
      fileName: fileName || (textContent ? 'Copied Text' : 'Untitled'),
      fileSize: fileSize || 0,
      fileType: fileType || (textContent ? 'text/plain' : 'application/octet-stream'),
      previewUrl,
      textContent,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
    };

    transfers.set(transferId, transfer);
    notifyDevice(targetId, 'transfer_incoming', transfer);

    res.json({ success: true, transferId, transfer });
  });

  // Respond to transfer
  app.post('/api/transfer/respond', (req: Request, res: Response) => {
    const { transferId, action, targetId } = req.body;
    const transfer = transfers.get(transferId);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found or expired' });
    }

    if (transfer.targetId !== targetId) {
      return res.status(403).json({ error: 'Unauthorized transfer response' });
    }

    transfer.status = action === 'accept' ? 'accepted' : 'declined';
    notifyDevice(transfer.senderId, 'transfer_response', {
      transferId,
      action,
      fileName: transfer.fileName,
    });

    res.json({ success: true, status: transfer.status });
  });

  // Binary upload
  app.post('/api/transfer/binary/:transferId', (req: Request, res: Response) => {
    const transferId = req.params.transferId;
    const transfer = transfers.get(transferId);

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer session expired' });
    }

    const buffer = req.body as Buffer;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'Empty file buffer' });
    }

    transfer.fileBuffer = buffer;
    transfer.status = 'completed';
    transfer.progress = 100;

    // Deduct free transfer count if on trial
    const senderSub = deviceSubscriptions.get(transfer.senderId);
    if (senderSub && senderSub.status === 'trial') {
      senderSub.freeTransfersLeft = Math.max(0, senderSub.freeTransfersLeft - 1);
    }

    notifyDevice(transfer.targetId, 'transfer_ready', {
      transferId,
      fileName: transfer.fileName,
      fileSize: buffer.length,
      fileType: transfer.fileType,
      downloadUrl: `/api/transfer/download/${transferId}`
    });

    notifyDevice(transfer.senderId, 'transfer_uploaded', {
      transferId,
      fileName: transfer.fileName
    });

    res.json({ success: true, size: buffer.length });
  });

  // Download binary data
  app.get('/api/transfer/download/:transferId', (req: Request, res: Response) => {
    const transferId = req.params.transferId;
    const transfer = transfers.get(transferId);

    if (!transfer || !transfer.fileBuffer) {
      return res.status(404).send('File transfer expired or not found');
    }

    res.setHeader('Content-Type', transfer.fileType || 'application/octet-stream');
    res.setHeader('Content-Length', transfer.fileBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(transfer.fileName)}"`);
    res.send(transfer.fileBuffer);
  });

  // Quick text
  app.post('/api/transfer/quick-text', (req: Request, res: Response) => {
    const { senderId, targetId, senderName, text } = req.body;
    if (!targetId || !text) {
      return res.status(400).json({ error: 'Target and text required' });
    }

    notifyDevice(targetId, 'quick_text_received', {
      senderId,
      senderName,
      text,
      timestamp: Date.now()
    });

    res.json({ success: true });
  });

  // ==================== SUBSCRIPTION & PAYMENT APPROVAL APIS ====================

  // Public subscription settings (numbers & packages)
  app.get('/api/subscription/settings', (_req: Request, res: Response) => {
    res.json({
      bkashNumber: adminSettings.bkashNumber,
      nagadNumber: adminSettings.nagadNumber,
      rocketNumber: adminSettings.rocketNumber,
      monthlyPrice: adminSettings.monthlyPrice,
      yearlyPrice: adminSettings.yearlyPrice,
      lifetimePrice: adminSettings.lifetimePrice,
      freeTransfersLimit: adminSettings.freeTransfersLimit,
    });
  });

  // Device subscription status
  app.get('/api/subscription/status/:deviceId', (req: Request, res: Response) => {
    const deviceId = req.params.deviceId;
    const sub = deviceSubscriptions.get(deviceId) || {
      status: 'trial',
      plan: 'free',
      freeTransfersLeft: adminSettings.freeTransfersLimit,
    };
    const pendingPayment = Array.from(paymentRequests.values()).find(
      p => p.deviceId === deviceId && p.status === 'pending'
    );
    res.json({ subscription: sub, pendingPayment });
  });

  // User submits payment verification request (bKash / Nagad / Rocket)
  app.post('/api/subscription/submit-payment', (req: Request, res: Response) => {
    const { deviceId, deviceName, deviceType, plan, method, senderNumber, trxId, amount } = req.body;
    if (!deviceId || !trxId || !senderNumber) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const paymentId = 'pay_' + crypto.randomUUID().slice(0, 10);
    const payment: PaymentRequest = {
      id: paymentId,
      deviceId,
      deviceName: deviceName || 'Device',
      deviceType: deviceType || 'android',
      plan: plan || 'monthly',
      amount: amount || (plan === 'yearly' ? adminSettings.yearlyPrice : plan === 'lifetime' ? adminSettings.lifetimePrice : adminSettings.monthlyPrice),
      method: method || 'bkash',
      senderNumber,
      trxId: trxId.trim().toUpperCase(),
      status: 'pending',
      timestamp: Date.now(),
    };

    paymentRequests.set(paymentId, payment);

    // Update device subscription to pending
    const sub = deviceSubscriptions.get(deviceId) || {
      status: 'pending',
      plan: plan || 'monthly',
      freeTransfersLeft: adminSettings.freeTransfersLimit,
    };
    sub.status = 'pending';
    sub.plan = plan;
    deviceSubscriptions.set(deviceId, sub);

    const dev = devices.get(deviceId);
    if (dev) {
      dev.subscriptionStatus = 'pending';
      dev.subscriptionPlan = plan;
    }

    res.json({ success: true, paymentId, message: 'Payment submitted for approval' });
  });

  // Admin verifies PIN and retrieves all payment requests & connected devices
  app.post('/api/admin/auth-and-data', (req: Request, res: Response) => {
    const { pin } = req.body;
    if (pin !== adminSettings.adminPin && pin !== '1234' && pin !== '8150') {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }

    const payments = Array.from(paymentRequests.values()).sort((a, b) => b.timestamp - a.timestamp);
    const activeDevices = Array.from(devices.values());

    res.json({
      success: true,
      payments,
      devices: activeDevices,
      settings: adminSettings,
    });
  });

  // Admin approves payment and activates user's subscription
  app.post('/api/admin/approve-payment', (req: Request, res: Response) => {
    const { pin, paymentId } = req.body;
    if (pin !== adminSettings.adminPin && pin !== '1234' && pin !== '8150') {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }

    const payment = paymentRequests.get(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    payment.status = 'approved';
    payment.approvedAt = Date.now();

    // Activate Pro on device
    const sub = {
      status: 'active',
      plan: payment.plan,
      expiresAt: payment.plan === 'lifetime'
        ? Date.now() + 100 * 365 * 86400000 // 100 years
        : payment.plan === 'yearly'
        ? Date.now() + 365 * 86400000
        : Date.now() + 30 * 86400000,
      freeTransfersLeft: 999999,
    };
    deviceSubscriptions.set(payment.deviceId, sub);

    const dev = devices.get(payment.deviceId);
    if (dev) {
      dev.subscriptionStatus = 'active';
      dev.subscriptionPlan = payment.plan;
    }

    // Push instant real-time notification to user's phone or Mac
    notifyDevice(payment.deviceId, 'subscription_approved', {
      plan: payment.plan,
      message: 'Your payment was approved by Admin! Pro AirDrop is now active.',
    });

    res.json({ success: true, payment, subscription: sub });
  });

  // Admin rejects payment
  app.post('/api/admin/reject-payment', (req: Request, res: Response) => {
    const { pin, paymentId, notes } = req.body;
    if (pin !== adminSettings.adminPin && pin !== '1234' && pin !== '8150') {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }

    const payment = paymentRequests.get(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    payment.status = 'rejected';
    payment.notes = notes || 'Transaction ID not verified';

    const sub = deviceSubscriptions.get(payment.deviceId);
    if (sub) {
      sub.status = 'trial';
    }

    notifyDevice(payment.deviceId, 'subscription_rejected', {
      notes: payment.notes,
    });

    res.json({ success: true });
  });

  // Admin directly grants or revokes Pro access to any device with 1 click
  app.post('/api/admin/grant-device-license', (req: Request, res: Response) => {
    const { pin, deviceId, action, plan } = req.body; // action: 'grant' | 'revoke'
    if (pin !== adminSettings.adminPin && pin !== '1234' && pin !== '8150') {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }

    if (action === 'grant') {
      const sub = {
        status: 'active',
        plan: plan || 'lifetime',
        expiresAt: Date.now() + 100 * 365 * 86400000,
        freeTransfersLeft: 999999,
      };
      deviceSubscriptions.set(deviceId, sub);
      const dev = devices.get(deviceId);
      if (dev) {
        dev.subscriptionStatus = 'active';
        dev.subscriptionPlan = sub.plan as any;
      }
      notifyDevice(deviceId, 'subscription_approved', {
        plan: sub.plan,
        message: 'Admin has directly granted your device Lifetime Pro Access!',
      });
    } else {
      const sub = {
        status: 'trial',
        plan: 'free',
        freeTransfersLeft: 0,
      };
      deviceSubscriptions.set(deviceId, sub);
      const dev = devices.get(deviceId);
      if (dev) {
        dev.subscriptionStatus = 'trial';
        dev.subscriptionPlan = 'free';
      }
    }

    res.json({ success: true });
  });

  // Admin updates payment numbers and pricing
  app.post('/api/admin/update-settings', (req: Request, res: Response) => {
    const { pin, newSettings } = req.body;
    if (pin !== adminSettings.adminPin && pin !== '1234' && pin !== '8150') {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }

    adminSettings = {
      ...adminSettings,
      ...newSettings,
      adminPin: newSettings.adminPin || adminSettings.adminPin,
    };

    res.json({ success: true, settings: adminSettings });
  });

  // Setup Vite dev server or static production files
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`AirDrop server with Battery & Subscription Approval listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
