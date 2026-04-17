import React, { useEffect, useState } from "react";
import {
  getProfilAdaptatif,
  getRecommandations,
  getLacunesEtudiant,
  markRecommandationAsVue,
} from "../../../services/api/analytics";
import { getGamificationProfile } from "../../../services/api/gamification";
import {
  getGradesByStudentId,
  getQuizResultsByStudentId,
} from "../../../services/api/course";
import { getStudentDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

/* ── Types ──────────────────────────────────────────────── */
interface ProfilAdaptatif {
  niveauGlobal: string; // DEBUTANT | INTERMEDIAIRE | AVANCE
  classeMoyenne: number;
  competences: Record<string, string>;
  dernierMisAJour: string;
}
interface Recommandation {
  id: number;
  typeReco: string; // COURS | MODULE | BADGE | EXERCICE
  cibleId: string;
  raison: string;
  vue: boolean;
  createdAt: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
const NIVEAU_CONFIG: Record<
  string,
  { label: string; color: string; icon: string; pct: number }
> = {
  DEBUTANT: {
    label: "Débutant",
    color: "#2cb5e8",
    icon: "fas fa-seedling",
    pct: 25,
  },
  INTERMEDIAIRE: {
    label: "Intermédiaire",
    color: "#ffaf00",
    icon: "fas fa-bolt",
    pct: 60,
  },
  AVANCE: { label: "Avancé", color: "#9fef00", icon: "fas fa-rocket", pct: 92 },
};
const RECO_ICON: Record<string, string> = {
  COURS: "fas fa-book",
  MODULE: "fas fa-cube",
  BADGE: "fas fa-medal",
  EXERCICE: "fas fa-bullseye",
};
const RECO_COLOR: Record<string, string> = {
  COURS: "#9fef00",
  MODULE: "#2cb5e8",
  BADGE: "#ffaf00",
  EXERCICE: "#a855f7",
};

const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const avg = (arr: number[]) => {
  const valid = arr.filter((n) => typeof n === "number" && !isNaN(n));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
};

/* ── Component ───────────────────────────────────────────── */
const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [profil, setProfil] = useState<ProfilAdaptatif | null>(null);
  const [recos, setRecos] = useState<Recommandation[]>([]);
  const [gami, setGami] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [lacunes, setLacunes] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem("user");
        const uname = stored
          ? JSON.parse(stored).username || JSON.parse(stored).email
          : "";
        setUsername(uname);

        const [profilData, recosData, gamiData, studentData, lacunesData] =
          await Promise.all([
            getProfilAdaptatif(uname),
            getRecommandations(uname),
            getGamificationProfile(uname).catch(() => null),
            getStudentDetailsByUsername(uname).catch(() => null),
            getLacunesEtudiant(uname).catch(() => []),
          ]);

        setProfil(profilData);
        setRecos(Array.isArray(recosData) ? recosData : []);
        setGami(gamiData);
        setStudent(studentData);
        setLacunes(Array.isArray(lacunesData) ? lacunesData : []);
        const student = studentData;

        if (student?.id) {
          const [g, q] = await Promise.all([
            getGradesByStudentId(String(student.id)).catch(() => []),
            getQuizResultsByStudentId(uname).catch(() => []),
          ]);
          setGrades(Array.isArray(g) ? g : []);
          setQuizResults(Array.isArray(q) ? q : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <PageLoading />;

  const niveauCfg = NIVEAU_CONFIG[profil?.niveauGlobal ?? ""] ?? null;
  const avgGrade = avg(
    grades.map((g: any) => g.value ?? g.grade ?? g.note ?? g.score ?? 0),
  );
  const avgQuiz = avg(
    quizResults.map((q: any) => q.score ?? q.percentage ?? 0),
  );
  const xpInLevel = gami ? gami.xpPoints % 100 : 0;

  /* ── Styles ── */
  const S: Record<string, React.CSSProperties> = {
    wrap: { padding: "1.5rem", maxWidth: 1100, margin: "0 auto" },
    title: {
      color: "#e5eaf3",
      fontSize: "1.5rem",
      fontWeight: 800,
      margin: "0 0 .25rem",
    },
    sub: { color: "#556987", fontSize: ".875rem", marginBottom: "1.75rem" },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1rem",
      marginBottom: "1rem",
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "1rem",
      marginBottom: "1rem",
    },
    card: {
      background: "#1a2332",
      border: "1px solid #2a3f5f",
      borderRadius: 12,
      padding: "1.25rem",
    },
    cardTitle: {
      color: "#9fef00",
      fontSize: ".7rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: ".7px",
      marginBottom: ".85rem",
    },
    big: { color: "#e5eaf3", fontSize: "2rem", fontWeight: 800, lineHeight: 1 },
    label: { color: "#556987", fontSize: ".72rem", marginTop: ".2rem" },
    bar: {
      height: 8,
      background: "#111927",
      borderRadius: 99,
      overflow: "hidden",
      marginTop: ".5rem",
    },
  };

  const BarFill = ({ pct, color }: { pct: number; color: string }) => (
    <div style={S.bar}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(pct, 100)}%`,
          background: color,
          borderRadius: 99,
          transition: "width .5s ease",
        }}
      />
    </div>
  );

  const StatCard = ({ title, value, sub, color, pct }: any) => (
    <div style={S.card}>
      <p style={S.cardTitle}>{title}</p>
      <p style={{ ...S.big, color }}>{value}</p>
      <p style={S.label}>{sub}</p>
      {pct !== undefined && <BarFill pct={pct} color={color} />}
    </div>
  );

  return (
    <div style={S.wrap}>
      <h1 style={S.title}>
        <i
          className="fas fa-chart-pie"
          style={{ color: "var(--info)", marginRight: "0.5rem" }}
        ></i>{" "}
        Mes Analyses
      </h1>
      <p style={S.sub}>
        Bonjour{" "}
        <span style={{ color: "#9fef00", fontWeight: 700 }}>
          {student?.fullName || username}
        </span>{" "}
        — voici votre tableau de bord analytique
      </p>

      {/* ── Row 1 : Gamification ── */}
      {gami && (
        <div style={S.grid3}>
          <StatCard
            title="Niveau"
            value={`Niv. ${gami.level}`}
            sub="HTB Score"
            color="#9fef00"
            pct={xpInLevel}
          />
          <StatCard
            title="Points XP"
            value={`${gami.xpPoints} XP`}
            sub={`${xpInLevel}/100 → Niv. ${gami.level + 1}`}
            color="#2cb5e8"
            pct={xpInLevel}
          />
          <StatCard
            title="Série active"
            value={
              <>
                <i
                  className="fas fa-fire"
                  style={{
                    fontSize: "1.5rem",
                    marginRight: 8,
                    color: "#ffaf00",
                  }}
                ></i>
                {gami.currentStreak}
              </>
            }
            sub="Jours consécutifs"
            color="#ffaf00"
            pct={Math.min(gami.currentStreak * 10, 100)}
          />
        </div>
      )}

      {/* ── Row 2 : Notes & Quiz ── */}
      <div style={S.grid2}>
        <StatCard
          title="Moyenne des notes"
          value={grades.length ? `${avgGrade.toFixed(1)}/20` : "—"}
          sub={`${grades.length} note(s) enregistrée(s)`}
          color="#9fef00"
          pct={grades.length ? (avgGrade / 20) * 100 : 0}
        />
        <StatCard
          title="Score moyen aux quiz"
          value={quizResults.length ? `${avgQuiz.toFixed(0)}%` : "—"}
          sub={`${quizResults.length} quiz complété(s)`}
          color="#a855f7"
          pct={avgQuiz}
        />
      </div>

      {/* ── Profil Adaptatif ── */}
      {profil ? (
        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <p style={S.cardTitle}>
            <i
              className="fas fa-brain"
              style={{ marginRight: 8, color: "var(--info)" }}
            ></i>{" "}
            Profil Adaptatif
          </p>
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            {/* Niveau global */}
            {niveauCfg && (
              <div style={{ minWidth: 180, flex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".5rem",
                    background: `${niveauCfg.color}18`,
                    border: `1px solid ${niveauCfg.color}44`,
                    borderRadius: 8,
                    padding: ".4rem .9rem",
                    marginBottom: ".75rem",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>
                    <i className={niveauCfg.icon}></i>
                  </span>
                  <span
                    style={{
                      color: niveauCfg.color,
                      fontWeight: 800,
                      fontSize: ".9rem",
                    }}
                  >
                    {niveauCfg.label}
                  </span>
                </div>
                <div>
                  <p style={S.label}>Niveau global</p>
                  <BarFill pct={niveauCfg.pct} color={niveauCfg.color} />
                </div>
                {profil.classeMoyenne != null && (
                  <div style={{ marginTop: ".85rem" }}>
                    <p
                      style={{ ...S.big, fontSize: "1.5rem", color: "#9fef00" }}
                    >
                      {profil.classeMoyenne.toFixed(1)}
                      <span style={{ fontSize: ".9rem", color: "#556987" }}>
                        /20
                      </span>
                    </p>
                    <p style={S.label}>Moyenne de classe</p>
                    <BarFill
                      pct={(profil.classeMoyenne / 20) * 100}
                      color="#9fef00"
                    />
                  </div>
                )}
                <p style={{ ...S.label, marginTop: ".75rem" }}>
                  Mis à jour le {fmtDate(profil.dernierMisAJour)}
                </p>
              </div>
            )}

            {/* Compétences */}
            {profil.competences &&
              Object.keys(profil.competences).length > 0 && (
                <div style={{ flex: 2, minWidth: 240 }}>
                  <p
                    style={{
                      color: "#a4b1cd",
                      fontSize: ".8rem",
                      fontWeight: 700,
                      marginBottom: ".75rem",
                    }}
                  >
                    Compétences évaluées
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".6rem",
                    }}
                  >
                    {Object.entries(profil.competences).map(([name, level]) => {
                      const lvlMap: Record<string, number> = {
                        FAIBLE: 25,
                        MOYEN: 55,
                        BON: 80,
                        EXCELLENT: 100,
                      };
                      const pct = lvlMap[level.toUpperCase()] ?? 50;
                      const clr =
                        pct >= 80
                          ? "#9fef00"
                          : pct >= 55
                            ? "#ffaf00"
                            : "#ff3e3e";
                      return (
                        <div key={name}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{ color: "#e5eaf3", fontSize: ".8rem" }}
                            >
                              {name}
                            </span>
                            <span
                              style={{
                                color: clr,
                                fontSize: ".75rem",
                                fontWeight: 700,
                              }}
                            >
                              {level}
                            </span>
                          </div>
                          <BarFill pct={pct} color={clr} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div
          style={{
            ...S.card,
            marginBottom: "1rem",
            textAlign: "center",
            padding: "2rem",
            color: "#556987",
          }}
        >
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: ".5rem",
              color: "var(--border-light)",
            }}
          >
            <i className="fas fa-brain"></i>
          </div>
          <p style={{ margin: 0, color: "#a4b1cd", fontWeight: 600 }}>
            Profil adaptatif non encore configuré
          </p>
          <p style={{ margin: 0, fontSize: ".8rem" }}>
            Il sera généré automatiquement au fil de vos résultats.
          </p>
        </div>
      )}

      {/* ── Lacunes détectées ── */}
      {lacunes.length > 0 && (
        <div style={{ ...S.card, marginBottom: "1rem" }}>
          <p style={S.cardTitle}>
            <i
              className="fas fa-exclamation-triangle"
              style={{ marginRight: 8, color: "#ff3e3e" }}
            ></i>
            Lacunes détectées ({lacunes.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem" }}>
            {lacunes.map((l: any) => {
              const isFailble = l.niveau === "FAIBLE";
              const color = isFailble ? "#ff3e3e" : "#ffaf00";
              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                    background: `${color}11`,
                    border: `1px solid ${color}44`,
                    borderRadius: 8,
                    padding: ".45rem .9rem",
                  }}
                >
                  <i
                    className="fas fa-exclamation-circle"
                    style={{ color, fontSize: ".8rem" }}
                  ></i>
                  <span
                    style={{
                      color: "#e5eaf3",
                      fontSize: ".82rem",
                      fontWeight: 600,
                    }}
                  >
                    {l.competence}
                  </span>
                  <span
                    style={{
                      background: `${color}22`,
                      color,
                      borderRadius: 4,
                      fontSize: ".65rem",
                      fontWeight: 800,
                      padding: "1px 7px",
                    }}
                  >
                    {l.niveau}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ ...S.label, marginTop: ".75rem" }}>
            <i className="fas fa-info-circle" style={{ marginRight: 4 }}></i>
            Ces lacunes ont été détectées automatiquement suite à vos quiz.
            Consultez vos recommandations ci-dessous.
          </p>
        </div>
      )}

      {/* ── Recommandations ── */}
      <div style={S.card}>
        <p style={S.cardTitle}>
          <i
            className="fas fa-lightbulb"
            style={{ marginRight: 8, color: "var(--warning)" }}
          ></i>{" "}
          Recommandations personnalisées
        </p>
        {recos.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "1.5rem", color: "#556987" }}
          >
            <div
              style={{
                fontSize: "2rem",
                marginBottom: ".5rem",
                color: "var(--border-light)",
              }}
            >
              <i className="fas fa-robot"></i>
            </div>
            <p style={{ margin: 0, fontSize: ".85rem" }}>
              Aucune recommandation pour l'instant.
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}
          >
            {recos.slice(0, 8).map((reco) => {
              const color = RECO_COLOR[reco.typeReco] ?? "#9fef00";
              return (
                <div
                  key={reco.id}
                  onClick={async () => {
                    if (!reco.vue) {
                      await markRecommandationAsVue(reco.id);
                      setRecos((prev) =>
                        prev.map((r) =>
                          r.id === reco.id ? { ...r, vue: true } : r,
                        ),
                      );
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: ".85rem",
                    background: reco.vue
                      ? "transparent"
                      : "rgba(159,239,0,.04)",
                    border: `1px solid ${reco.vue ? "#1e2d40" : "rgba(159,239,0,.15)"}`,
                    borderRadius: 8,
                    padding: ".75rem 1rem",
                    cursor: reco.vue ? "default" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{ fontSize: "1.3rem", flexShrink: 0, color: color }}
                  >
                    <i
                      className={RECO_ICON[reco.typeReco] ?? "fas fa-lightbulb"}
                    ></i>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".5rem",
                        marginBottom: ".25rem",
                      }}
                    >
                      <span
                        style={{
                          background: `${color}18`,
                          border: `1px solid ${color}44`,
                          color,
                          borderRadius: 4,
                          fontSize: ".65rem",
                          fontWeight: 800,
                          padding: ".15em .5em",
                          textTransform: "uppercase",
                        }}
                      >
                        {reco.typeReco}
                      </span>
                      <span style={{ color: "#556987", fontSize: ".72rem" }}>
                        Cible:{" "}
                        <strong style={{ color: "#a4b1cd" }}>
                          {reco.cibleId}
                        </strong>
                      </span>
                      {!reco.vue && (
                        <span
                          style={{
                            background: "rgba(159,239,0,.15)",
                            color: "#9fef00",
                            borderRadius: 99,
                            fontSize: ".6rem",
                            padding: "1px 7px",
                            fontWeight: 800,
                          }}
                        >
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        color: "#a4b1cd",
                        fontSize: ".8rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {reco.raison || "Recommandation basée sur votre profil"}
                    </p>
                    <p
                      style={{
                        margin: ".2rem 0 0",
                        color: "#4a5568",
                        fontSize: ".68rem",
                      }}
                    >
                      {fmtDate(reco.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
