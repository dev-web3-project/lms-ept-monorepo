import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from '../services/api/announcement';

/* ── Types ──────────────────────────────────────────────── */
interface Notification {
    id: number;
    userId: string;
    title: string;
    content: string;
    read: boolean;
    type: string | null;
    createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
    QUIZ:      'fas fa-bullseye',
    COURSE:    'fas fa-book',
    COURS:     'fas fa-book',
    BADGE:     'fas fa-medal',
    SYSTEM:    'fas fa-cog',
    SYSTEME:   'fas fa-cog',
    MENTORING: 'fas fa-hands-helping',
    GRADE:     'fas fa-graduation-cap',
};
const TYPE_COLOR: Record<string, string> = {
    QUIZ:      '#2cb5e8',
    COURSE:    '#9fef00',
    COURS:     '#9fef00',
    BADGE:     '#ffaf00',
    SYSTEM:    '#a855f7',
    SYSTEME:   '#a855f7',
    MENTORING: '#ec4899',
    GRADE:     '#f59e0b',
};

const fmtDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diffM = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffM < 1)  return 'À l\'instant';
    if (diffM < 60) return `Il y a ${diffM} min`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/* ── Component ──────────────────────────────────────────── */
interface Props {
    /** username du user connecté */
    userId: string;
    /** Variante de style — 'dark' pour HTB student/admin, 'light' pour AdminLTE */
    variant?: 'dark' | 'light';
}

const NotificationBell: React.FC<Props> = ({ userId, variant = 'dark' }) => {
    const [open, setOpen]               = useState(false);
    const [notifs, setNotifs]           = useState<Notification[]>([]);
    const [loading, setLoading]         = useState(false);
    const ref                           = useRef<HTMLDivElement>(null);

    const unreadCount = notifs.filter(n => !n.read).length;

    const load = useCallback(async (showLoader = true) => {
        if (!userId) return;
        if (showLoader) setLoading(true);
        const data = await getUserNotifications(userId);
        setNotifs(Array.isArray(data) ? data : []);
        if (showLoader) setLoading(false);
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    /* Polling every 30s (silent refresh) */
    useEffect(() => {
        if (!userId) return;
        const interval = setInterval(() => { load(false); }, 30000);
        return () => clearInterval(interval);
    }, [userId, load]);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleRead = async (n: Notification) => {
        if (!n.read) {
            await markNotificationAsRead(n.id);
            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        }
    };

    const handleReadAll = async () => {
        await markAllNotificationsAsRead(userId);
        setNotifs(prev => prev.map(x => ({ ...x, read: true })));
    };

    const handleDelete = async (e: React.MouseEvent, n: Notification) => {
        e.stopPropagation();
        await deleteNotification(n.id);
        setNotifs(prev => prev.filter(x => x.id !== n.id));
    };

    /* ── Styles ── */
    const isDark = variant === 'dark';
    const S = {
        wrap: {
            position: 'relative' as const,
            display: 'inline-block',
        },
        btn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            position: 'relative' as const,
            color: isDark ? '#a4b1cd' : '#555',
            fontSize: '1.1rem',
            lineHeight: 1,
        },
        badge: {
            position: 'absolute' as const,
            top: 2,
            right: 4,
            background: '#9fef00',
            color: '#0d1117',
            fontSize: '0.6rem',
            fontWeight: 800,
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
        },
        dropdown: {
            position: 'absolute' as const,
            right: 0,
            top: 'calc(100% + 8px)',
            width: 340,
            background: isDark ? '#1a2332' : '#fff',
            border: `1px solid ${isDark ? '#2a3f5f' : '#ddd'}`,
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 9999,
            overflow: 'hidden',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${isDark ? '#2a3f5f' : '#eee'}`,
        },
        headerTitle: {
            color: isDark ? '#e5eaf3' : '#222',
            fontWeight: 700,
            fontSize: '0.9rem',
            margin: 0,
        },
        readAllBtn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#9fef00',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: 0,
        },
        list: {
            maxHeight: 360,
            overflowY: 'auto' as const,
        },
        item: (read: boolean) => ({
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '11px 16px',
            cursor: 'pointer',
            borderBottom: `1px solid ${isDark ? '#1e2d40' : '#f0f0f0'}`,
            background: read
                ? 'transparent'
                : isDark ? 'rgba(159,239,0,0.05)' : 'rgba(159,239,0,0.06)',
            transition: 'background .15s',
        }),
        icon: (type: string | null) => ({
            fontSize: '1.2rem',
            flexShrink: 0,
            width: 28,
            textAlign: 'center' as const,
            color: TYPE_COLOR[type ?? ''] ?? '#a4b1cd',
        }),
        itemBody: {
            flex: 1,
            minWidth: 0,
        },
        itemTitle: (read: boolean) => ({
            color: isDark ? '#e5eaf3' : '#222',
            fontWeight: read ? 500 : 700,
            fontSize: '0.83rem',
            marginBottom: 2,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        }),
        itemContent: {
            color: '#718096',
            fontSize: '0.75rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
        },
        itemMeta: {
            color: '#4a5568',
            fontSize: '0.68rem',
            marginTop: 3,
        },
        deleteBtn: {
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#4a5568',
            fontSize: '0.75rem',
            padding: '2px 4px',
            flexShrink: 0,
            opacity: 0.7,
            transition: 'opacity .15s, color .15s',
        },
        emptyState: {
            padding: '32px 16px',
            textAlign: 'center' as const,
            color: '#4a5568',
            fontSize: '0.85rem',
        },
        footer: {
            padding: '10px 16px',
            borderTop: `1px solid ${isDark ? '#2a3f5f' : '#eee'}`,
            textAlign: 'center' as const,
        },
        unreadDot: {
            width: 7,
            height: 7,
            background: '#9fef00',
            borderRadius: '50%',
            display: 'inline-block',
            marginRight: 4,
            flexShrink: 0,
        },
    };

    return (
        <div style={S.wrap} ref={ref}>
            <button
                style={S.btn}
                onClick={() => { setOpen(o => !o); if (!open) load(); }}
                title="Notifications"
                id="notification-bell-btn"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span style={S.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div style={S.dropdown}>
                    {/* Header */}
                    <div style={S.header}>
                        <h3 style={S.headerTitle}>
                            Notifications
                            {unreadCount > 0 && (
                                <span style={{
                                    marginLeft: 8, background: 'rgba(159,239,0,.15)',
                                    color: '#9fef00', borderRadius: 99,
                                    fontSize: '0.65rem', padding: '2px 7px', fontWeight: 800,
                                }}>
                                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button style={S.readAllBtn} onClick={handleReadAll}>
                                ✓ Tout lire
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={S.list}>
                        {loading ? (
                            <div style={S.emptyState}>
                                <i className="fas fa-spinner fa-spin" /> Chargement...
                            </div>
                        ) : notifs.length === 0 ? (
                            <div style={S.emptyState}>
                                <div style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--text-muted)' }}>
                                    <i className="far fa-bell-slash"></i>
                                </div>
                                <p style={{ margin: 0 }}>Aucune notification</p>
                            </div>
                        ) : (
                            notifs.map(n => (
                                <div
                                    key={n.id}
                                    style={S.item(n.read)}
                                    onClick={() => handleRead(n)}
                                >
                                    {!n.read && <span style={S.unreadDot} />}
                                    <span style={S.icon(n.type)}>
                                        <i className={TYPE_ICON[n.type ?? ''] ?? 'fas fa-bullhorn'}></i>
                                    </span>
                                    <div style={S.itemBody}>
                                        <div style={S.itemTitle(n.read)}>{n.title}</div>
                                        <div style={S.itemContent as React.CSSProperties}>{n.content}</div>
                                        <div style={S.itemMeta}>{fmtDate(n.createdAt)}</div>
                                    </div>
                                    <button
                                        style={S.deleteBtn}
                                        onClick={e => handleDelete(e, n)}
                                        title="Supprimer"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifs.length > 0 && (
                        <div style={S.footer}>
                            <span style={{ color: '#4a5568', fontSize: '0.72rem' }}>
                                {notifs.length} notification{notifs.length > 1 ? 's' : ''} au total
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
