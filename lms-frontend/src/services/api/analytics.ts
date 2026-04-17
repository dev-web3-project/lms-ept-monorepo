import { notifyError } from "../../components/notify";
import api from "./api";

// ── Profil Adaptatif ───────────────────────────────────────

export const getProfilAdaptatif = async (username: string) => {
  try {
    const response = await api.get(
      `/user/analytics/student/${username}/profil-adaptatif`,
    );
    return response.data;
  } catch (error: any) {
    // 404 = profil non encore créé, pas d'erreur affichée
    return null;
  }
};

export const updateProfilAdaptatif = async (
  username: string,
  data: {
    classeMoyenne?: number;
    niveauGlobal?: string;
    competences?: Record<string, string>;
  },
) => {
  try {
    const response = await api.post(
      `/user/analytics/student/${username}/profil-adaptatif`,
      data,
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

// ── Recommandations ────────────────────────────────────────

export const getRecommandations = async (username: string) => {
  try {
    const response = await api.get(
      `/user/analytics/student/${username}/recommandations`,
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
    return [];
  }
};

export const createRecommandation = async (
  username: string,
  data: {
    typeReco: string;
    cibleId: string;
    raison?: string;
  },
) => {
  try {
    const response = await api.post(
      `/user/analytics/student/${username}/recommandations`,
      data,
    );
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const markRecommandationAsVue = async (id: number) => {
  try {
    const response = await api.put(`/user/analytics/recommandation/${id}/view`);
    return response.data;
  } catch (error: any) {
    return null;
  }
};

// ── Lacunes (course-service) ───────────────────────────────

export const getLacunesEtudiant = async (username: string) => {
  try {
    const response = await api.get(`/course/lacune/student/${username}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    return [];
  }
};
