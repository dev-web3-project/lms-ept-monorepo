import React, { useEffect, useState, useCallback } from 'react';
import { countUnread } from '../services/api/messages';

interface Props {
    username: string;
    style?: React.CSSProperties;
    badgeClass?: string;
}

const UnreadBadge: React.FC<Props> = ({ username, style = {}, badgeClass = "badge badge-danger" }) => {
    const [count, setCount] = useState(0);

    const loadCount = useCallback(async () => {
        if (!username) return;
        try {
            const unread = await countUnread(username);
            setCount(unread);
        } catch {
            setCount(0);
        }
    }, [username]);

    useEffect(() => {
        loadCount();
        
        const handleUpdate = () => loadCount();
        window.addEventListener('messagesUpdated', handleUpdate);
        
        const interval = setInterval(loadCount, 60000); 
        return () => {
            clearInterval(interval);
            window.removeEventListener('messagesUpdated', handleUpdate);
        };
    }, [loadCount]);

    if (count === 0) return null;

    return (
        <span className={badgeClass} style={{
            background: '#ff3e3e',
            color: '#fff',
            marginLeft: '6px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            ...style
        }}>
            {count > 99 ? '99+' : count}
        </span>
    );
};

export default UnreadBadge;
