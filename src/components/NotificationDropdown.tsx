"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaBell } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { NotificationType } from '@/models/NotificationTypeClient';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: NotificationType;
  relatedQuestion?: { _id: string; title: string };
  relatedAnswer?: { _id: string };
  actor?: { name?: string; email: string };
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 通知を読み込む関数
  const fetchNotifications = async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('通知の取得に失敗しました');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('通知取得エラー:', error);
      toast.error('通知の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ドロップダウン外部のクリックを検出
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 初回マウント時と認証状態変更時に通知を取得
  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  // すべての通知を既読にする関数
  const markAllAsRead = async () => {
    if (!session || unreadCount === 0) return;

    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('既読処理に失敗しました');
      }
      
      // 通知を再取得
      fetchNotifications();
      toast.success('すべての通知を既読にしました');
    } catch (error) {
      console.error('既読処理エラー:', error);
      toast.error('既読処理に失敗しました');
    }
  };

  // 個別の通知を既読にする関数
  const markAsRead = async (notificationId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('既読処理に失敗しました');
      }
      
      // 状態を更新（APIを再度呼び出さずに最適化）
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('既読処理エラー:', error);
      // エラーはトーストしない（UXへの影響を最小限に）
    }
  };

  // 通知リンクのURL生成
  const getNotificationUrl = (notification: Notification): string => {
    switch (notification.type) {
      case NotificationType.NEW_ANSWER:
      case NotificationType.BEST_ANSWER:
      case NotificationType.ANSWER_LIKED:
        // 質問ページに関連する通知はすべて質問ページへリダイレクト
        return notification.relatedQuestion 
          ? `/questions/${notification.relatedQuestion._id}` 
          : '/';
      case NotificationType.MENTION:
        // メンション機能はまだ未実装なので、とりあえずホームへ
        return '/';
      default:
        return '/';
    }
  };

  // ログインしていない場合は何も表示しない
  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ベルアイコンと未読カウンタ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none"
        aria-label="通知"
      >
        <FaBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知ドロップダウン */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
          <div className="py-2 px-3 bg-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium">通知</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                すべて既読にする
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-4 text-center text-gray-500">
                <p>読み込み中...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                <p>通知はありません</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`border-b border-gray-100 last:border-b-0 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Link 
                      href={getNotificationUrl(notification)}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification._id);
                        }
                        setIsOpen(false);
                      }}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 