import { notifyError, notifySuccess } from "../../components/notify";
import api from "./api";

export const getAllAnnouncements = async () => {
  try {
    const response = await api.get("/announcement/all");
    return response.data;
  } catch (error: any) {
    notifyError(error);
  }
};

export const createAssignment = async (data: any) => {
  try {
    const response = await api.post("/announcement/assignment", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createExam = async (data: any) => {
  try {
    const response = await api.post("/announcement/exam", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createEvent = async (data: any) => {
  try {
    const response = await api.post("/announcement/event", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const createMaintenance = async (data: any) => {
  try {
    const response = await api.post("/announcement/maintenance", data);
    notifySuccess("Announcement created successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

export const updateAssignment = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/assignment/${id}`, data);
    notifySuccess("Assignment updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const updateExam = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/exam/${id}`, data);
    notifySuccess("Exam updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const updateEvent = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/event/${id}`, data);
    notifySuccess("Event updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const updateMaintenance = async (id: string | number, data: any) => {
  try {
    const response = await api.put(`/announcement/maintenance/${id}`, data);
    notifySuccess("Maintenance updated successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const deleteAnnouncement = async (id: string) => {
  try {
    const response = await api.delete(`/announcement/${id}`);
    notifySuccess("Announcement deleted successfully");
    return response;
  } catch (error: any) {
    notifyError(error.response.data);
  }
};

// ── Filtrage par type ───────────────────────────────────────

export const listByType = async (type: string) => {
  try {
    const response = await api.get(`/announcement/type/${type}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listAssignments = async () => listByType("assignment");
export const listExams = async () => listByType("exam");
export const listEvents = async () => listByType("event");
export const listMaintenances = async () => listByType("maintenance");

// ── Filtrage par audience ───────────────────────────────────

/** ALL | STUDENTS | LECTURERS | COURSE | CLASS */
export const listByAudience = async (audience: string) => {
  try {
    const response = await api.get(`/announcement/audience/${audience}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listByCourse = async (courseCode: string) => {
  try {
    const response = await api.get(`/announcement/course/${courseCode}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

export const listByClass = async (classId: string) => {
  try {
    const response = await api.get(`/announcement/class/${classId}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

/**
 * Toutes les annonces visibles par un étudiant :
 * ALL + STUDENTS + son cours + sa classe.
 */
export const listForStudent = async (courseCode: string, classId: string) => {
  try {
    const params = new URLSearchParams();
    if (courseCode) params.append("courseCode", courseCode);
    if (classId) params.append("classId", classId);
    const response = await api.get(`/announcement/for/student?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

/** Toutes les annonces visibles par les enseignants : ALL + LECTURERS */
export const listForLecturer = async () => {
  try {
    const response = await api.get("/announcement/for/lecturer");
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message);
  }
};

// ── Notifications ──────────────────────────────────────────

export const getUserNotifications = async (userId: string) => {
  try {
    const response = await api.get(`/announcement/notifications/user/${userId}`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const getUnreadNotifications = async (userId: string) => {
  try {
    const response = await api.get(`/announcement/notifications/user/${userId}/unread`);
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const sendNotification = async (data: {
  userId: string;
  title: string;
  content: string;
  type?: string;
}) => {
  try {
    const response = await api.post(`/announcement/notifications/send`, data);
    notifySuccess("Notification envoyée");
    return response.data;
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const markNotificationAsRead = async (id: number) => {
  try {
    await api.put(`/announcement/notifications/${id}/read`);
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    await api.put(`/announcement/notifications/user/${userId}/read-all`);
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};

export const deleteNotification = async (id: number) => {
  try {
    await api.delete(`/announcement/notifications/${id}`);
  } catch (error: any) {
    notifyError(error.response?.data || error.message || "Erreur inconnue");
  }
};
