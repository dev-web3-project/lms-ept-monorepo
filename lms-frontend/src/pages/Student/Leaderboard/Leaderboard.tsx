import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../../../services/api/gamification";
import PageLoading from "../../../components/Admin/PageLoading";

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

const LVL_NAMES: Record<number, string> = {
    1: 'Novice', 2: 'Apprenti', 3: 'Étudiant', 4: 'Avancé',
    5: 'Expert', 6: 'Maître', 7: 'Élite', 8: 'Légende',
};
const getLevelName = (lvl: number) => LVL_NAMES[lvl] || `Niveau ${lvl}`;

const Leaderboard = () => {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored).username || '');
        getLeaderboard()
            .then(data => setPlayers(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageLoading />;

    const top3 = players.slice(0, 3);
    const rest = players.slice(3);

    return (
        <>
            <div style={S.header}>
                <div style={S.headerInner}>
                    <div>
                        <p style={S.headerGreet}><Link to="/student" style={S.breadLink}>Accueil</Link> / Classement</p>
                        <h1 style={S.headerTitle}>🏆 Classement Global</h1>
                    </div>
                    <div style={S.headerSub}>Top 10 étudiants par points XP</div>
                </div>
            </div>

            <div style={S.content}>
                {players.length === 0 ? (
                    <div style={S.empty}>
                        <span style={{ fontSize: '3rem' }}>🏅</span>
                        <p style={{ color: '#556987', marginTop: '.75rem' }}>Aucun joueur classé pour le moment.</p>
                    </div>
                ) : (
                    <>
                        {/* Podium top 3 */}
                        <div style={S.podium}>
                            {/* 2nd place (left) */}
                            {top3[1] && <PodiumCard player={top3[1]} rank={2} isMe={top3[1].username === currentUser} />}
                            {/* 1st place (center, elevated) */}
                            {top3[0] && <PodiumCard player={top3[0]} rank={1} isMe={top3[0].username === currentUser} />}
                            {/* 3rd place (right) */}
                            {top3[2] && <PodiumCard player={top3[2]} rank={3} isMe={top3[2].username === currentUser} />}
                        </div>

                        {/* Remaining players */}
                        {rest.length > 0 && (
                            <div style={S.table}>
                                <div style={S.tableHeader}>
                                    <span style={{ width: 40, textAlign: 'center' }}>#</span>
                                    <span style={{ flex: 1 }}>Joueur</span>
                                    <span style={{ width: 80, textAlign: 'center' }}>Niveau</span>
                                    <span style={{ width: 100, textAlign: 'right' }}>XP</span>
                                    <span style={{ width: 80, textAlign: 'center' }}>🔥 Série</span>
                                </div>
                                {rest.map((p, i) => (
                                    <PlayerRow key={p.username} player={p} rank={i + 4} isMe={p.username === currentUser} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

const PodiumCard = ({ player, rank, isMe }: { player: any; rank: number; isMe: boolean }) => {
    const color = RANK_COLORS[rank - 1] || '#9fef00';
    const sizes = { 1: { height: 170, mt: 0 }, 2: { height: 140, mt: 30 }, 3: { height: 120, mt: 50 } };
    const sz = sizes[rank as keyof typeof sizes];
    return (
        <div style={{ ...S.podiumCard, marginTop: sz.mt, borderColor: isMe ? '#9fef00' : color + '55', boxShadow: isMe ? '0 0 20px rgba(159,239,0,.25)' : 'none' }}>
            <div style={{ fontSize: rank === 1 ? '2.5rem' : '1.8rem' }}>{RANK_EMOJIS[rank - 1]}</div>
            <div style={{ ...S.podiumAvatar, borderColor: color, background: color + '22' }}>
                {player.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ ...S.podiumName, color: isMe ? '#9fef00' : '#e5eaf3' }}>{player.username}</div>
            <div style={{ color, fontWeight: 800, fontSize: '1.1rem' }}>{player.xpPoints} XP</div>
            <div style={S.podiumLevel}>Niv. {player.level} — {getLevelName(player.level)}</div>
            {player.currentStreak > 0 && <div style={S.podiumStreak}>🔥 {player.currentStreak} jours</div>}
            {/* Podium block */}
            <div style={{ ...S.podiumBlock, height: sz.height, borderColor: color + '55', background: color + '11' }}>
                <span style={{ color, fontWeight: 900, fontSize: '1.5rem' }}>{rank}</span>
            </div>
        </div>
    );
};

const PlayerRow = ({ player, rank, isMe }: { player: any; rank: number; isMe: boolean }) => (
    <div style={{ ...S.tableRow, background: isMe ? 'rgba(159,239,0,.07)' : 'transparent', borderColor: isMe ? 'rgba(159,239,0,.3)' : '#2a3f5f' }}>
        <span style={{ width: 40, textAlign: 'center', color: '#556987', fontWeight: 700 }}>#{rank}</span>
        <span style={{ flex: 1, color: isMe ? '#9fef00' : '#e5eaf3', fontWeight: isMe ? 700 : 500 }}>
            {player.username} {isMe && <span style={{ fontSize: '.7rem', color: '#556987' }}>(vous)</span>}
        </span>
        <span style={{ width: 80, textAlign: 'center', color: '#a855f7', fontSize: '.85rem' }}>Niv. {player.level}</span>
        <span style={{ width: 100, textAlign: 'right', color: '#2cb5e8', fontWeight: 700 }}>{player.xpPoints} XP</span>
        <span style={{ width: 80, textAlign: 'center', color: '#ffaf00' }}>🔥 {player.currentStreak}</span>
    </div>
);

const S: Record<string, React.CSSProperties> = {
    header: { background: '#1a2332', borderBottom: '1px solid #2a3f5f', padding: '1.5rem 0' },
    headerInner: { maxWidth: 900, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' },
    headerGreet: { color: '#556987', fontSize: '.875rem', margin: '0 0 .25rem' },
    headerTitle: { color: '#e5eaf3', fontSize: '1.5rem', fontWeight: 800, margin: 0 },
    headerSub: { color: '#556987', fontSize: '.8rem', fontStyle: 'italic' },
    breadLink: { color: '#556987', textDecoration: 'none' },
    content: { padding: '2rem 1.5rem', maxWidth: 900, margin: '0 auto' },
    empty: { textAlign: 'center', padding: '3rem', background: '#1a2332', borderRadius: 12, border: '1px solid #2a3f5f' },
    /* Podium */
    podium: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' },
    podiumCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', background: '#1a2332', border: '2px solid', borderRadius: 14, padding: '1.25rem 1.5rem 0', width: 190, transition: 'transform .2s', cursor: 'default' },
    podiumAvatar: { width: 56, height: 56, borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#e5eaf3', marginBottom: '.2rem' },
    podiumName: { fontWeight: 800, fontSize: '.95rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    podiumLevel: { color: '#556987', fontSize: '.72rem', fontWeight: 600 },
    podiumStreak: { color: '#ffaf00', fontSize: '.75rem', fontWeight: 700 },
    podiumBlock: { width: '100%', borderRadius: '0 0 12px 12px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '.75rem' },
    /* Table */
    table: { background: '#1a2332', border: '1px solid #2a3f5f', borderRadius: 12, overflow: 'hidden' },
    tableHeader: { display: 'flex', alignItems: 'center', padding: '.75rem 1.25rem', background: '#111927', borderBottom: '1px solid #2a3f5f', color: '#556987', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', gap: '1rem' },
    tableRow: { display: 'flex', alignItems: 'center', padding: '.85rem 1.25rem', borderBottom: '1px solid', gap: '1rem', transition: 'background .15s' },
};

export default Leaderboard;
