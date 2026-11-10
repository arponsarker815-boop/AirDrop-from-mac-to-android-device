/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { DeviceInfo, PeerDevice, TransferItem, HistoryRecord, UserSubscription, AdminSettings, SubscriptionPlan } from './types';
import { detectCurrentDevice, getRealBatteryStatus } from './utils/deviceDetector';
import { sound } from './utils/audio';
import { translations, Language } from './locales/strings';
import { Header } from './components/Header';
import { RadarView } from './components/RadarView';
import { SendModal } from './components/SendModal';
import { IncomingSheet } from './components/IncomingSheet';
import { TransferProgressModal } from './components/TransferProgressModal';
import { PairingModal } from './components/PairingModal';
import { ClipboardSyncModal } from './components/ClipboardSyncModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { DualDeviceSimulator } from './components/DualDeviceSimulator';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminApprovalModal } from './components/AdminApprovalModal';
import { Smartphone, Laptop, Sparkles, Wifi, ShieldCheck, Zap, Crown, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [isMuted, setIsMuted] = useState(false);
  const [localDevice, setLocalDevice] = useState<DeviceInfo>(() => detectCurrentDevice());
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [roomCode, setRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      if (urlRoom) return urlRoom;
    }
    return localStorage.getItem('airdrop_room_code') || 'wifi-zone-1';
  });

  // Subscription & Admin states
  const [subscription, setSubscription] = useState<UserSubscription>({
    status: 'trial',
    plan: 'free',
    freeTransfersLeft: 5,
  });
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    bkashNumber: '01712-345678',
    nagadNumber: '01812-345678',
    rocketNumber: '01912-345678',
    monthlyPrice: 99,
    yearlyPrice: 799,
    lifetimePrice: 1499,
    freeTransfersLimit: 5,
    adminPin: '8150',
    adminEmail: 'arponsarker815@gmail.com',
  });
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Modals & Sheets
  const [selectedPeerForSend, setSelectedPeerForSend] = useState<PeerDevice | null>(null);
  const [incomingTransfer, setIncomingTransfer] = useState<TransferItem | null>(null);
  const [activeTransferModal, setActiveTransferModal] = useState<TransferItem | null>(null);
  const [isSenderModal, setIsSenderModal] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTextSyncOpen, setIsTextSyncOpen] = useState(false);
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [approvalAlert, setApprovalAlert] = useState<string | null>(null);

  // Transfer history
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('airdrop_transfer_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const incomingTransferRef = useRef<TransferItem | null>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('airdrop_transfer_history', JSON.stringify(history.slice(0, 50)));
    } catch {}
  }, [history]);

  // Real Hardware Battery API integration
  useEffect(() => {
    let batteryObj: any = null;

    const setupBattery = async () => {
      const initial = await getRealBatteryStatus();
      setLocalDevice((prev) => ({
        ...prev,
        batteryLevel: initial.level,
        isCharging: initial.charging,
      }));

      try {
        if ('getBattery' in navigator) {
          batteryObj = await (navigator as any).getBattery();
          const update = () => {
            const lvl = Math.round(batteryObj.level * 100);
            const chg = !!batteryObj.charging;
            setLocalDevice((prev) => ({
              ...prev,
              batteryLevel: lvl,
              isCharging: chg,
            }));
            fetch('/api/devices/update-battery', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceId: localDevice.id,
                batteryLevel: lvl,
                isCharging: chg,
              }),
            }).catch(() => {});
          };

          batteryObj.addEventListener('levelchange', update);
          batteryObj.addEventListener('chargingchange', update);
        }
      } catch {}
    };

    setupBattery();

    return () => {
      if (batteryObj) {
        try {
          batteryObj.removeEventListener('levelchange', () => {});
          batteryObj.removeEventListener('chargingchange', () => {});
        } catch {}
      }
    };
  }, [localDevice.id]);

  // Fetch public subscription settings
  useEffect(() => {
    fetch('/api/subscription/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAdminSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    // Check device subscription status
    fetch(`/api/subscription/status/${localDevice.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.subscription) {
          setSubscription(data.subscription);
        }
      })
      .catch(() => {});
  }, [localDevice.id]);

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setSoundEnabled(!nextMuted);
  };

  // Register device and establish SSE connection
  useEffect(() => {
    let sse: EventSource | null = null;
    let heartbeatTimer: any = null;

    const registerAndConnect = async () => {
      try {
        const regRes = await fetch('/api/devices/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: localDevice.id,
            name: localDevice.name,
            type: localDevice.type,
            model: localDevice.model,
            avatarColor: localDevice.avatarColor,
            roomCode,
            batteryLevel: localDevice.batteryLevel,
            isCharging: localDevice.isCharging,
          }),
        });

        if (regRes.ok) {
          const data = await regRes.json();
          if (data.peers) setPeers(data.peers);
          if (data.subscription) setSubscription(data.subscription);
        }
      } catch (err) {
        console.warn('Backend registration retry:', err);
      }

      // Open SSE stream
      sse = new EventSource(`/api/events?deviceId=${encodeURIComponent(localDevice.id)}&roomCode=${encodeURIComponent(roomCode)}`);

      sse.addEventListener('device_joined', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.device && payload.device.id !== localDevice.id) {
            setPeers((prev) => {
              const filtered = prev.filter((p) => p.id !== payload.device.id);
              return [...filtered, payload.device];
            });
          }
        } catch {}
      });

      sse.addEventListener('device_left', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.deviceId) {
            setPeers((prev) => prev.filter((p) => p.id !== payload.deviceId));
          }
        } catch {}
      });

      // Real-time battery update from peer device
      sse.addEventListener('battery_updated', (e: MessageEvent) => {
        try {
          const { deviceId, batteryLevel, isCharging } = JSON.parse(e.data);
          setPeers((prev) =>
            prev.map((peer) =>
              peer.id === deviceId
                ? { ...peer, batteryLevel, isCharging }
                : peer
            )
          );
        } catch {}
      });

      // Recipient receives incoming transfer
      sse.addEventListener('transfer_incoming', (e: MessageEvent) => {
        try {
          const transferData = JSON.parse(e.data) as TransferItem;
          incomingTransferRef.current = transferData;
          sound.playIncomingPing();
          setIncomingTransfer(transferData);
        } catch {}
      });

      // Real-time subscription approval notification from Admin!
      sse.addEventListener('subscription_approved', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          sound.playSuccessTone();
          try {
            confetti({ particleCount: 70, spread: 80 });
          } catch {}
          setSubscription({
            status: 'active',
            plan: payload.plan || 'monthly',
            freeTransfersLeft: 999999,
          });
          setLocalDevice((prev) => ({
            ...prev,
            subscriptionStatus: 'active',
            subscriptionPlan: payload.plan,
          }));
          setApprovalAlert(
            lang === 'bn'
              ? 'অভিনন্দন! আপনার পেমেন্ট অ্যাডমিন কর্তৃক অনুমোদিত হয়েছে। প্রো আনলিমিটেড লাইসেন্স সক্রিয়!'
              : 'Congratulations! Your payment has been approved by Admin. Pro is active!'
          );
          setTimeout(() => setApprovalAlert(null), 6000);
        } catch {}
      });

      // Real-time subscription rejection notification
      sse.addEventListener('subscription_rejected', () => {
        sound.playDeclineTone();
        setSubscription((prev) => ({ ...prev, status: 'trial' }));
      });

      // Sender receives accept / decline response
      sse.addEventListener('transfer_response', async (e: MessageEvent) => {
        try {
          const { transferId, action } = JSON.parse(e.data);
          const fileToUpload = pendingFilesRef.current.get(transferId);

          if (action === 'accept' && fileToUpload) {
            sound.playSendChirp();
            setActiveTransferModal((prev) =>
              prev ? { ...prev, status: 'uploading', progress: 10, speed: '24.2 MB/s' } : null
            );

            try {
              const buffer = await fileToUpload.arrayBuffer();
              const uploadRes = await fetch(`/api/transfer/binary/${transferId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
              });

              if (uploadRes.ok) {
                sound.playSuccessTone();
                setActiveTransferModal((prev) =>
                  prev ? { ...prev, status: 'completed', progress: 100 } : null
                );
                setHistory((prev) => [
                  {
                    id: transferId,
                    direction: 'sent',
                    fileName: fileToUpload.name,
                    fileSize: fileToUpload.size,
                    fileType: fileToUpload.type,
                    peerName: selectedPeerForSend?.name || 'Device',
                    peerType: selectedPeerForSend?.type || 'android',
                    timestamp: Date.now(),
                  },
                  ...prev,
                ]);

                // Update free trial quota count
                setSubscription((prev) =>
                  prev.status === 'trial'
                    ? { ...prev, freeTransfersLeft: Math.max(0, prev.freeTransfersLeft - 1) }
                    : prev
                );
              } else {
                console.error('Upload returned non-OK status:', uploadRes.status);
              }
            } catch (upErr) {
              console.error('Upload error:', upErr);
            }
          } else if (action === 'decline') {
            sound.playDeclineTone();
            setActiveTransferModal((prev) =>
              prev ? { ...prev, status: 'declined', progress: 0 } : null
            );
          }
        } catch {}
      });

      // Recipient receives file ready event
      sse.addEventListener('transfer_ready', (e: MessageEvent) => {
        try {
          const { transferId, fileName, fileSize, fileType, downloadUrl } = JSON.parse(e.data);
          sound.playSuccessTone();

          const senderInfo = incomingTransferRef.current;
          const receivedItem: TransferItem = {
            id: transferId,
            senderId: senderInfo?.senderId || '',
            targetId: localDevice.id,
            senderName: senderInfo?.senderName || 'Peer Device',
            senderType: senderInfo?.senderType || 'mac',
            fileName,
            fileSize,
            fileType,
            status: 'completed',
            progress: 100,
            downloadUrl,
            timestamp: Date.now(),
          };

          setActiveTransferModal(receivedItem);
          setIsSenderModal(false);

          const dlLink = document.createElement('a');
          dlLink.href = downloadUrl;
          dlLink.download = fileName;
          document.body.appendChild(dlLink);
          dlLink.click();
          document.body.removeChild(dlLink);

          setHistory((prev) => [
            {
              id: transferId,
              direction: 'received',
              fileName,
              fileSize,
              fileType,
              peerName: senderInfo?.senderName || 'Peer',
              peerType: senderInfo?.senderType || 'mac',
              timestamp: Date.now(),
              downloadUrl,
            },
            ...prev,
          ]);
        } catch {}
      });

      // Quick text received event
      sse.addEventListener('quick_text_received', (e: MessageEvent) => {
        try {
          const { senderName, text } = JSON.parse(e.data);
          sound.playIncomingPing();
          try {
            navigator.clipboard.writeText(text);
          } catch {}

          const textItem: TransferItem = {
            id: 'txt_' + Date.now(),
            senderId: '',
            targetId: localDevice.id,
            senderName,
            senderType: 'mac',
            fileName: 'Text Note',
            fileSize: text.length,
            fileType: 'text/plain',
            textContent: text,
            status: 'completed',
            progress: 100,
            timestamp: Date.now(),
          };

          setIncomingTransfer(textItem);
          setHistory((prev) => [
            {
              id: textItem.id,
              direction: 'received',
              fileName: 'Text Note',
              fileSize: text.length,
              fileType: 'text/plain',
              peerName: senderName,
              peerType: 'mac',
              textContent: text,
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        } catch {}
      });
    };

    registerAndConnect();

    heartbeatTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/devices?roomCode=${encodeURIComponent(roomCode)}&deviceId=${encodeURIComponent(localDevice.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.peers) setPeers(data.peers);
        }
      } catch {}
    }, 20000);

    return () => {
      if (sse) sse.close();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [localDevice.id, roomCode]);

  const handleUpdateDeviceName = (newName: string) => {
    const updated = { ...localDevice, name: newName };
    setLocalDevice(updated);
    localStorage.setItem('airdrop_device_name', newName);
  };

  const handleChangeRoom = (newRoom: string) => {
    setRoomCode(newRoom);
    localStorage.setItem('airdrop_room_code', newRoom);
    const url = new URL(window.location.href);
    url.searchParams.set('room', newRoom);
    window.history.replaceState({}, '', url.toString());
  };

  // Submit payment verification request
  const handleSubmitPayment = async (paymentData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/subscription/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (res.ok) {
        setSubscription((prev) => ({ ...prev, status: 'pending' }));
        return true;
      }
    } catch {}
    return false;
  };

  // Companion virtual test peer when user is on a single device
  const companionPeer: PeerDevice = {
    id: 'companion_' + (localDevice.type === 'mac' ? 'android' : 'mac'),
    name: localDevice.type === 'mac' ? 'Galaxy S24 Ultra' : 'MacBook Pro 16"',
    type: localDevice.type === 'mac' ? 'android' : 'mac',
    model: localDevice.type === 'mac' ? 'Samsung Galaxy S24 Ultra' : 'MacBook Pro 16" M3 Max',
    avatarColor: localDevice.type === 'mac' ? '#10b981' : '#0284c7',
    roomCode: roomCode,
    batteryLevel: 94,
    isCharging: true,
    isSimulator: true,
  };

  const displayedPeers = peers.length > 0 ? peers : [companionPeer];

  // Initiate file transfer
  const handleSendFile = async (targetPeer: PeerDevice, file: File, previewUrl?: string) => {
    // Check trial limit
    if (subscription.status === 'trial' && subscription.freeTransfersLeft <= 0) {
      setIsSubscriptionOpen(true);
      return;
    }

    // Companion device immediate self-testing flow
    if (targetPeer.isSimulator || targetPeer.id.startsWith('companion_')) {
      sound.playSendChirp();
      const transferId = 'comp_' + Date.now();
      const fileUrl = URL.createObjectURL(file);
      const currentTransfer: TransferItem = {
        id: transferId,
        senderId: localDevice.id,
        targetId: targetPeer.id,
        senderName: localDevice.name,
        senderType: localDevice.type,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        previewUrl: file.type.startsWith('image/') ? fileUrl : previewUrl,
        status: 'uploading',
        progress: 35,
        speed: '32.4 MB/s',
        downloadUrl: fileUrl,
        timestamp: Date.now(),
      };

      setActiveTransferModal(currentTransfer);
      setIsSenderModal(true);

      setTimeout(() => {
        sound.playIncomingPing();
        setActiveTransferModal((prev) => (prev ? { ...prev, progress: 100, status: 'completed' } : null));
        setIncomingTransfer({
          ...currentTransfer,
          status: 'pending',
          senderName: localDevice.name,
          senderType: localDevice.type,
        });
      }, 700);
      return;
    }

    try {
      sound.playSendChirp();

      const res = await fetch('/api/transfer/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: localDevice.id,
          targetId: targetPeer.id,
          senderName: localDevice.name,
          senderType: localDevice.type,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          previewUrl: previewUrl || undefined,
        }),
      });

      if (res.status === 402) {
        setIsSubscriptionOpen(true);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const transferId = data.transferId;
        pendingFilesRef.current.set(transferId, file);

        const currentTransfer: TransferItem = {
          id: transferId,
          senderId: localDevice.id,
          targetId: targetPeer.id,
          senderName: localDevice.name,
          senderType: localDevice.type,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          previewUrl,
          status: 'pending',
          progress: 10,
          timestamp: Date.now(),
        };

        setActiveTransferModal(currentTransfer);
        setIsSenderModal(true);
      }
    } catch (err) {
      console.error('Failed to initiate transfer:', err);
    }
  };

  // Quick text send
  const handleSendQuickText = async (targetPeer: PeerDevice, text: string) => {
    if (targetPeer.isSimulator || targetPeer.id.startsWith('companion_')) {
      sound.playSendChirp();
      sound.playIncomingPing();
      try {
        navigator.clipboard.writeText(text);
      } catch {}

      const textItem: TransferItem = {
        id: 'comp_txt_' + Date.now(),
        senderId: localDevice.id,
        targetId: targetPeer.id,
        senderName: localDevice.name,
        senderType: localDevice.type,
        fileName: 'Text Note',
        fileSize: text.length,
        fileType: 'text/plain',
        textContent: text,
        status: 'completed',
        progress: 100,
        timestamp: Date.now(),
      };

      setIncomingTransfer(textItem);
      setHistory((prev) => [
        {
          id: textItem.id,
          direction: 'sent',
          fileName: 'Sent Text',
          fileSize: text.length,
          fileType: 'text/plain',
          peerName: targetPeer.name,
          peerType: targetPeer.type,
          textContent: text,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      return;
    }

    try {
      sound.playSendChirp();
      await fetch('/api/transfer/quick-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: localDevice.id,
          targetId: targetPeer.id,
          senderName: localDevice.name,
          text,
        }),
      });

      setHistory((prev) => [
        {
          id: 'txt_' + Date.now(),
          direction: 'sent',
          fileName: 'Sent Text',
          fileSize: text.length,
          fileType: 'text/plain',
          peerName: targetPeer.name,
          peerType: targetPeer.type,
          textContent: text,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to send text:', err);
    }
  };

  const handleRespondTransfer = async (transferId: string, action: 'accept' | 'decline') => {
    // Handle companion / virtual transfer
    if (transferId.startsWith('comp_') || transferId.startsWith('sim_')) {
      if (action === 'accept') {
        sound.playSuccessTone();
        try {
          confetti({ particleCount: 50, spread: 60 });
        } catch {}
        if (incomingTransfer?.downloadUrl) {
          const a = document.createElement('a');
          a.href = incomingTransfer.downloadUrl;
          a.download = incomingTransfer.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        setHistory((prev) => [
          {
            id: transferId,
            direction: 'received',
            fileName: incomingTransfer?.fileName || 'File',
            fileSize: incomingTransfer?.fileSize || 0,
            fileType: incomingTransfer?.fileType || '',
            peerName: incomingTransfer?.senderName || 'Peer',
            peerType: incomingTransfer?.senderType || 'android',
            timestamp: Date.now(),
            downloadUrl: incomingTransfer?.downloadUrl,
          },
          ...prev,
        ]);
      } else {
        sound.playDeclineTone();
      }
      setIncomingTransfer(null);
      return;
    }

    try {
      if (action === 'accept') {
        sound.playSendChirp();
        // Immediately show download receiving progress on recipient device
        if (incomingTransferRef.current) {
          setActiveTransferModal({
            ...incomingTransferRef.current,
            status: 'downloading',
            progress: 35,
            speed: '34.8 MB/s',
          });
          setIsSenderModal(false);
        }
      } else {
        sound.playDeclineTone();
      }

      await fetch('/api/transfer/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          targetId: localDevice.id,
          action,
        }),
      });

      setIncomingTransfer(null);
    } catch (err) {
      console.error('Failed to respond to transfer:', err);
    }
  };

  const handleFilesDropped = (files: FileList, targetPeer?: PeerDevice) => {
    const file = files[0];
    if (!file) return;

    if (targetPeer) {
      handleSendFile(targetPeer, file);
    } else if (displayedPeers.length > 0) {
      handleSendFile(displayedPeers[0], file);
    } else {
      setIsPairingOpen(true);
    }
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        lang={lang}
        onSelectLang={(selectedLang) => setLang(selectedLang)}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        onOpenPairing={() => setIsPairingOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTextSync={() => setIsTextSyncOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        subscriptionStatus={subscription.status}
        isSimulatorActive={isSimulatorActive}
        onToggleSimulator={() => setIsSimulatorActive((prev) => !prev)}
        activePeerCount={peers.length > 0 ? peers.length : 1}
      />

      {/* Real-time Approval Alert Banner */}
      {approvalAlert && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top">
          <CheckCircle2 size={16} />
          <span>{approvalAlert}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <Zap size={13} />
            <span>{lang === 'bn' ? 'হাই-স্পিড ওয়াইফাই · ব্যাটারি ও চার্জ ইন্ডিকেটর' : 'WiFi 6 Direct · Live Battery & Charging Telemetry'}</span>
            {subscription.status === 'active' && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold text-[9px]">
                PRO
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight" style={{ textWrap: 'balance' }}>
            {t.appTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed" style={{ textWrap: 'balance' }}>
            {t.appSubtitle}
          </p>
        </section>

        {/* Dual Device Simulator */}
        {isSimulatorActive && (
          <DualDeviceSimulator
            onClose={() => setIsSimulatorActive(false)}
            lang={lang}
          />
        )}

        {/* AirDrop Radar Section */}
        <section className="w-full">
          <RadarView
            localDevice={localDevice}
            peers={displayedPeers}
            onSelectPeer={(peer) => setSelectedPeerForSend(peer)}
            onOpenPairing={() => setIsPairingOpen(true)}
            onUpdateDeviceName={handleUpdateDeviceName}
            onFilesDropped={handleFilesDropped}
            lang={lang}
            onStartSimulator={() => setIsSimulatorActive(true)}
          />
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
          <div className="p-6 rounded-3xl glass-panel transition-all hover:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/10">
              <Laptop size={22} />
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {lang === 'bn' ? 'ডিভাইসের নাম ও চার্জ স্ট্যাটাস' : 'Device Name & Real Battery %'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {lang === 'bn'
                ? 'কানেক্টেড ডিভাইসের আসল নাম, মডেল এবং লাইভ ব্যাটারি চার্জ শতকরা (%) হার সরাসরি রাডারে পর্যবেক্ষণ করুন।'
                : 'View exact connected device model, real hardware battery level, and charging status in real time.'}
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel transition-all hover:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
              <Crown size={22} />
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {lang === 'bn' ? 'বিকাশ/নগদ পেমেন্ট ও ওনার অনুমোদন' : 'bKash/Nagad & Admin Approval'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {lang === 'bn'
                ? 'বিকাশ, নগদ বা রকেটে পেমেন্ট করার পর ওনার বা অ্যাডমিন এক ক্লিকে TrxID ভেরিফাই করে প্রো পারমিশন অনুমোদন করতে পারেন।'
                : 'Users submit bKash/Nagad TrxID, and the app owner can verify and approve Pro permissions with 1 click.'}
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel transition-all hover:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
              <Zap size={22} />
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {lang === 'bn' ? 'আনলিমিটেড ৪কে ফাইল ট্রান্সফার' : 'Unlimited High-Speed 4K Share'}
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {lang === 'bn'
                ? 'প্রো লাইসেন্স অ্যাক্টিভ হলে কোনো সাইজ লিমিট বা কাউন্ট লিমিট ছাড়া সাব-৫ মিলি-সেকেন্ডে যেকোনো ফাইল আদান-প্রদান করা যায়।'
                : 'Active Pro license provides unlimited transfers with no file size limitations over peer-to-peer WiFi.'}
            </p>
          </div>
        </section>
      </main>

      {/* Modals and Sheets */}
      {selectedPeerForSend && (
        <SendModal
          targetPeer={selectedPeerForSend}
          onClose={() => setSelectedPeerForSend(null)}
          onSendFile={handleSendFile}
          onSendQuickText={handleSendQuickText}
          lang={lang}
        />
      )}

      {incomingTransfer && (
        <IncomingSheet
          transfer={incomingTransfer}
          onAccept={(id) => handleRespondTransfer(id, 'accept')}
          onDecline={(id) => handleRespondTransfer(id, 'decline')}
          lang={lang}
        />
      )}

      {activeTransferModal && (
        <TransferProgressModal
          transfer={activeTransferModal}
          isSender={isSenderModal}
          onClose={() => setActiveTransferModal(null)}
          lang={lang}
        />
      )}

      {isPairingOpen && (
        <PairingModal
          roomCode={roomCode}
          onChangeRoom={handleChangeRoom}
          onClose={() => setIsPairingOpen(false)}
          lang={lang}
        />
      )}

      {isTextSyncOpen && (
        <ClipboardSyncModal
          peers={peers}
          onSendText={handleSendQuickText}
          onClose={() => setIsTextSyncOpen(false)}
          lang={lang}
        />
      )}

      {isHistoryOpen && (
        <HistoryDrawer
          history={history}
          onClearHistory={() => setHistory([])}
          onClose={() => setIsHistoryOpen(false)}
          lang={lang}
        />
      )}

      {isSubscriptionOpen && (
        <SubscriptionModal
          subscription={subscription}
          adminSettings={adminSettings}
          deviceId={localDevice.id}
          deviceName={localDevice.name}
          deviceType={localDevice.type}
          onClose={() => setIsSubscriptionOpen(false)}
          onSubmitPayment={handleSubmitPayment}
          lang={lang}
        />
      )}

      {isAdminOpen && (
        <AdminApprovalModal
          onClose={() => setIsAdminOpen(false)}
          lang={lang}
        />
      )}

      {/* Subtle Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          AirDrop for Mac & Android · Real-Time Battery Telemetry & Subscription Approval
        </p>
      </footer>
    </div>
  );
}
