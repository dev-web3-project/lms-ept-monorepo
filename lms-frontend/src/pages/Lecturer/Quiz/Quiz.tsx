import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getQuizzesByModuleId,
  getModuleById,
  createQuiz,
  deleteQuiz,
  updateQuiz,
  getQuizById,
} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";

const LecturerQuiz = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const emptyQuestion = () => ({
    text: "",
    hint: "",
    justification: "",
    orderIndex: 1,
    points: 5,
    type: "SINGLE_CHOICE",
    competence: "",
    options: [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  });

  const emptyQuiz = () => ({
    title: "",
    description: "",
    typeQuiz: "QCM",
    timeLimit: 30,
    timeLimitPerQuestion: false,
    documentMode: "NO_DOCS",
    cameraSurveillanceEnabled: false,
    randomizeQuestions: false,
    randomizeAnswers: true,
    maxAttempts: 3,
    publishDate: new Date().toISOString().slice(0, 16),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    isDraft: false,
    passingScore: 10.0,
    moduleId: id,
    questions: [emptyQuestion()],
  });

  const [newQuiz, setNewQuiz] = useState<any>(emptyQuiz());
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        const moduleData = await getModuleById(id);
        setModule(moduleData);
        const quizzesData = await getQuizzesByModuleId(id);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Auto-load quiz into edit form if navigated with state.editQuizId
  useEffect(() => {
    const state = location.state as {
      editQuizId?: string;
      aiGeneratedQuiz?: any;
    } | null;
    if (state?.editQuizId) {
      handleEditQuiz(state.editQuizId);
      window.history.replaceState({}, document.title);
    }
    // Pre-fill form with AI-generated quiz
    if (state?.aiGeneratedQuiz) {
      const ai = state.aiGeneratedQuiz;
      setNewQuiz({
        title: ai.title || `Quiz IA - ${module?.name || ""}`,
        description:
          ai.description || "Quiz généré par Intelligence Artificielle",
        typeQuiz: "QCM",
        timeLimit: ai.timeLimit ?? 30,
        timeLimitPerQuestion: false,
        documentMode: "NO_DOCS",
        cameraSurveillanceEnabled: false,
        randomizeQuestions: ai.randomizeQuestions ?? false,
        randomizeAnswers: ai.randomizeAnswers ?? true,
        maxAttempts: 3,
        publishDate: new Date().toISOString().slice(0, 16),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
        isDraft: true,
        passingScore: ai.passingScore ?? 10.0,
        moduleId: id,
        questions:
          ai.questions && ai.questions.length > 0
            ? ai.questions.map((q: any, i: number) => ({
                text: q.text || "",
                hint: q.hint || "",
                justification: q.justification || "",
                orderIndex: i + 1,
                points: q.points ?? 2,
                type: q.type || "SINGLE_CHOICE",
                competence: q.competence || "",
                options: (q.options || []).map((o: any) => ({
                  text: o.text || "",
                  correct: !!o.correct,
                })),
              }))
            : [emptyQuestion()],
      });
      setEditingQuizId(null);
      window.history.replaceState({}, document.title);
      // Scroll to form
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleAddQuestion = () => {
    setNewQuiz({
      ...newQuiz,
      questions: [
        ...newQuiz.questions,
        { ...emptyQuestion(), orderIndex: newQuiz.questions.length + 1 },
      ],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (newQuiz.questions.length > 1) {
      setNewQuiz({
        ...newQuiz,
        questions: newQuiz.questions.filter((_: any, i: number) => i !== index),
      });
    }
  };

  const handleAddOption = (qIndex: number) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[qIndex].options.push({ text: "", correct: false });
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const updatedQuestions = [...newQuiz.questions];
    if (updatedQuestions[qIndex].options.length > 2) {
      updatedQuestions[qIndex].options = updatedQuestions[
        qIndex
      ].options.filter((_: any, i: number) => i !== oIndex);
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
    }
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    field: string,
    value: any,
  ) => {
    const updatedQuestions = [...newQuiz.questions];
    updatedQuestions[qIndex].options[oIndex] = {
      ...updatedQuestions[qIndex].options[oIndex],
      [field]: value,
    };
    setNewQuiz({ ...newQuiz, questions: updatedQuestions });
  };

  const handleCreateQuiz = async (e: any) => {
    e.preventDefault();
    // Re-index questions to ensure orderIndex is consistent
    const payload = {
      ...newQuiz,
      questions: newQuiz.questions.map((q: any, i: number) => ({
        ...q,
        orderIndex: i + 1,
      })),
    };
    try {
      if (editingQuizId) {
        await updateQuiz(editingQuizId, payload);
      } else {
        await createQuiz(payload);
      }
      setNewQuiz(emptyQuiz());
      setEditingQuizId(null);
      fetchData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  const handleEditQuiz = async (quizId: string) => {
    try {
      const data = await getQuizById(quizId);
      setEditingQuizId(quizId);
      setNewQuiz({
        title: data.title || "",
        description: data.description || "",
        typeQuiz: data.typeQuiz || "QCM",
        timeLimit: data.timeLimit ?? 30,
        timeLimitPerQuestion: data.timeLimitPerQuestion ?? false,
        documentMode: data.documentMode || "NO_DOCS",
        cameraSurveillanceEnabled: data.cameraSurveillanceEnabled ?? false,
        randomizeQuestions: data.randomizeQuestions ?? false,
        randomizeAnswers: data.randomizeAnswers ?? true,
        maxAttempts: data.maxAttempts ?? 3,
        publishDate: data.publishDate
          ? data.publishDate.slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        dueDate: data.dueDate
          ? data.dueDate.slice(0, 16)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 16),
        isDraft: data.isDraft ?? false,
        passingScore: data.passingScore ?? 10.0,
        moduleId: id,
        questions:
          data.questions && data.questions.length > 0
            ? data.questions.map((q: any, i: number) => ({
                text: q.text || "",
                hint: q.hint || "",
                justification: q.justification || "",
                orderIndex: q.orderIndex ?? i + 1,
                points: q.points ?? 5,
                type: q.type || "SINGLE_CHOICE",
                competence: q.competence || "",
                options: (q.options || []).map((o: any) => ({
                  text: o.text || "",
                  correct: !!o.correct,
                })),
              }))
            : [emptyQuestion()],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error loading quiz for edit:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuizId(null);
    setNewQuiz(emptyQuiz());
  };

  const handleDelete = async (quizId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce quiz ?")) {
      try {
        await deleteQuiz(quizId);
        fetchData();
      } catch (error) {
        console.error("Error deleting quiz:", error);
      }
    }
  };

  if (loading && !module) return <PageLoading />;

  return (
    <>
      <div className="content-header">
        <div className="container">
          <div className="row mb-2">
            <div className="col-sm-6 d-flex align-items-center">
              <button
                onClick={() => navigate(`/lecturer/${id}`)}
                className="btn btn-tool mr-2"
                style={{ fontSize: "1.2rem", color: "#6c757d" }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className="m-0">
                Gérer les quiz : {module?.name || module?.title}
              </h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item">
                  <Link to={"/lecturer"}>Accueil</Link>
                </li>
                <li className="breadcrumb-item active">Quiz</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="card card-primary">
                <div className="card-header">
                  <h3 className="card-title">
                    {editingQuizId
                      ? "Modifier le quiz"
                      : "Créer un nouveau quiz"}
                  </h3>
                </div>
                <form onSubmit={handleCreateQuiz}>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Titre du quiz</label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={newQuiz.title}
                            onChange={(e) =>
                              setNewQuiz({ ...newQuiz, title: e.target.value })
                            }
                            placeholder="Entrez le titre"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Note de réussite (/20)</label>
                          <input
                            type="number"
                            className="form-control"
                            required
                            min="0"
                            max="20"
                            step="0.5"
                            value={newQuiz.passingScore}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                passingScore: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={newQuiz.description}
                        onChange={(e) =>
                          setNewQuiz({
                            ...newQuiz,
                            description: e.target.value,
                          })
                        }
                        placeholder="Entrez la description"
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Durée (min)</label>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            value={newQuiz.timeLimit}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                timeLimit: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <div className="custom-control custom-checkbox mt-4">
                            <input
                              className="custom-control-input"
                              type="checkbox"
                              id="limitAttempts"
                              checked={newQuiz.maxAttempts !== null}
                              onChange={(e) =>
                                setNewQuiz({
                                  ...newQuiz,
                                  maxAttempts: e.target.checked ? 1 : null,
                                })
                              }
                            />
                            <label
                              htmlFor="limitAttempts"
                              className="custom-control-label"
                            >
                              Limiter les tentatives
                            </label>
                          </div>
                        </div>
                      </div>
                      {newQuiz.maxAttempts !== null && (
                        <div className="col-md-3">
                          <div className="form-group">
                            <label>Nombre de tentatives max</label>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              value={newQuiz.maxAttempts}
                              onChange={(e) =>
                                setNewQuiz({
                                  ...newQuiz,
                                  maxAttempts: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Date de publication</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={newQuiz.publishDate}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                publishDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Date limite</label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={newQuiz.dueDate}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                dueDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Type de quiz</label>
                          <select
                            className="form-control"
                            value={newQuiz.typeQuiz}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                typeQuiz: e.target.value,
                              })
                            }
                          >
                            <option value="QCM">QCM</option>
                            <option value="VRAI_FAUX">Vrai / Faux</option>
                            <option value="MIXTE">Mixte</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Mode documents</label>
                          <select
                            className="form-control"
                            value={newQuiz.documentMode}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                documentMode: e.target.value,
                              })
                            }
                          >
                            <option value="NO_DOCS">Pas de documents</option>
                            <option value="PARTIAL">Partiel</option>
                            <option value="FULL">Total</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-check mt-4">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={newQuiz.randomizeQuestions}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                randomizeQuestions: e.target.checked,
                              })
                            }
                          />
                          <label className="form-check-label">
                            Randomiser les questions
                          </label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-check mt-4">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={newQuiz.randomizeAnswers}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                randomizeAnswers: e.target.checked,
                              })
                            }
                          />
                          <label className="form-check-label">
                            Randomiser les réponses
                          </label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-check mt-4">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={newQuiz.cameraSurveillanceEnabled}
                            onChange={(e) =>
                              setNewQuiz({
                                ...newQuiz,
                                cameraSurveillanceEnabled: e.target.checked,
                              })
                            }
                          />
                          <label className="form-check-label">
                            Surveillance caméra
                          </label>
                        </div>
                      </div>
                    </div>

                    <hr />
                    <h4>Questions</h4>
                    {newQuiz.questions.map((question: any, qIndex: number) => (
                      <div
                        key={qIndex}
                        className="card card-outline card-info mb-3"
                      >
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">
                            Question {qIndex + 1}
                          </h5>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveQuestion(qIndex)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-8">
                              <div className="form-group">
                                <label>Texte de la question</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  required
                                  value={question.text}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      qIndex,
                                      "text",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="form-group">
                                <label>Type</label>
                                <select
                                  className="form-control"
                                  value={question.type}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      qIndex,
                                      "type",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="SINGLE_CHOICE">
                                    Choix unique
                                  </option>
                                  <option value="MULTIPLE_CHOICE">
                                    Choix multiple
                                  </option>
                                  <option value="TRUE_FALSE">Vrai/Faux</option>
                                  <option value="SHORT_ANSWER">
                                    Réponse courte
                                  </option>
                                  <option value="ESSAY">Dissertation</option>
                                </select>
                              </div>
                            </div>
                            <div className="col-md-2">
                              <div className="form-group">
                                <label>Points</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  min="1"
                                  value={question.points}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      qIndex,
                                      "points",
                                      parseInt(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Indice (optionnel)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.hint}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "hint",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Justification (optionnel)</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={(question as any).justification}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "justification",
                                  e.target.value,
                                )
                              }
                              placeholder="Explication de la bonne réponse"
                            ></textarea>
                          </div>
                          <div className="form-group">
                            <label>
                              <i className="fas fa-tag text-warning mr-1"></i>
                              Compétence ciblée
                              <small className="text-muted ml-1">
                                (pour l'apprentissage adaptatif)
                              </small>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              list={`competences-${qIndex}`}
                              value={question.competence || ""}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "competence",
                                  e.target.value,
                                )
                              }
                              placeholder="ex: SQL, Algorithmique, Réseaux..."
                            />
                            <datalist id={`competences-${qIndex}`}>
                              <option value="Algorithmique" />
                              <option value="Programmation" />
                              <option value="Base de données" />
                              <option value="SQL" />
                              <option value="Réseaux" />
                              <option value="Systèmes" />
                              <option value="Mathématiques" />
                              <option value="Architecture" />
                              <option value="Sécurité" />
                              <option value="Développement Web" />
                              <option value="Systèmes embarqués" />
                              <option value="Intelligence Artificielle" />
                            </datalist>
                            <small className="text-muted">
                              Si rempli, les erreurs sur cette question créent
                              automatiquement une lacune dans le profil
                              étudiant.
                            </small>
                          </div>

                          {(question.type === "SINGLE_CHOICE" ||
                            question.type === "MULTIPLE_CHOICE" ||
                            question.type === "TRUE_FALSE") && (
                            <div>
                              <label>Options de réponse</label>
                              {question.options.map(
                                (option: any, oIndex: number) => (
                                  <div
                                    key={oIndex}
                                    className="input-group mb-2"
                                  >
                                    <div className="input-group-prepend">
                                      <div className="input-group-text">
                                        <input
                                          type="checkbox"
                                          checked={option.correct}
                                          onChange={(e) =>
                                            handleOptionChange(
                                              qIndex,
                                              oIndex,
                                              "correct",
                                              e.target.checked,
                                            )
                                          }
                                        />
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      className="form-control"
                                      required
                                      value={option.text}
                                      onChange={(e) =>
                                        handleOptionChange(
                                          qIndex,
                                          oIndex,
                                          "text",
                                          e.target.value,
                                        )
                                      }
                                      placeholder={`Option ${oIndex + 1}`}
                                    />
                                    <div className="input-group-append">
                                      <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() =>
                                          handleRemoveOption(qIndex, oIndex)
                                        }
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                ),
                              )}
                              {question.type !== "TRUE_FALSE" && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleAddOption(qIndex)}
                                >
                                  <i className="fas fa-plus"></i> Ajouter une
                                  option
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-primary mb-3"
                      onClick={handleAddQuestion}
                    >
                      <i className="fas fa-plus"></i> Ajouter une question
                    </button>
                  </div>
                  <div className="card-footer">
                    <button type="submit" className="btn btn-primary">
                      {editingQuizId
                        ? "Enregistrer les modifications"
                        : "Créer le quiz"}
                    </button>
                    {editingQuizId && (
                      <button
                        type="button"
                        className="btn btn-secondary ml-2"
                        onClick={handleCancelEdit}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="card card-outline card-primary">
                <div className="card-header">
                  <h3 className="card-title">Quiz existants</h3>
                </div>
                <div className="card-body p-0">
                  {quizzes.length === 0 ? (
                    <div className="p-5 text-center text-muted">
                      <p>Aucun quiz n'a été créé pour ce module.</p>
                    </div>
                  ) : (
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Titre</th>
                          <th>Description</th>
                          <th>Questions</th>
                          <th>Durée</th>
                          <th>Tentatives</th>
                          <th>Note de réussite</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizzes.map((quiz: any) => (
                          <tr key={quiz.id}>
                            <td>
                              <strong>{quiz.title}</strong>
                            </td>
                            <td>{quiz.description}</td>
                            <td>
                              <span className="badge badge-info">
                                {quiz.questionCount ?? 0}
                              </span>
                            </td>
                            <td>{quiz.timeLimit} min</td>
                            <td>
                              {quiz.maxAttempts ? (
                                quiz.maxAttempts
                              ) : (
                                <span className="badge badge-secondary">
                                  Illimité
                                </span>
                              )}
                            </td>
                            <td>{quiz.passingScore}/20</td>
                            <td className="text-right">
                              <button
                                onClick={() => handleEditQuiz(quiz.id)}
                                className="btn btn-sm btn-info mr-1"
                                title="Modifier / Ajouter des questions"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(quiz.id)}
                                className="btn btn-sm btn-danger"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LecturerQuiz;
