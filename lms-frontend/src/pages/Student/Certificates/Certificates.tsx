import React, { useEffect, useState } from "react";
import { getStudentCertificats, verifyCertificat } from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

/* ── Types ──────────────────────────────────────────────── */
interface Certificat {
    id: number;
    studentId: number;
    course?: { id: number; name: string; code?: string };
    moduleId?: number;
    urlPdf?: string;
    codeVerification: string;
    dateEmission: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
};

/* ── Component ───────────────────────────────────────────── */
const Certificates: React.FC = () => {
    const [certs, setCerts]             = useState<Certificat[]>([]);
    const [loading, setLoading]         = useState(true);
    const [studentId, setStudentId]     = useState<number | null>(null);

    // Verify panel
    const [verifyCode, setVerifyCode]   = useState("");
    const [verifyResult, setVerifyResult] = useState<Certificat | null | undefined>(undefined);
    const [verifyNotFound, setVerifyNotFound] = useState(false);
    const [verifying, setVerifying]     = useState(false);
    const [copied, setCopied]           = useState<number | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const stored = localStorage.getItem("user");
                const uname = stored ? JSON.parse(stored).username || JSON.parse(stored).email : "";
                const details = await getStudentDetailsByUsername(uname);
                const sid = details?.id;
                setStudentId(sid);
                if (sid) {
                    const data = await getStudentCertificats(String(sid));
                    setCerts(Array.isArray(data) ? data : []);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyCode.trim()) return;
        setVerifying(true);
        setVerifyResult(undefined);
        setVerifyNotFound(false);
        const result = await verifyCertificat(verifyCode.trim());
        if (result) {
            setVerifyResult(result);
        } else {
            setVerifyNotFound(true);
        }
        setVerifying(false);
    };

    const handleCopy = (cert: Certificat) => {
        copyToClipboard(cert.codeVerification);
        setCopied(cert.id);
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) return <PageLoading />;

    /* ── Styles ── */
    const S: Record<string, React.CSSProperties> = {
        wrap: { padding: "1.5rem", maxWidth: 900, margin: "0 auto" },
        pageTitle: { color: "#e5eaf3", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 .3rem" },
        pageSub: { color: "#556987", fontSize: ".875rem", marginBottom: "1.75rem" },
        grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem", marginBottom: "2rem" },
        card: {
            background: "linear-gradient(135deg,#1a2332 0%,#111927 100%)",
            border: "1px solid #2a3f5f",
            borderRadius: 12, overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,.35)",
            display: "flex", flexDirection: "column",
            transition: "transform .18s, border-color .18s",
        },
        cardTop: {
            background: "linear-gradient(135deg,rgba(159,239,0,.12),rgba(44,181,232,.08))",
            padding: "1.5rem 1.25rem 1rem",
            borderBottom: "1px solid #2a3f5f",
            display: "flex", alignItems: "flex-start", gap: "1rem",
        },
        certIcon: { fontSize: "2.5rem", lineHeight: 1 },
        certInfo: { flex: 1, minWidth: 0 },
        certTitle: { color: "#e5eaf3", fontWeight: 700, fontSize: ".95rem", margin: "0 0 .25rem" },
        certDate: { color: "#9fef00", fontSize: ".75rem", fontWeight: 600, fontFamily: "'Courier New',monospace" },
        cardBottom: { padding: "1rem 1.25rem" },
        codeLabel: { color: "#556987", fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: ".3rem" },
        codeRow: { display: "flex", alignItems: "center", gap: ".5rem" },
        code: {
            flex: 1, background: "#0d1117", border: "1px solid #2a3f5f",
            borderRadius: 6, padding: ".35rem .6rem",
            color: "#9fef00", fontFamily: "'Courier New',monospace",
            fontSize: ".72rem", wordBreak: "break-all",
        },
        copyBtn: {
            background: "rgba(159,239,0,.1)", border: "1px solid rgba(159,239,0,.3)",
            borderRadius: 6, padding: ".3rem .7rem",
            color: "#9fef00", fontSize: ".75rem", fontWeight: 700, cursor: "pointer",
            whiteSpace: "nowrap", transition: "background .15s",
        },
        pdfBtn: {
            display: "inline-flex", alignItems: "center", gap: ".35rem",
            marginTop: ".75rem", padding: ".35rem .8rem",
            background: "rgba(44,181,232,.1)", border: "1px solid rgba(44,181,232,.35)",
            borderRadius: 6, color: "#2cb5e8", fontSize: ".78rem", fontWeight: 600,
            cursor: "pointer", textDecoration: "none",
        },

        // Verify panel
        verifyPanel: { background: "#1a2332", border: "1px solid #2a3f5f", borderRadius: 12, padding: "1.5rem" },
        verifyTitle: { color: "#e5eaf3", fontWeight: 700, fontSize: "1rem", margin: "0 0 1rem" },
        verifyForm: { display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" },
        verifyInput: {
            flex: 1, minWidth: 200, background: "#111927",
            border: "1px solid #2a3f5f", borderRadius: 8,
            padding: ".55rem 1rem", color: "#e5eaf3",
            fontSize: ".875rem", outline: "none",
        },
        verifyBtn: {
            background: "rgba(159,239,0,.12)", border: "1px solid rgba(159,239,0,.4)",
            borderRadius: 8, padding: ".55rem 1.25rem",
            color: "#9fef00", fontWeight: 700, cursor: "pointer",
            fontSize: ".875rem", transition: "background .15s",
        },
        emptyState: { textAlign: "center", padding: "3rem", color: "#556987" },
    };
    const resultBox = (ok: boolean): React.CSSProperties => ({
        marginTop: "1rem", padding: "1rem",
        background: ok ? "rgba(159,239,0,.07)" : "rgba(255,62,62,.07)",
        border: `1px solid ${ok ? "rgba(159,239,0,.3)" : "rgba(255,62,62,.3)"}`,
        borderRadius: 8, color: ok ? "#9fef00" : "#ff3e3e",
        fontSize: ".875rem",
    });

    return (
        <div style={S.wrap}>
            <h1 style={S.pageTitle}>🎓 Mes Certificats</h1>
            <p style={S.pageSub}>Certificats obtenus pour vos cours complétés</p>

            {/* ── Certificate grid ── */}
            {certs.length === 0 ? (
                <div style={S.emptyState}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📜</div>
                    <p style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 .5rem", color: "#e5eaf3" }}>
                        Aucun certificat pour l'instant
                    </p>
                    <p style={{ margin: 0, fontSize: ".85rem" }}>
                        Terminez un cours pour obtenir votre certificat.
                    </p>
                </div>
            ) : (
                <div style={S.grid}>
                    {certs.map(cert => (
                        <div key={cert.id} style={S.card}>
                            <div style={S.cardTop}>
                                <span style={S.certIcon}>🎓</span>
                                <div style={S.certInfo}>
                                    <p style={S.certTitle}>
                                        {cert.course?.name ?? `Cours #${cert.course?.id ?? '?'}`}
                                    </p>
                                    <p style={S.certDate}>
                                        {cert.dateEmission ? fmtDate(cert.dateEmission) : '—'}
                                    </p>
                                </div>
                            </div>
                            <div style={S.cardBottom}>
                                <p style={S.codeLabel}>Code de vérification</p>
                                <div style={S.codeRow}>
                                    <span style={S.code}>{cert.codeVerification}</span>
                                    <button
                                        style={S.copyBtn}
                                        onClick={() => handleCopy(cert)}
                                        title="Copier le code"
                                    >
                                        {copied === cert.id ? '✓ Copié' : '📋 Copier'}
                                    </button>
                                </div>
                                {cert.urlPdf && (
                                    <a
                                        href={cert.urlPdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={S.pdfBtn}
                                    >
                                        📄 Télécharger le PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Verify panel ── */}
            <div style={S.verifyPanel}>
                <h2 style={S.verifyTitle}>🔍 Vérifier un certificat</h2>
                <form onSubmit={handleVerify} style={S.verifyForm}>
                    <input
                        type="text"
                        style={S.verifyInput}
                        placeholder="Entrez le code de vérification..."
                        value={verifyCode}
                        onChange={e => setVerifyCode(e.target.value)}
                        id="cert-verify-input"
                    />
                    <button
                        type="submit"
                        style={S.verifyBtn}
                        disabled={verifying}
                        id="cert-verify-btn"
                    >
                        {verifying ? "⏳ Vérification..." : "Vérifier"}
                    </button>
                </form>

                {verifyNotFound && (
                    <div style={resultBox(false)}>
                        ❌ Ce code de vérification est invalide ou n'existe pas.
                    </div>
                )}
                {verifyResult && (
                    <div style={resultBox(true)}>
                        ✅ Certificat valide !{" "}
                        <strong>{verifyResult.course?.name ?? `Cours #${verifyResult.course?.id}`}</strong>
                        {" — émis le "}
                        <strong>{fmtDate(verifyResult.dateEmission)}</strong>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Certificates;
