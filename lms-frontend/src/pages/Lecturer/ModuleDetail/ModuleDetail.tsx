import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  getMaterialsByModuleId,
  getModuleById,
  getQuizzesByModuleId,
  getForumThreadsByModuleId,
  createMaterial,
  deleteMaterial,
  createQuiz,
  deleteQuiz,
  createForumThread,
  upvoteThread,
} from "../../../services/api/course";
import {
  getStudentDetailsByUsername,
  getLecturerDetailsByUsername,
} from "../../../services/api/user";
import { useAuth as useAuthContext } from "../../../services/AuthContext";
import PageLoading from "../../../components/Admin/PageLoading";
import api from "../../../services/api/api";
import {
  generateQuizAi,
  generateCourseTemplate,
} from "../../../services/api/ai";

const generateSyllabusHtml = (t: any): string => {
  const info = t.moduleInfo || {};
  const seances: any[] = t.seances || [];
  const prereqHtml = (t.prerequisites || [])
    .map((p: string) => `<li>${p}</li>`)
    .join("");
  const skillsHtml = (t.skills || [])
    .map((s: string) => `<li>${s}</li>`)
    .join("");
  const biblioHtml = (t.bibliography || [])
    .map((b: string) => `<li>${b}</li>`)
    .join("");
  const toolsHtml = (t.tools || [])
    .map(
      (tool: string) =>
        `<span style="background:#f3f4f6;border:1px solid #d1d5db;padding:3px 12px;border-radius:20px;font-size:13px;margin:3px;display:inline-block">${tool}</span>`,
    )
    .join("");
  const seanceRows = seances
    .map((s: any) => {
      const typeLabel =
        s.typeSeance === "COURS_MAGISTRAL" ? "CM" : s.typeSeance;
      const typeColor =
        s.typeSeance === "COURS_MAGISTRAL"
          ? "#2563eb"
          : s.typeSeance === "TD"
            ? "#16a34a"
            : "#d97706";
      return `<tr>
        <td style="text-align:center;padding:10px 14px;border-bottom:1px solid #e5e7eb">
          <span style="background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor};padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700">${typeLabel}${s.ordre}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;font-size:14px">${s.title}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#555">${s.objectifs || ""}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;color:#777;font-size:13px">${s.duree ? s.duree / 60 + "h" : "2h"}</td>
      </tr>`;
    })
    .join("");
  const cc = t.evaluation?.continu ?? 40;
  const ex = t.evaluation?.examen ?? 60;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Syllabus — ${info.title || "Module"}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff}
.header{background:linear-gradient(135deg,#1a2332 0%,#2a3f5f 100%);color:#fff;padding:40px 48px}
.header h1{font-size:26px;font-weight:800;margin-bottom:6px}
.header .sub{font-size:13px;opacity:.7;margin-bottom:12px}
.badge{background:rgba(255,255,255,.15);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.3);display:inline-block;margin:3px}
.body{max-width:900px;margin:0 auto;padding:40px 48px}
.section{margin-bottom:32px}
.stitle{font-size:13px;font-weight:700;color:#1a2332;border-left:4px solid #9fef00;padding-left:12px;margin-bottom:14px;text-transform:uppercase;letter-spacing:.5px}
p{color:#374151;line-height:1.7;font-size:14px}
ul{padding-left:20px}li{margin-bottom:6px;font-size:14px;color:#374151;line-height:1.5}
.hgrid{display:flex;gap:16px;flex-wrap:wrap}
.hbox{text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;flex:1;min-width:100px}
.hnum{font-size:26px;font-weight:800;color:#1a2332}.hlbl{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
table{width:100%;border-collapse:collapse}
th{background:#1a2332;color:#fff;padding:10px 14px;text-align:left;font-size:13px;font-weight:600}
.ebar{display:flex;border-radius:8px;overflow:hidden;height:36px;margin-top:10px}
.ecc{background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.eex{background:#9fef00;color:#1a2332;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <div class="sub">${info.code || ""}${info.code && info.semester ? " • " : ""}${info.semester || ""}</div>
  <h1>${info.title || "Module"}</h1>
  <div style="margin-top:12px">
    <span class="badge">📚 Niveau ${info.level || ""}</span>
    <span class="badge">⏱ ${info.totalHours || 0}h Total</span>
    <span class="badge">🎓 ${info.credits || 3} Crédits</span>
  </div>
</div>
<div class="body">
  <div class="section">
    <div class="hgrid">
      <div class="hbox"><div class="hnum">${info.cmHours || 0}h</div><div class="hlbl">Cours Magistraux</div></div>
      <div class="hbox"><div class="hnum">${info.tdHours || 0}h</div><div class="hlbl">Travaux Dirigés</div></div>
      <div class="hbox"><div class="hnum">${info.tpHours || 0}h</div><div class="hlbl">Travaux Pratiques</div></div>
      <div class="hbox" style="border-color:#9fef00;background:#f7fff0"><div class="hnum" style="color:#4a7c00">${info.totalHours || 0}h</div><div class="hlbl">Total</div></div>
    </div>
  </div>
  ${t.description ? `<div class="section"><div class="stitle">Description</div><p>${t.description}</p></div>` : ""}
  ${t.generalObjectives ? `<div class="section"><div class="stitle">Objectif Général</div><p>${t.generalObjectives}</p></div>` : ""}
  ${
    t.prerequisites?.length || t.skills?.length
      ? `<div class="section" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
    ${t.prerequisites?.length ? `<div><div class="stitle">Prérequis</div><ul>${prereqHtml}</ul></div>` : ""}
    ${t.skills?.length ? `<div><div class="stitle">Compétences Acquises</div><ul>${skillsHtml}</ul></div>` : ""}
  </div>`
      : ""
  }
  <div class="section">
    <div class="stitle">Plan de Cours (${seances.length} séances)</div>
    <table><thead><tr><th style="width:80px">Type</th><th>Intitulé</th><th>Objectifs</th><th style="width:60px">Durée</th></tr></thead>
    <tbody>${seanceRows}</tbody></table>
  </div>
  ${
    t.evaluation
      ? `<div class="section"><div class="stitle">Évaluation</div>
    <div class="ebar">
      <div class="ecc" style="width:${cc}%">CC ${cc}%</div>
      <div class="eex" style="width:${ex}%">Examen ${ex}%</div>
    </div>
    ${t.evaluation.description ? `<p style="margin-top:10px">${t.evaluation.description}</p>` : ""}
  </div>`
      : ""
  }
  ${t.bibliography?.length ? `<div class="section"><div class="stitle">Bibliographie</div><ul>${biblioHtml}</ul></div>` : ""}
  ${t.tools?.length ? `<div class="section"><div class="stitle">Outils & Technologies</div><div style="margin-top:8px">${toolsHtml}</div></div>` : ""}
  <div class="footer">Syllabus généré par LMS EPT Intelligence Artificielle</div>
</div></body></html>`;
};

const downloadSyllabus = (template: any) => {
  const html = generateSyllabusHtml(template);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Syllabus_${(template.moduleInfo?.title || "Module").replace(/\s+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const SyllabusSectionBlock: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
  noMargin?: boolean;
}> = ({ title, icon, children, noMargin }) => (
  <div style={{ marginBottom: noMargin ? 0 : "1.5rem" }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.75rem",
        borderLeft: "3px solid #9fef00",
        paddingLeft: "0.75rem",
      }}
    >
      <i
        className={`fas ${icon}`}
        style={{ color: "#9fef00", fontSize: "0.8rem" }}
      ></i>
      <span
        style={{
          color: "#e5eaf3",
          fontSize: "0.8rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);

const LecturerModuleDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<
    "materials" | "quiz" | "forum" | "lessons" | "chatbot"
  >("materials");
  const [module, setModule] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lesson form
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    format: "IN-PERSON",
    status: "DRAFT",
    duration: 2,
    module: { id: id },
  });

  // Material form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "PDF",
    fileUrl: "",
    moduleId: id,
  });

  // Quiz form
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    moduleId: id,
  });

  // Forum form
  const [showForumModal, setShowForumModal] = useState(false);
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    authorId: "",
    authorName: "",
    moduleId: id,
  });

  // Template generation
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [importingTemplate, setImportingTemplate] = useState(false);
  const [templateContext, setTemplateContext] = useState("");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        const moduleData = await getModuleById(id);
        setModule(moduleData);

        if (activeTab === "lessons") {
          // Fetch lessons via GET /api/course/course/module/{moduleId}
          const res = await api.get(`/course/course/module/${id}`);
          setLessons(Array.isArray(res.data) ? res.data : []);
        } else if (activeTab === "materials") {
          const materialsData = await getMaterialsByModuleId(id);
          setMaterials(Array.isArray(materialsData) ? materialsData : []);
        } else if (activeTab === "quiz") {
          const quizzesData = await getQuizzesByModuleId(id);
          setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
        } else if (activeTab === "forum") {
          const threadsData = await getForumThreadsByModuleId(id);
          setThreads(Array.isArray(threadsData) ? threadsData : []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab as any);
    }
  }, [location.state]);

  useEffect(() => {
    const resolveIdentity = async () => {
      if (user) {
        const role = localStorage.getItem("role");
        let details: any;
        try {
          if (role === "ROLE_STUDENT")
            details = await getStudentDetailsByUsername(user.username);
          else if (role === "ROLE_LECTURER")
            details = await getLecturerDetailsByUsername(user.username);
        } catch (e) {
          console.error(e);
        }

        setNewThread((prev) => ({
          ...prev,
          authorId: user.username,
          authorName: details?.fullName || user.username,
        }));
      }
    };
    resolveIdentity();
    fetchData();
  }, [id, activeTab, user]);

  // Lesson handlers
  const handleAddLesson = async (e: any) => {
    e.preventDefault();
    try {
      await api.post(`/course`, newLesson);
      setShowLessonModal(false);
      setNewLesson({ ...newLesson, title: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating lesson:", error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette séance ?")) {
      try {
        await api.delete(`/course/${lessonId}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting lesson:", error);
      }
    }
  };

  const updateLessonStatus = async (lessonId: string, status: string) => {
    try {
      await api.put(`/course/${lessonId}`, { status });
      fetchData();
    } catch (error) {
      console.error("Error updating lesson status:", error);
    }
  };

  // Material handlers
  const handleAddMaterial = async (e: any) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = newMaterial.fileUrl;

      // If it's a file type and a file is selected, upload it first
      if (
        newMaterial.type !== "VIDEO" &&
        newMaterial.type !== "LINK" &&
        selectedFile
      ) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await api.post("/course/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileUrl = uploadRes.data.url;
      }

      await createMaterial({ ...newMaterial, fileUrl });
      setNewMaterial({
        ...newMaterial,
        title: "",
        description: "",
        fileUrl: "",
      });
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error("Error creating material:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce support ?")) {
      try {
        await deleteMaterial(materialId);
        fetchData();
      } catch (error) {
        console.error("Error deleting material:", error);
      }
    }
  };

  // Quiz & Forum handlers
  const handleAddQuiz = async (e: any) => {
    e.preventDefault();
    try {
      await createQuiz(newQuiz);
      setShowQuizModal(false);
      setNewQuiz({ ...newQuiz, title: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce quiz ?")) {
      try {
        await deleteQuiz(quizId);
        fetchData();
      } catch (error) {
        console.error("Error deleting quiz:", error);
      }
    }
  };

  const handleGenerateTemplate = async () => {
    setGeneratingTemplate(true);
    setTemplateError(null);
    try {
      const template = await generateCourseTemplate(
        Number(id),
        templateContext || undefined,
      );
      // Patcher moduleInfo avec les vraies données du module
      // (ne pas faire confiance à l'IA pour conserver les valeurs numériques)
      const patchedTemplate = {
        ...template,
        moduleInfo: {
          title: module?.name || template.moduleInfo?.title || "Module",
          code: module?.codeEC || template.moduleInfo?.code || "",
          level: module?.level || template.moduleInfo?.level || "",
          semester: module?.semester || template.moduleInfo?.semester || "",
          cmHours: module?.cmHours ?? template.moduleInfo?.cmHours ?? 0,
          tdHours: module?.tdHours ?? template.moduleInfo?.tdHours ?? 0,
          tpHours: module?.tpHours ?? template.moduleInfo?.tpHours ?? 0,
          totalHours: module?.totalCH ?? template.moduleInfo?.totalHours ?? 0,
          credits: module?.creditsEC ?? template.moduleInfo?.credits ?? 3,
        },
      };
      setGeneratedTemplate(patchedTemplate);
      setShowTemplateModal(true);
    } catch (err: any) {
      console.error("Template generation failed:", err);
      const msg: string = err?.message || "Erreur inconnue";
      if (msg.includes("non configurée") || msg.includes("GROQ_API_KEY")) {
        setTemplateError(
          "⚠️ Le service IA (Groq) n'est pas configuré sur ce serveur.",
        );
      } else {
        setTemplateError(`❌ ${msg.substring(0, 150)}`);
      }
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleImportTemplate = async () => {
    if (!generatedTemplate?.seances) return;
    setImportingTemplate(true);
    setTemplateError(null);
    let success = 0;
    let firstError = "";
    for (const seance of generatedTemplate.seances) {
      try {
        await api.post("/course", {
          title: seance.title,
          typeSeance: seance.typeSeance,
          ordre: seance.ordre,
          duree: seance.duree,
          objectifs: seance.objectifs,
          contenu: seance.contenu,
          status: "DRAFT",
          format: "IN-PERSON",
          module: { id: Number(id) },
        });
        success++;
      } catch (err: any) {
        const errMsg = err?.response?.data || err?.message || "Erreur inconnue";
        console.error("Failed to import seance:", seance.title, errMsg);
        if (!firstError) firstError = String(errMsg).substring(0, 120);
      }
    }
    setImportingTemplate(false);
    if (success > 0) {
      setShowTemplateModal(false);
      setGeneratedTemplate(null);
      setTemplateContext("");
      setTemplateError(null);
      setTemplateSuccess(`✅ ${success} séance(s) importée(s) avec succès !`);
      // Fetch les séances directement (sans dépendre du state activeTab)
      try {
        const res = await api.get(`/course/course/module/${id}`);
        setLessons(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Failed to fetch lessons after import", e);
      }
      setActiveTab("lessons" as any);
    } else {
      setTemplateError(
        `❌ Import échoué${firstError ? ` : ${firstError}` : ". Vérifiez la console."}`,
      );
    }
  };

  const handleCreateThread = async (e: any) => {
    e.preventDefault();
    try {
      await createForumThread(newThread);
      setShowForumModal(false);
      setNewThread({ ...newThread, title: "", content: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  const handleUpvoteThread = async (e: React.MouseEvent, threadId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      try {
        await upvoteThread(threadId.toString(), user.username);
        fetchData();
      } catch (error) {
        console.error("Error upvoting thread:", error);
      }
    }
  };

  if (loading && !module) return <PageLoading />;

  const tabs = [
    { id: "materials", label: "Supports", icon: "fa-book" },
    { id: "lessons", label: "Séances", icon: "fa-chalkboard-teacher" },
    { id: "quiz", label: "Quiz", icon: "fa-question-circle" },
    { id: "forum", label: "Forum", icon: "fa-comments" },
    { id: "chatbot", label: "Assistant IA", icon: "fa-robot" },
  ];

  return (
    <div style={{ paddingBottom: "3rem" }}>
      {/* Header HTB */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div>
            <Link to="/lecturer" style={S.backBtn}>
              <i className="fas fa-arrow-left"></i> Retour aux modules
            </Link>
            <p style={S.headerGreet}>
              <span style={S.green}>{module?.mId}</span> • {module?.semester}
            </p>
            <h1 style={S.headerTitle}>
              {module?.title?.replace(/^\[.*?\]\s*/, "")}
            </h1>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  background: "#111927",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "1px solid #2a3f5f",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    color: "#556987",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  PROGRESSION :
                </span>
                <input
                  type="number"
                  value={module?.hoursDone || 0}
                  onChange={async (e) => {
                    const val = parseInt(e.target.value);
                    try {
                      await api.put(`/course/module/${id}/hours`, {
                        hoursDone: val,
                      });
                      setModule({ ...module, hoursDone: val });
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={{
                    ...S.input,
                    width: 60,
                    padding: "0.2rem 0.5rem",
                    textAlign: "center",
                  }}
                />
                <span style={{ color: "#9fef00", fontWeight: 700 }}>
                  / {module?.totalHours || 0} H
                </span>
                <div
                  style={{
                    width: 100,
                    height: 6,
                    background: "#111927",
                    borderRadius: 3,
                    border: "1px solid #2a3f5f",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, ((module?.hoursDone || 0) / (module?.totalHours || 1)) * 100)}%`,
                      background: "#9fef00",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation HTB */}
      <div style={{ background: "#111927", borderBottom: "1px solid #2a3f5f" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            gap: "2rem",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...S.tabBtn,
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #9fef00"
                    : "2px solid transparent",
                color: activeTab === tab.id ? "#9fef00" : "#556987",
              }}
            >
              <i
                className={`fas ${tab.icon}`}
                style={{ marginRight: "0.5rem" }}
              ></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={S.content}>
        {/* LESSONS / SÉANCES TAB */}
        {activeTab === "lessons" && (
          <div>
            <div style={S.flexBetween}>
              <h2 style={S.sectionTitle}>
                <i
                  className="fas fa-chalkboard-teacher"
                  style={{ marginRight: "0.5rem", color: "#9fef00" }}
                ></i>
                Séances ({lessons.length})
              </h2>
              <button
                style={S.primaryBtn}
                onClick={() => setShowLessonModal(true)}
              >
                <i className="fas fa-plus"></i> Nouvelle Séance
              </button>
            </div>
            {lessons.length === 0 ? (
              <div style={S.emptyState}>
                <i
                  className="fas fa-chalkboard-teacher"
                  style={{ fontSize: "2rem", marginBottom: "1rem" }}
                ></i>
                <p>
                  Aucune séance. Utilisez{" "}
                  <strong>Assistant IA → Générer le Plan</strong> pour en créer
                  automatiquement.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {lessons.map((lesson: any) => {
                  const typeColors: any = {
                    COURS_MAGISTRAL: "#2cb5e8",
                    TD: "#9fef00",
                    TP: "#f59e0b",
                    TPE: "#a855f7",
                  };
                  const typeLabels: any = {
                    COURS_MAGISTRAL: "CM",
                    TD: "TD",
                    TP: "TP",
                    TPE: "TPE",
                  };
                  const color = typeColors[lesson.typeSeance] || "#556987";
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        ...S.card,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "1rem",
                        padding: "1rem 1.25rem",
                      }}
                    >
                      <span
                        style={{
                          background: `${color}22`,
                          color,
                          border: `1px solid ${color}`,
                          padding: "3px 10px",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          marginTop: 2,
                        }}
                      >
                        {typeLabels[lesson.typeSeance] ||
                          lesson.typeSeance ||
                          "—"}
                        {lesson.ordre ? ` ${lesson.ordre}` : ""}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            margin: 0,
                            color: "#e5eaf3",
                            fontSize: "0.95rem",
                            fontWeight: 600,
                          }}
                        >
                          {lesson.title}
                        </h4>
                        {lesson.objectifs && (
                          <p
                            style={{
                              margin: "0.3rem 0 0",
                              color: "#556987",
                              fontSize: "0.82rem",
                            }}
                          >
                            {lesson.objectifs}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        {lesson.duree && (
                          <span
                            style={{ color: "#556987", fontSize: "0.8rem" }}
                          >
                            <i
                              className="fas fa-clock"
                              style={{ marginRight: 4 }}
                            ></i>
                            {lesson.duree / 60}h
                          </span>
                        )}
                        <span
                          style={{
                            background:
                              lesson.status === "PUBLISHED"
                                ? "#9fef0022"
                                : "#2a3f5f",
                            color:
                              lesson.status === "PUBLISHED"
                                ? "#9fef00"
                                : "#556987",
                            border: `1px solid ${lesson.status === "PUBLISHED" ? "#9fef00" : "#2a3f5f"}`,
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                          }}
                        >
                          {lesson.status === "PUBLISHED"
                            ? "Publié"
                            : "Brouillon"}
                        </span>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          style={S.dangerBtn}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === "materials" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "2rem",
            }}
          >
            {/* Add form */}
            <div style={S.card}>
              <div style={{ ...S.cardBody, borderBottom: "1px solid #2a3f5f" }}>
                <h3 style={S.cardTitle}>Nouveau Support</h3>
              </div>
              <form onSubmit={handleAddMaterial}>
                <div style={S.cardBody}>
                  <div style={S.formGroup}>
                    <label style={S.label}>Titre</label>
                    <input
                      type="text"
                      required
                      style={S.input}
                      value={newMaterial.title}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Description</label>
                    <textarea
                      rows={3}
                      style={S.input}
                      value={newMaterial.description}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div style={S.formGroup}>
                    <label style={S.label}>Type</label>
                    <select
                      style={S.input}
                      value={newMaterial.type}
                      onChange={(e) =>
                        setNewMaterial({ ...newMaterial, type: e.target.value })
                      }
                    >
                      <option value="PDF">Document PDF</option>
                      <option value="VIDEO">Lien Vidéo</option>
                      <option value="LINK">Site Web Externe</option>
                    </select>
                  </div>
                  {newMaterial.type === "VIDEO" ||
                  newMaterial.type === "LINK" ? (
                    <div style={S.formGroup}>
                      <label style={S.label}>
                        {newMaterial.type === "VIDEO"
                          ? "Lien URL de la vidéo"
                          : "Lien du site web"}
                      </label>
                      <input
                        type="url"
                        required
                        style={S.input}
                        value={newMaterial.fileUrl}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            fileUrl: e.target.value,
                          })
                        }
                        placeholder={
                          newMaterial.type === "VIDEO"
                            ? "https://youtube.com/..."
                            : "https://..."
                        }
                      />
                    </div>
                  ) : (
                    <div style={S.formGroup}>
                      <label style={S.label}>Fichier</label>
                      <input
                        type="file"
                        required={!newMaterial.fileUrl}
                        style={{ ...S.input, padding: "0.4rem" }}
                        onChange={(e) =>
                          setSelectedFile(
                            e.target.files ? e.target.files[0] : null,
                          )
                        }
                      />
                      <small
                        style={{
                          color: "#556987",
                          marginTop: "0.2rem",
                          display: "block",
                        }}
                      >
                        PDF, DOCX, ZIP, etc.
                      </small>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      ...S.primaryBtn,
                      width: "100%",
                      justifyContent: "center",
                      opacity: uploading ? 0.7 : 1,
                    }}
                  >
                    {uploading ? "Envoi..." : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>

            {/* List */}
            <div>
              {materials.length === 0 ? (
                <div style={S.emptyState}>
                  <i className="fas fa-file-pdf"></i>
                  <p>Aucun support de cours disponible.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      style={{
                        ...S.card,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "1rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2rem",
                          color: mat.type === "PDF" ? "#ff3e3e" : "#2cb5e8",
                          marginRight: "1rem",
                        }}
                      >
                        <i
                          className={`fas ${mat.type === "PDF" ? "fa-file-pdf" : mat.type === "VIDEO" ? "fa-video" : "fa-link"}`}
                        ></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            margin: 0,
                            color: "#e5eaf3",
                            fontSize: "1rem",
                          }}
                        >
                          {mat.title}
                        </h4>
                        <p
                          style={{
                            margin: "0.2rem 0 0",
                            color: "#556987",
                            fontSize: "0.85rem",
                          }}
                        >
                          {mat.description}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            ...S.outlineBtn,
                            color: "#2cb5e8",
                            borderColor: "#2cb5e8",
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          style={S.dangerBtn}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === "quiz" && (
          <div>
            <div style={S.flexBetween}>
              <h2 style={S.sectionTitle}>Évaluations</h2>
              <button
                style={S.primaryBtn}
                onClick={() => setShowQuizModal(true)}
              >
                <i className="fas fa-plus"></i> Nouveau Quiz
              </button>
            </div>
            {quizzes.length === 0 ? (
              <div style={S.emptyState}>
                <i className="fas fa-question-circle"></i>
                <p>Aucun quiz n'a été créé.</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {quizzes.map((quiz) => (
                  <div key={quiz.id} style={S.card}>
                    <div style={S.cardBody}>
                      <h3 style={S.cardTitle}>{quiz.title}</h3>
                      <p
                        style={{
                          color: "#556987",
                          fontSize: "0.9rem",
                          marginBottom: "1rem",
                        }}
                      >
                        {quiz.description}
                      </p>
                      <div style={S.flexBetween}>
                        <span
                          style={{
                            color: "#9fef00",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          {quiz.questionCount ?? quiz.questions?.length ?? 0}{" "}
                          Questions
                        </span>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <Link
                            to={`/lecturer/${id}/quiz`}
                            state={{ editQuizId: quiz.id }}
                            style={{
                              ...S.outlineBtn,
                              color: "#2cb5e8",
                              borderColor: "#2cb5e8",
                            }}
                            title="Modifier / Ajouter des questions"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            style={S.dangerBtn}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FORUM TAB */}
        {activeTab === "forum" && (
          <div>
            <div style={S.flexBetween}>
              <h2 style={S.sectionTitle}>Discussions</h2>
              <button
                style={S.primaryBtn}
                onClick={() => setShowForumModal(true)}
              >
                <i className="fas fa-plus"></i> Nouvelle Discussion
              </button>
            </div>
            {threads.length === 0 ? (
              <div style={S.emptyState}>
                <i className="fas fa-comments"></i>
                <p>Aucune discussion dans le forum.</p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {threads.map((thread) => (
                  <div key={thread.id} style={S.card}>
                    <div
                      style={{ ...S.cardBody, display: "flex", gap: "1rem" }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "#2a3f5f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      >
                        {thread.authorName?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={S.flexBetween}>
                          <h3 style={{ ...S.cardTitle, margin: 0 }}>
                            {thread.title}
                            {thread.solution && (
                              <span
                                style={{
                                  marginLeft: "0.5rem",
                                  fontSize: "0.7rem",
                                  background: "#14b8a611",
                                  color: "#14b8a6",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: 4,
                                  border: "1px solid #14b8a6",
                                }}
                              >
                                <i className="fas fa-check"></i> Résolu
                              </span>
                            )}
                          </h3>
                          <span
                            style={{ fontSize: "0.8rem", color: "#556987" }}
                          >
                            {new Date(thread.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#556987",
                            fontSize: "0.9rem",
                            margin: "0.5rem 0",
                          }}
                        >
                          {thread.content.substring(0, 150)}...
                        </p>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#556987",
                            display: "flex",
                            gap: "1rem",
                          }}
                        >
                          <span>
                            <i className="fas fa-eye"></i> {thread.viewCount}
                          </span>
                          <span>
                            <i className="fas fa-thumbs-up text-primary"></i>{" "}
                            {thread.upvoteCount}
                          </span>
                          <span>
                            <i className="fas fa-comment"></i>{" "}
                            {thread.postCount ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHATBOT TAB */}
        {activeTab === "chatbot" && (
          <div style={{ ...S.card, padding: "2rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <i
                className="fas fa-robot"
                style={{
                  fontSize: "4rem",
                  color: "#9fef00",
                  marginBottom: "1rem",
                }}
              ></i>
              <h2 style={S.headerTitle}>
                Assistant IA - {module?.title?.replace(/^\[.*?\]\s*/, "")}
              </h2>
              <p style={{ color: "#556987" }}>
                Utilisez l'intelligence artificielle pour vous aider dans la
                gestion de votre cours.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "2rem",
              }}
            >
              <div
                style={{ ...S.card, background: "#111927", padding: "1.5rem" }}
              >
                <h3 style={S.cardTitle}>
                  <i
                    className="fas fa-magic"
                    style={{ color: "#9fef00", marginRight: "0.5rem" }}
                  ></i>{" "}
                  Génération de Quiz
                </h3>
                <p style={{ color: "#556987", fontSize: "0.9rem" }}>
                  L'IA peut analyser vos supports de cours pour générer
                  automatiquement un quiz de 5 questions pertinentes.
                </p>
                <button
                  style={{
                    ...S.primaryBtn,
                    width: "100%",
                    justifyContent: "center",
                    marginTop: "1rem",
                    opacity: (window as any).__generatingQuiz ? 0.6 : 1,
                  }}
                  disabled={(window as any).__generatingQuiz}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Générer un quiz basé sur les supports de ce module ?",
                      )
                    )
                      return;
                    (window as any).__generatingQuiz = true;
                    const btn = document.activeElement as HTMLButtonElement;
                    if (btn) btn.textContent = "⏳ Génération en cours...";
                    try {
                      const quizData = await generateQuizAi(Number(id));
                      navigate(`/lecturer/${id}/quiz`, {
                        state: { aiGeneratedQuiz: quizData },
                      });
                    } catch (err) {
                      console.error("Quiz generation failed:", err);
                      alert("Erreur lors de la génération du quiz. Réessayez.");
                    } finally {
                      (window as any).__generatingQuiz = false;
                      if (btn) btn.textContent = "Générer un Quiz IA";
                    }
                  }}
                >
                  Générer un Quiz IA
                </button>
              </div>

              <div
                style={{ ...S.card, background: "#111927", padding: "1.5rem" }}
              >
                <h3 style={S.cardTitle}>
                  <i
                    className="fas fa-comment-alt"
                    style={{ color: "#2cb5e8", marginRight: "0.5rem" }}
                  ></i>{" "}
                  Chat Pédagogique
                </h3>
                <p style={{ color: "#556987", fontSize: "0.9rem" }}>
                  Discutez avec l'IA pour préparer vos cours ou vérifier la
                  cohérence de vos supports.
                </p>
                <button
                  style={{
                    ...S.outlineBtn,
                    width: "100%",
                    justifyContent: "center",
                    marginTop: "1rem",
                    color: "#2cb5e8",
                    borderColor: "#2cb5e8",
                  }}
                  onClick={() => {
                    const widget = document.querySelector(
                      ".chatbot-toggle",
                    ) as HTMLButtonElement;
                    if (widget) widget.click();
                  }}
                >
                  Ouvrir le Chat
                </button>
              </div>

              <div
                style={{ ...S.card, background: "#111927", padding: "1.5rem" }}
              >
                <h3 style={S.cardTitle}>
                  <i
                    className="fas fa-layer-group"
                    style={{ color: "#a855f7", marginRight: "0.5rem" }}
                  ></i>
                  Générer le Plan de Cours
                </h3>
                <p style={{ color: "#556987", fontSize: "0.9rem" }}>
                  L'IA génère automatiquement le plan complet des séances (CM,
                  TD, TP) adapté à la charge horaire du module.
                </p>
                <textarea
                  placeholder="Instructions optionnelles (ex: focus sur la pratique, inclure des cas réels...)"
                  rows={2}
                  style={{
                    ...S.input,
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    resize: "vertical",
                  }}
                  value={templateContext}
                  onChange={(e) => setTemplateContext(e.target.value)}
                />
                <button
                  style={{
                    ...S.primaryBtn,
                    width: "100%",
                    justifyContent: "center",
                    marginTop: "0.75rem",
                    background: generatingTemplate ? "#556987" : "#a855f7",
                    color: "#fff",
                    opacity: generatingTemplate ? 0.7 : 1,
                  }}
                  disabled={generatingTemplate}
                  onClick={handleGenerateTemplate}
                >
                  {generatingTemplate ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Génération...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i> Générer le Plan
                    </>
                  )}
                </button>
                {templateError && (
                  <p
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.6rem 0.8rem",
                      background: "#ff3e3e11",
                      border: "1px solid #ff3e3e44",
                      borderRadius: 4,
                      color: "#ff7070",
                      fontSize: "0.82rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {templateError}
                  </p>
                )}
                {templateSuccess && (
                  <p
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.6rem 0.8rem",
                      background: "#9fef0011",
                      border: "1px solid #9fef0044",
                      borderRadius: 4,
                      color: "#9fef00",
                      fontSize: "0.82rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {templateSuccess}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showLessonModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={S.cardTitle}>Nouvelle Séance</h3>
            <form onSubmit={handleAddLesson}>
              <div style={S.formGroup}>
                <label style={S.label}>
                  Titre (ex: Cours 1 - Introduction)
                </label>
                <input
                  type="text"
                  required
                  style={S.input}
                  value={newLesson.title}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, title: e.target.value })
                  }
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Description</label>
                <textarea
                  rows={3}
                  style={S.input}
                  value={newLesson.description}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, description: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ ...S.formGroup, flex: 1 }}>
                  <label style={S.label}>Format</label>
                  <select
                    style={S.input}
                    value={newLesson.format}
                    onChange={(e) =>
                      setNewLesson({ ...newLesson, format: e.target.value })
                    }
                  >
                    <option value="IN-PERSON">Présentiel</option>
                    <option value="ONLINE">En Ligne</option>
                  </select>
                </div>
                <div style={{ ...S.formGroup, flex: 1 }}>
                  <label style={S.label}>Durée (Heures)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    style={S.input}
                    value={newLesson.duration}
                    onChange={(e) =>
                      setNewLesson({
                        ...newLesson,
                        duration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  style={{ ...S.outlineBtn, flex: 1 }}
                  onClick={() => setShowLessonModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ ...S.primaryBtn, flex: 1, justifyContent: "center" }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={S.cardTitle}>Nouveau Quiz</h3>
            <form onSubmit={handleAddQuiz}>
              <div style={S.formGroup}>
                <label style={S.label}>Titre</label>
                <input
                  type="text"
                  required
                  style={S.input}
                  value={newQuiz.title}
                  onChange={(e) =>
                    setNewQuiz({ ...newQuiz, title: e.target.value })
                  }
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Description</label>
                <textarea
                  rows={3}
                  style={S.input}
                  value={newQuiz.description}
                  onChange={(e) =>
                    setNewQuiz({ ...newQuiz, description: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  style={{ ...S.outlineBtn, flex: 1 }}
                  onClick={() => setShowQuizModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ ...S.primaryBtn, flex: 1, justifyContent: "center" }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForumModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h3 style={S.cardTitle}>Nouvelle Discussion</h3>
            <form onSubmit={handleCreateThread}>
              <div style={S.formGroup}>
                <label style={S.label}>Sujet</label>
                <input
                  type="text"
                  required
                  style={S.input}
                  value={newThread.title}
                  onChange={(e) =>
                    setNewThread({ ...newThread, title: e.target.value })
                  }
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Message</label>
                <textarea
                  rows={5}
                  required
                  style={S.input}
                  value={newThread.content}
                  onChange={(e) =>
                    setNewThread({ ...newThread, content: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  style={{ ...S.outlineBtn, flex: 1 }}
                  onClick={() => setShowForumModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ ...S.primaryBtn, flex: 1, justifyContent: "center" }}
                >
                  Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTemplateModal && generatedTemplate && (
        <div style={S.modalOverlay}>
          <div
            style={{
              ...S.modal,
              maxWidth: 800,
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            {/* Header du syllabus */}
            <div
              style={{
                background: "linear-gradient(135deg, #1a2332 0%, #2a3f5f 100%)",
                padding: "1.5rem 2rem",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "#556987",
                      fontSize: "0.75rem",
                      margin: "0 0 4px",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {generatedTemplate.moduleInfo?.code || ""}
                    {generatedTemplate.moduleInfo?.code &&
                    generatedTemplate.moduleInfo?.semester
                      ? " • "
                      : ""}
                    {generatedTemplate.moduleInfo?.semester || ""}
                  </p>
                  <h2
                    style={{
                      color: "#e5eaf3",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      margin: 0,
                    }}
                  >
                    {generatedTemplate.moduleInfo?.title ||
                      module?.name ||
                      "Syllabus"}
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginTop: "0.75rem",
                    }}
                  >
                    {[
                      `📚 Niveau ${generatedTemplate.moduleInfo?.level || ""}`,
                      `⏱ ${generatedTemplate.moduleInfo?.totalHours || 0}h Total`,
                      `🎓 ${generatedTemplate.moduleInfo?.credits || 3} Crédits`,
                      `📋 ${generatedTemplate.seances?.length || 0} Séances`,
                    ].map((badge) => (
                      <span
                        key={badge}
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          color: "#e5eaf3",
                          fontWeight: 600,
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  style={{
                    ...S.dangerBtn,
                    padding: "0.3rem 0.6rem",
                    flexShrink: 0,
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <div style={{ overflowY: "auto", flex: 1, padding: "1.5rem 2rem" }}>
              {/* Charge horaire */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                {[
                  {
                    label: "Cours Magistraux",
                    val: `${generatedTemplate.moduleInfo?.cmHours || 0}h`,
                    color: "#2cb5e8",
                  },
                  {
                    label: "Travaux Dirigés",
                    val: `${generatedTemplate.moduleInfo?.tdHours || 0}h`,
                    color: "#9fef00",
                  },
                  {
                    label: "Travaux Pratiques",
                    val: `${generatedTemplate.moduleInfo?.tpHours || 0}h`,
                    color: "#f59e0b",
                  },
                  {
                    label: "Total",
                    val: `${generatedTemplate.moduleInfo?.totalHours || 0}h`,
                    color: "#a855f7",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "#111927",
                      border: `1px solid ${item.color}33`,
                      borderRadius: 8,
                      padding: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        color: item.color,
                      }}
                    >
                      {item.val}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#556987",
                        marginTop: 2,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {generatedTemplate.description && (
                <SyllabusSectionBlock title="Description" icon="fa-align-left">
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {generatedTemplate.description}
                  </p>
                </SyllabusSectionBlock>
              )}

              {/* Objectif général */}
              {generatedTemplate.generalObjectives && (
                <SyllabusSectionBlock
                  title="Objectif Général"
                  icon="fa-bullseye"
                >
                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {generatedTemplate.generalObjectives}
                  </p>
                </SyllabusSectionBlock>
              )}

              {/* Prérequis + Compétences */}
              {generatedTemplate.prerequisites?.length ||
              generatedTemplate.skills?.length ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {generatedTemplate.prerequisites?.length > 0 && (
                    <SyllabusSectionBlock
                      title="Prérequis"
                      icon="fa-graduation-cap"
                      noMargin
                    >
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {generatedTemplate.prerequisites.map(
                          (p: string, i: number) => (
                            <li
                              key={i}
                              style={{
                                color: "#9ca3af",
                                fontSize: "0.85rem",
                                marginBottom: "0.4rem",
                              }}
                            >
                              {p}
                            </li>
                          ),
                        )}
                      </ul>
                    </SyllabusSectionBlock>
                  )}
                  {generatedTemplate.skills?.length > 0 && (
                    <SyllabusSectionBlock
                      title="Compétences Acquises"
                      icon="fa-check-circle"
                      noMargin
                    >
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {generatedTemplate.skills.map(
                          (s: string, i: number) => (
                            <li
                              key={i}
                              style={{
                                color: "#9ca3af",
                                fontSize: "0.85rem",
                                marginBottom: "0.4rem",
                              }}
                            >
                              {s}
                            </li>
                          ),
                        )}
                      </ul>
                    </SyllabusSectionBlock>
                  )}
                </div>
              ) : null}

              {/* Plan de séances */}
              <SyllabusSectionBlock
                title={`Plan de Cours — ${generatedTemplate.seances?.length || 0} séances`}
                icon="fa-list-ol"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {(generatedTemplate.seances || []).map(
                    (seance: any, idx: number) => {
                      const typeColors: any = {
                        COURS_MAGISTRAL: "#2cb5e8",
                        TD: "#9fef00",
                        TP: "#f59e0b",
                      };
                      const typeLabels: any = {
                        COURS_MAGISTRAL: "CM",
                        TD: "TD",
                        TP: "TP",
                      };
                      const color = typeColors[seance.typeSeance] || "#556987";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            background: "#0d1117",
                            borderRadius: 6,
                            padding: "0.7rem 1rem",
                            border: `1px solid ${color}22`,
                          }}
                        >
                          <span
                            style={{
                              background: `${color}22`,
                              color,
                              border: `1px solid ${color}`,
                              padding: "1px 8px",
                              borderRadius: 4,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              marginTop: 2,
                            }}
                          >
                            {typeLabels[seance.typeSeance] || seance.typeSeance}
                            {seance.ordre}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                color: "#e5eaf3",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              {seance.title}
                            </div>
                            {seance.objectifs && (
                              <div
                                style={{
                                  color: "#556987",
                                  fontSize: "0.78rem",
                                  marginTop: 2,
                                }}
                              >
                                {seance.objectifs}
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              color: "#556987",
                              fontSize: "0.75rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {seance.duree ? seance.duree / 60 + "h" : "2h"}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </SyllabusSectionBlock>

              {/* Évaluation */}
              {generatedTemplate.evaluation && (
                <SyllabusSectionBlock title="Évaluation" icon="fa-chart-pie">
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 6,
                      overflow: "hidden",
                      height: 32,
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        width: `${generatedTemplate.evaluation.continu || 40}%`,
                        background: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      CC {generatedTemplate.evaluation.continu || 40}%
                    </div>
                    <div
                      style={{
                        width: `${generatedTemplate.evaluation.examen || 60}%`,
                        background: "#9fef00",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1a2332",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      Examen {generatedTemplate.evaluation.examen || 60}%
                    </div>
                  </div>
                  {generatedTemplate.evaluation.description && (
                    <p
                      style={{
                        color: "#9ca3af",
                        fontSize: "0.85rem",
                        margin: 0,
                      }}
                    >
                      {generatedTemplate.evaluation.description}
                    </p>
                  )}
                </SyllabusSectionBlock>
              )}

              {/* Bibliographie */}
              {generatedTemplate.bibliography?.length > 0 && (
                <SyllabusSectionBlock title="Bibliographie" icon="fa-book-open">
                  <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                    {generatedTemplate.bibliography.map(
                      (b: string, i: number) => (
                        <li
                          key={i}
                          style={{
                            color: "#9ca3af",
                            fontSize: "0.85rem",
                            marginBottom: "0.4rem",
                          }}
                        >
                          {b}
                        </li>
                      ),
                    )}
                  </ul>
                </SyllabusSectionBlock>
              )}

              {/* Outils */}
              {generatedTemplate.tools?.length > 0 && (
                <SyllabusSectionBlock
                  title="Outils & Technologies"
                  icon="fa-tools"
                >
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {generatedTemplate.tools.map((tool: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          background: "#111927",
                          border: "1px solid #2a3f5f",
                          padding: "3px 12px",
                          borderRadius: 20,
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                        }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </SyllabusSectionBlock>
              )}
            </div>

            {/* Footer avec boutons */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "1rem 2rem",
                borderTop: "1px solid #2a3f5f",
                background: "#111927",
                flexShrink: 0,
              }}
            >
              <button
                style={{
                  ...S.outlineBtn,
                  flex: 1,
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setShowTemplateModal(false)}
              >
                Fermer
              </button>
              <button
                style={{
                  ...S.outlineBtn,
                  flex: 1,
                  justifyContent: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#2cb5e8",
                  borderColor: "#2cb5e8",
                }}
                onClick={() => downloadSyllabus(generatedTemplate)}
              >
                <i className="fas fa-download"></i> Télécharger Syllabus
              </button>
              <button
                style={{
                  ...S.primaryBtn,
                  flex: 2,
                  justifyContent: "center",
                  background: importingTemplate ? "#556987" : "#a855f7",
                  color: "#fff",
                  opacity: importingTemplate ? 0.7 : 1,
                }}
                disabled={importingTemplate}
                onClick={handleImportTemplate}
              >
                {importingTemplate ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Import...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-import"></i> Importer{" "}
                    {generatedTemplate.seances?.length || 0} séances
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const S: any = {
  header: { background: "#1a2332", padding: "1.5rem 0" },
  headerInner: { maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem" },
  backBtn: {
    color: "#556987",
    textDecoration: "none",
    fontSize: "0.9rem",
    display: "inline-block",
    marginBottom: "1rem",
  },
  headerGreet: {
    color: "#556987",
    fontSize: ".875rem",
    margin: "0 0 .25rem",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#e5eaf3",
    fontSize: "1.8rem",
    fontWeight: 800,
    margin: 0,
  },
  green: { color: "#9fef00" },
  content: { padding: "2rem 1.5rem", maxWidth: 1100, margin: "0 auto" },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  sectionTitle: { color: "#e5eaf3", fontSize: "1.2rem", margin: 0 },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "1rem 0",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  card: {
    background: "#1a2332",
    border: "1px solid #2a3f5f",
    borderRadius: 8,
    overflow: "hidden",
  },
  cardBody: { padding: "1.25rem" },
  cardTitle: { color: "#e5eaf3", fontSize: "1.1rem", margin: "0 0 0.5rem" },
  emptyState: {
    padding: "4rem 2rem",
    textAlign: "center",
    color: "#556987",
    background: "#1a2332",
    borderRadius: 8,
    border: "1px dashed #2a3f5f",
    fontSize: "1.1rem",
  },
  primaryBtn: {
    background: "#9fef00",
    color: "#111927",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: 4,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  outlineBtn: {
    background: "transparent",
    color: "#556987",
    border: "1px solid #556987",
    padding: "0.5rem 1rem",
    borderRadius: 4,
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerBtn: {
    background: "#ff3e3e11",
    color: "#ff3e3e",
    border: "1px solid #ff3e3e",
    padding: "0.4rem 0.8rem",
    borderRadius: 4,
    cursor: "pointer",
  },
  formGroup: { marginBottom: "1rem" },
  label: {
    display: "block",
    color: "#e5eaf3",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
  },
  input: {
    width: "100%",
    background: "#111927",
    border: "1px solid #2a3f5f",
    color: "#e5eaf3",
    padding: "0.5rem 0.75rem",
    borderRadius: 4,
    outline: "none",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 1050,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "#1a2332",
    padding: "2rem",
    borderRadius: 8,
    width: "100%",
    maxWidth: 500,
    border: "1px solid #2a3f5f",
  },
  statusSelect: (status: string) => {
    let color = "#556987";
    if (status === "IN_PROGRESS") color = "#2cb5e8";
    if (status === "COMPLETED") color = "#9fef00";
    return {
      background: `${color}11`,
      color,
      border: `1px solid ${color}`,
      padding: "0.3rem 0.5rem",
      borderRadius: 4,
      outline: "none",
      fontSize: "0.8rem",
      fontWeight: 600,
    };
  },
};

export default LecturerModuleDetail;
