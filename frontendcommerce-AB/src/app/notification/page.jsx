"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    type: "order",
    title: "Your order has been shipped",
    message:
      "Order INV/20250207/ML/834850124 is on the way. Track your package on the order detail page.",
    created_at: "2025-02-09T10:30:00",
    is_read: false,
    meta: {
      transaction_number: "INV/20250207/ML/834850124",
    },
  },
  {
    id: 2,
    type: "order",
    title: "Order received",
    message:
      "Yay! Your order INV/20250201/ML/123456789 has arrived. Please confirm and leave a review.",
    created_at: "2025-02-08T18:10:00",
    is_read: true,
    meta: {
      transaction_number: "INV/20250201/ML/123456789",
    },
  },
  {
    id: 3,
    type: "promo",
    title: "Special sale just for you!",
    message:
      "Get extra 15% off on selected skincare products. Limited time only, don’t miss it.",
    created_at: "2025-02-07T09:00:00",
    is_read: false,
  },
  {
    id: 4,
    type: "system",
    title: "Security update",
    message:
      "We’ve detected a login from a new device. If this is not you, please reset your password immediately.",
    created_at: "2025-02-05T14:20:00",
    is_read: true,
  },
  {
    id: 5,
    type: "promo",
    title: "Welcome to Abby N Bev!",
    message:
      "Complete your profile and get a special voucher for your first purchase.",
    created_at: "2025-02-01T08:15:00",
    is_read: true,
  },
];

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "order", label: "Orders" },
  { key: "promo", label: "Promotions" },
  { key: "system", label: "System" },
];

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationPage() {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("all");

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
      }))
    );
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              is_read: !n.is_read,
            }
          : n
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-xs text-gray-500 mt-1">
            Stay updated with your orders, promos, and account activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="text-xs text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-gray-600 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={clsx(
              "px-4 py-1.5 text-xs font-medium rounded-full border transition-all",
              activeFilter === tab.key
                ? "bg-pink-600 text-white border-pink-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-2">
            No notifications in this category.
          </p>
          <p className="text-[11px] text-gray-400">
            You&apos;ll see updates about your orders, promotions, and account
            activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isUnread = !notif.is_read;
            const isOrderType = notif.type === "order";

            return (
              <div
                key={notif.id}
                className={clsx(
                  "flex gap-3 rounded-xl border px-4 py-3 transition-colors",
                  isUnread
                    ? "bg-pink-50/60 border-pink-100"
                    : "bg-white border-gray-200 hover:border-pink-100"
                )}
              >
                {/* Left: dot status */}
                <div className="pt-2">
                  <span
                    className={clsx(
                      "inline-block w-2 h-2 rounded-full",
                      isUnread ? "bg-pink-500" : "bg-gray-300"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* type badge */}
                        <span
                          className={clsx(
                            "inline-flex items-center px-2 py-[2px] text-[10px] font-semibold rounded-full",
                            notif.type === "order" &&
                              "bg-blue-50 text-blue-600",
                            notif.type === "promo" &&
                              "bg-amber-50 text-amber-600",
                            notif.type === "system" &&
                              "bg-gray-50 text-gray-600"
                          )}
                        >
                          {notif.type === "order"
                            ? "Order"
                            : notif.type === "promo"
                            ? "Promo"
                            : "System"}
                        </span>

                        <p
                          className={clsx(
                            "text-sm font-semibold",
                            isUnread ? "text-gray-900" : "text-gray-700"
                          )}
                        >
                          {notif.title}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {formatDateTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3">
                    {isOrderType && notif.meta?.transaction_number && (
                      <Link
                        href={`/account/order-history`}
                        className="text-[11px] font-medium text-pink-600 hover:text-pink-700"
                      >
                        View order details
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleRead(notif.id)}
                      className="text-[11px] text-gray-400 hover:text-gray-600"
                    >
                      {isUnread ? "Mark as read" : "Mark as unread"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
