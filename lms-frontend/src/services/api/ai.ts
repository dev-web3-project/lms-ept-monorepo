import api from "./api";

export const askAi = async (
  prompt: string,
  moduleId?: number,
  context?: string,
) => {
  try {
    const response = await api.post("/ai/chatbot/ask", {
      prompt,
      moduleId,
      context,
    });
    return response.data;
  } catch (error) {
    console.error("Error asking AI:", error);
    throw error;
  }
};

export const generateQuizAi = async (moduleId: number, context?: string) => {
  try {
    const response = await api.post("/ai/chatbot/generate-quiz", {
      prompt: "generate quiz",
      moduleId,
      context,
    });
    // Parse if string
    if (typeof response.data === "string") {
      return JSON.parse(response.data);
    }
    return response.data;
  } catch (error) {
    console.error("Error generating quiz with AI:", error);
    throw error;
  }
};

/** Extrait proprement le JSON d'une réponse potentiellement enveloppée dans du markdown */
const extractJson = (raw: string): any => {
  if (!raw || !raw.trim()) throw new Error("Réponse vide du serveur IA.");
  const trimmed = raw.trim();
  // Détecter tous les messages d'erreur connus du serveur
  const errorPrefixes = [
    "Clé API",
    "Erreur",
    "❌",
    "⚠️",
    "Ollama :",
    "Aucun fournisseur",
  ];
  if (errorPrefixes.some((p) => trimmed.startsWith(p))) {
    throw new Error(trimmed);
  }
  // Extraire le JSON entre { et } (gère les markdown code fences)
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  // Essayer de parser directement
  return JSON.parse(trimmed);
};

export const generateRemediation = async (payload: {
  studentId: string;
  moduleId: number;
  quizResultId?: number;
  quizTitle?: string;
  wrongQuestions: Array<{
    questionText: string;
    competence?: string;
    justification?: string;
    correctAnswer?: string;
  }>;
}) => {
  try {
    const response = await api.post("/ai/remediation/generate", payload);
    const data = response.data;
    if (typeof data === "object" && data !== null) return data;
    return JSON.parse(String(data));
  } catch (error: any) {
    const serverMsg = error?.response?.data;
    if (serverMsg && typeof serverMsg === "string") throw new Error(serverMsg);
    console.error("Error generating remediation:", error);
    throw error;
  }
};

export const generateCourseTemplate = async (
  moduleId: number,
  context?: string,
) => {
  try {
    const response = await api.post("/ai/chatbot/generate-template", {
      prompt: "generate course template",
      moduleId,
      context,
    });
    const data = response.data;
    // Réponse déjà parsée en objet par Axios
    if (typeof data === "object" && data !== null) {
      // Détecter un objet d'erreur Ollama/IA retourné à tort comme 200
      if ("error" in data) {
        throw new Error(
          `Modèle IA non disponible : ${
            (data as any).error?.message ||
            "Erreur inconnue. Lancez 'ollama pull llama3.2' ou vérifiez GROQ_API_KEY"
          }`,
        );
      }
      // Vérifier que c'est bien un syllabus
      if (!("seances" in data) && !("moduleInfo" in data)) {
        throw new Error(
          "Réponse IA invalide : structure de syllabus attendue.",
        );
      }
      return data;
    }
    return extractJson(String(data));
  } catch (error: any) {
    // Erreur HTTP (ex: 503 retourné par le backend)
    const serverMsg = error?.response?.data;
    if (serverMsg && typeof serverMsg === "string") {
      throw new Error(serverMsg);
    }
    console.error("Error generating course template with AI:", error);
    throw error;
  }
};
