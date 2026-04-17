import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  getQuizzesByModuleId,
  getModuleById,
  getQuizById,
  submitQuiz,
  getQuizResultsByStudentId,
} from "../../../services/api/course";
import PageLoading from "../../../components/Admin/PageLoading";
import { useAuth } from "../../../services/AuthContext";
import { generateRemediation } from "../../../services/api/ai";

const StudentQuiz = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [mouseExitCount, setMouseExitCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [resultDetail, setResultDetail] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationData, setRemediationData] = useState<any>(null);
  const [showRemediation, setShowRemediation] = useState(false);
  const quizContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        const moduleData =
          id && id !== "modules" ? await getModuleById(id) : null;
        setModule(moduleData);
        const quizzesData = await getQuizzesByModuleId(id);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);

        if (user?.username) {
          const results = await getQuizResultsByStudentId(user.username);
          setStudentResults(Array.isArray(results) ? results : []);
        }
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

  // Auto-start quiz if quizId was passed via state
  useEffect(() => {
    const state = location.state as { quizId?: string };
    if (state?.quizId && quizzes.length > 0 && !activeQuiz) {
      startQuiz(state.quizId);
    }
  }, [location.state, quizzes, activeQuiz]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        activeQuiz &&
        activeQuiz.documentMode === "NO_DOCS"
      ) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeQuiz]);

  useEffect(() => {
    if (
      mouseExitCount >= 3 &&
      activeQuiz &&
      activeQuiz.documentMode === "NO_DOCS"
    ) {
      handleSubmitQuiz(true);
    }
  }, [mouseExitCount, activeQuiz]);

  const handleMouseLeave = () => {
    // Disabled - too aggressive, triggers on normal mouse movements
    // if (activeQuiz && activeQuiz.documentMode === 'NO_DOCS') {
    //     setMouseExitCount(prev => prev + 1);
    // }
  };

  const startQuiz = async (quizId: string) => {
    try {
      const quizData = await getQuizById(quizId);
      if (
        !quizData ||
        !Array.isArray(quizData.questions) ||
        quizData.questions.length === 0
      ) {
        alert("Ce quiz n'a pas de questions ou n'a pas pu être chargé.");
        return;
      }
      let questions = [...quizData.questions];

      if (quizData.randomizeQuestions) {
        questions.sort(() => Math.random() - 0.5);
      }

      if (quizData.randomizeAnswers) {
        questions = questions.map((q) => ({
          ...q,
          options: Array.isArray(q.options)
            ? [...q.options].sort(() => Math.random() - 0.5)
            : [],
        }));
      }

      setActiveQuiz({ ...quizData, questions });
      setCurrentQuestionIndex(0);
      setAnswers(
        questions.map(() => ({
          questionId: null,
          selectedOptionId: null,
          selectedOptionIds: [],
          textAnswer: "",
        })),
      );
      setStartTime(new Date());
      setMouseExitCount(0);
      setTabSwitchCount(0);
      setAutoSubmitted(false);
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("Erreur lors du chargement du quiz.");
    }
  };

  const selectAnswer = (optionId: number, isMultiple = false) => {
    const updatedAnswers = [...answers];
    // Ensure the answers array has the correct length
    if (updatedAnswers.length <= currentQuestionIndex) {
      while (updatedAnswers.length <= currentQuestionIndex) {
        updatedAnswers.push({
          questionId: null,
          selectedOptionId: null,
          selectedOptionIds: [],
          textAnswer: "",
        });
      }
    }

    if (isMultiple) {
      // Handle multiple choice - toggle option in array
      const currentSelected =
        updatedAnswers[currentQuestionIndex].selectedOptionIds || [];
      const newSelected = currentSelected.includes(optionId)
        ? currentSelected.filter((id: number) => id !== optionId)
        : [...currentSelected, optionId];
      updatedAnswers[currentQuestionIndex] = {
        ...updatedAnswers[currentQuestionIndex],
        questionId: activeQuiz.questions[currentQuestionIndex].id,
        selectedOptionIds: newSelected,
      };
    } else {
      // Handle single choice
      updatedAnswers[currentQuestionIndex] = {
        ...updatedAnswers[currentQuestionIndex],
        questionId: activeQuiz.questions[currentQuestionIndex].id,
        selectedOptionId: optionId,
      };
    }
    setAnswers(updatedAnswers);
  };

  const handleTextAnswer = (text: string) => {
    const updatedAnswers = [...answers];
    // Ensure the answers array has the correct length
    if (updatedAnswers.length <= currentQuestionIndex) {
      while (updatedAnswers.length <= currentQuestionIndex) {
        updatedAnswers.push({
          questionId: null,
          selectedOptionId: null,
          textAnswer: "",
        });
      }
    }
    updatedAnswers[currentQuestionIndex] = {
      ...updatedAnswers[currentQuestionIndex],
      questionId: activeQuiz.questions[currentQuestionIndex].id,
      textAnswer: text,
    };
    setAnswers(updatedAnswers);
  };

  const nextQuestion = () => {
    if (
      activeQuiz?.questions &&
      currentQuestionIndex < activeQuiz.questions.length - 1
    ) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async (auto = false) => {
    if (!user || !activeQuiz) return;

    if (
      !auto &&
      !window.confirm("Êtes-vous sûr de vouloir soumettre le quiz ?")
    ) {
      return;
    }

    try {
      // Convert answers to the format expected by the backend
      const formattedAnswers = answers
        .filter((a) => a.questionId !== null)
        .map((a) => {
          const answer: any = {
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            textAnswer: a.textAnswer,
          };
          // For multiple choice, include all selected option IDs
          if (a.selectedOptionIds && a.selectedOptionIds.length > 0) {
            answer.selectedOptionIds = a.selectedOptionIds;
          }
          return answer;
        });

      const submissionData = {
        quizId: activeQuiz.id,
        studentId: user.username,
        answers: formattedAnswers,
        integrityReport: {
          mouseExitCount,
          tabSwitchCount,
          autoSubmitted: auto,
          suspiciousVideoSegments: [],
          notes: "",
        },
      };

      console.log("Submitting quiz data:", submissionData);
      setIsSubmitting(true);
      const detail = await submitQuiz(submissionData);
      setIsSubmitting(false);

      if (detail) {
        console.log("Result detail received:", detail);
        setResultDetail(detail);
        setActiveQuiz(null);
      } else {
        console.error("Submission failed: No detail returned");
        alert(
          "La soumission a échoué. Veuillez vérifier votre connexion ou contacter un administrateur.",
        );
      }
    } catch (error: any) {
      setIsSubmitting(false);
      console.error("Error submitting quiz:", error);
      alert(
        "Erreur lors de la soumission : " +
          (error.message || "Erreur inconnue"),
      );
    }
  };

  const closeResult = () => {
    setResultDetail(null);
    fetchData();
  };

  const handleGetRemediation = async () => {
    if (!resultDetail || !user) return;
    setRemediationLoading(true);
    try {
      const wrongQuestions = (resultDetail.questions || [])
        .filter((q: any) => !q.isCorrect)
        .map((q: any) => ({
          questionText: q.questionText || q.text || "",
          competence: q.competence || "",
          justification: q.justification || "",
          correctAnswer: q.correctAnswerText || "",
        }));

      const moduleIdNum = id ? parseInt(id) : 0;
      const payload = {
        studentId: user.username,
        moduleId: moduleIdNum,
        quizResultId: resultDetail.resultId || resultDetail.id,
        quizTitle: resultDetail.quizTitle || "Quiz",
        wrongQuestions,
      };

      const data = await generateRemediation(payload);
      setRemediationData(data);
      setShowRemediation(true);
    } catch (err: any) {
      console.error("Remediation failed:", err);
      alert(
        "Impossible de générer le parcours : " +
          (err.message || "Erreur inconnue"),
      );
    } finally {
      setRemediationLoading(false);
    }
  };

  if (loading && !module) return <PageLoading />;

  // ─── Écran de résultat avec corrections ───────────────────────────────
  if (resultDetail) {
    const {
      score,
      scoreOnTwenty,
      passed,
      passingScore,
      attemptNumber,
      maxAttempts,
      questions = [],
    } = resultDetail;
    const correctCount = questions.filter((q: any) => q.isCorrect).length;
    return (
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10">
              {/* Score header */}
              <div
                className={`card ${passed ? "card-success" : "card-danger"} card-outline mb-4`}
              >
                <div className="card-body text-center py-5">
                  <i
                    className={`fas ${passed ? "fa-trophy text-success" : "fa-times-circle text-danger"} fa-4x mb-3`}
                  ></i>
                  <h2 className="mb-2">
                    {passed ? "Bravo ! Quiz réussi 🎉" : "Quiz non réussi"}
                  </h2>
                  <p className="text-muted mb-3">{resultDetail.quizTitle}</p>
                  <div className="row text-center mb-3">
                    <div className="col-md-3">
                      <h3 className={passed ? "text-success" : "text-danger"}>
                        {scoreOnTwenty != null ? `${scoreOnTwenty}/20` : "-"}
                      </h3>
                      <small className="text-muted text-uppercase">Note</small>
                    </div>
                    <div className="col-md-3">
                      <h3>{score != null ? `${score.toFixed(1)}%` : "-"}</h3>
                      <small className="text-muted text-uppercase">
                        Pourcentage
                      </small>
                    </div>
                    <div className="col-md-3">
                      <h3>
                        {correctCount}/{questions.length}
                      </h3>
                      <small className="text-muted text-uppercase">
                        Bonnes réponses
                      </small>
                    </div>
                    <div className="col-md-3">
                      <h3>
                        {attemptNumber}
                        {maxAttempts ? `/${maxAttempts}` : ""}
                      </h3>
                      <small className="text-muted text-uppercase">
                        Tentative
                      </small>
                    </div>
                  </div>
                  {passingScore != null && (
                    <p className="text-muted small">
                      Note de passage : {passingScore}
                      {passingScore <= 20 ? "/20" : "%"}
                    </p>
                  )}

                  {maxAttempts != null && attemptNumber > maxAttempts && (
                    <div className="alert alert-warning mt-3 mb-0">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      <strong>Note :</strong> Cette tentative dépasse la limite
                      de {maxAttempts} et ne sera pas comptabilisée dans vos
                      statistiques officielles.
                    </div>
                  )}
                </div>
              </div>

              {/* Corrections */}
              <h4 className="mb-3">
                <i className="fas fa-list-ol mr-2"></i>Corrections détaillées
              </h4>
              {questions.map((q: any, idx: number) => (
                <div
                  key={q.questionId}
                  className={`card mb-3 ${q.isCorrect ? "border-success" : q.selectedOptionId || q.textAnswer ? "border-danger" : "border-warning"}`}
                >
                  <div
                    className="card-header"
                    style={{
                      background: q.isCorrect
                        ? "#d4edda"
                        : q.selectedOptionId || q.textAnswer
                          ? "#f8d7da"
                          : "#fff3cd",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>
                        <span className="mr-2">Question {idx + 1}.</span>
                        {q.text}
                      </strong>
                      <span>
                        {q.isCorrect && (
                          <span className="badge badge-success">
                            <i className="fas fa-check"></i> Correct (+
                            {q.points || 0} pts)
                          </span>
                        )}
                        {!q.isCorrect &&
                          (q.selectedOptionId || q.textAnswer) && (
                            <span className="badge badge-danger">
                              <i className="fas fa-times"></i> Incorrect
                            </span>
                          )}
                        {!q.selectedOptionId && !q.textAnswer && (
                          <span className="badge badge-warning">
                            Non répondu
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    {q.options && q.options.length > 0 && (
                      <div className="list-group mb-2">
                        {q.options.map((opt: any) => {
                          const isStudentChoice = q.selectedOptionId === opt.id;
                          let cls = "list-group-item";
                          let icon: any = null;
                          if (opt.correct) {
                            cls += " list-group-item-success";
                            icon = (
                              <i className="fas fa-check-circle text-success"></i>
                            );
                          } else if (isStudentChoice) {
                            cls += " list-group-item-danger";
                            icon = (
                              <i className="fas fa-times-circle text-danger"></i>
                            );
                          }
                          return (
                            <div key={opt.id} className={cls}>
                              <strong className="mr-2">{icon}</strong>
                              {opt.text}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.textAnswer && (
                      <div className="alert alert-secondary mt-2">
                        <strong>Votre réponse :</strong> {q.textAnswer}
                      </div>
                    )}
                    {q.justification && (
                      <div className="alert alert-info mb-0 mt-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Justification :</strong> {q.justification}
                      </div>
                    )}
                    {!q.justification && q.hint && (
                      <small className="text-muted">
                        <i className="fas fa-lightbulb"></i> Indice : {q.hint}
                      </small>
                    )}
                  </div>
                </div>
              ))}

              <div className="text-center my-4">
                <button className="btn btn-primary mr-2" onClick={closeResult}>
                  <i className="fas fa-arrow-left mr-1"></i> Retour aux quiz
                </button>
                <Link to={`/student/${id}`} className="btn btn-secondary">
                  <i className="fas fa-book mr-1"></i> Module
                </Link>
              </div>

              {/* Bouton Parcours de Rattrapage IA — affiché uniquement si quiz non réussi */}
              {!passed && (
                <div className="text-center mt-3">
                  <button
                    className="btn btn-warning btn-lg"
                    onClick={handleGetRemediation}
                    disabled={remediationLoading}
                    style={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      padding: "0.75rem 2rem",
                    }}
                  >
                    {remediationLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-brain mr-2"></i>
                        Obtenir mon Parcours de Rattrapage IA
                      </>
                    )}
                  </button>
                  <p className="text-muted small mt-2">
                    <i className="fas fa-magic mr-1"></i>
                    L'IA analyse tes erreurs et génère des explications
                    personnalisées
                  </p>
                </div>
              )}

              {/* Modal de remédiation IA */}
              {showRemediation && remediationData && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.8)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "16px",
                      maxWidth: "750px",
                      width: "100%",
                      maxHeight: "85vh",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        padding: "1.5rem 2rem",
                        color: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: 0, fontWeight: 800 }}>
                            <i className="fas fa-brain mr-2"></i>Parcours de
                            Rattrapage IA
                          </h3>
                          <p
                            style={{
                              margin: "0.25rem 0 0",
                              opacity: 0.9,
                              fontSize: "0.9rem",
                            }}
                          >
                            {remediationData.moduleName} —{" "}
                            {remediationData.quizTitle}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowRemediation(false)}
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            color: "#fff",
                            borderRadius: "50%",
                            width: 36,
                            height: 36,
                            cursor: "pointer",
                            fontSize: "1rem",
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>

                    {/* Contenu scrollable */}
                    <div
                      style={{
                        overflowY: "auto",
                        flex: 1,
                        padding: "1.5rem 2rem",
                      }}
                    >
                      {(remediationData.parcours || []).length === 0 ? (
                        <div className="text-center text-muted py-4">
                          <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                          <p>Pas de lacunes détectées pour ce quiz.</p>
                        </div>
                      ) : (
                        (remediationData.parcours || []).map(
                          (item: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: "#fffbeb",
                                border: "1px solid #fcd34d",
                                borderRadius: "12px",
                                padding: "1.5rem",
                                marginBottom: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.75rem",
                                  marginBottom: "1rem",
                                }}
                              >
                                <span
                                  style={{
                                    background: "#f59e0b",
                                    color: "#fff",
                                    padding: "4px 14px",
                                    borderRadius: "20px",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.competence}
                                </span>
                                <span
                                  style={{
                                    color: "#78350f",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {item.nombreQuestions} question(s) ratée(s)
                                </span>
                              </div>
                              {/* Explication en pré-wrap (Markdown brut lisible) */}
                              <div
                                style={{
                                  color: "#1c1917",
                                  fontSize: "0.9rem",
                                  lineHeight: 1.7,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {item.explication}
                              </div>
                            </div>
                          ),
                        )
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      style={{
                        padding: "1rem 2rem",
                        borderTop: "1px solid #e5e7eb",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "1rem",
                      }}
                    >
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowRemediation(false)}
                      >
                        Fermer
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          setShowRemediation(false);
                          closeResult();
                        }}
                      >
                        <i className="fas fa-redo mr-2"></i>Retenter le Quiz
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeQuiz) {
    const questionsList = Array.isArray(activeQuiz.questions)
      ? activeQuiz.questions
      : [];
    const currentQuestion = questionsList[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex] || {
      selectedOptionId: null,
      selectedOptionIds: [],
      textAnswer: "",
    };
    const progress =
      questionsList.length > 0
        ? ((currentQuestionIndex + 1) / questionsList.length) * 100
        : 0;

    if (!currentQuestion) {
      return (
        <div className="content">
          <div className="container text-center py-5">
            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Aucune question disponible pour ce quiz.
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setActiveQuiz(null)}
            >
              <i className="fas fa-arrow-left mr-1"></i> Retour
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10">
              <div
                className="card card-primary"
                ref={quizContainerRef}
                onMouseLeave={handleMouseLeave}
              >
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="card-title mb-0">{activeQuiz.title}</h3>
                    <div className="text-muted">
                      Question {currentQuestionIndex + 1} sur{" "}
                      {questionsList.length}
                    </div>
                  </div>
                  <div className="progress mt-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  {activeQuiz.documentMode === "NO_DOCS" && false && (
                    <div className="mt-2 text-danger small">
                      <i className="fas fa-exclamation-triangle"></i> Mode
                      anti-triche activé ! Sorties de souris : {mouseExitCount}
                      /3
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <h4>{currentQuestion.text}</h4>
                    {currentQuestion.hint && (
                      <small className="text-muted">
                        <i className="fas fa-lightbulb"></i> Indice :{" "}
                        {currentQuestion.hint}
                      </small>
                    )}
                  </div>

                  {currentQuestion.type === "SINGLE_CHOICE" &&
                    Array.isArray(currentQuestion.options) && (
                      <div className="list-group">
                        {currentQuestion.options.map((option: any) => (
                          <label
                            key={option.id}
                            className="list-group-item list-group-item-action"
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              className="mr-2"
                              checked={
                                currentAnswer?.selectedOptionId === option.id
                              }
                              onChange={() => selectAnswer(option.id)}
                            />
                            {option.text}
                          </label>
                        ))}
                      </div>
                    )}

                  {currentQuestion.type === "MULTIPLE_CHOICE" &&
                    Array.isArray(currentQuestion.options) && (
                      <div className="list-group">
                        {currentQuestion.options.map((option: any) => (
                          <label key={option.id} className="list-group-item">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={
                                currentAnswer?.selectedOptionIds?.includes(
                                  option.id,
                                ) || false
                              }
                              onChange={() => selectAnswer(option.id, true)}
                            />
                            {option.text}
                          </label>
                        ))}
                      </div>
                    )}

                  {currentQuestion.type === "TRUE_FALSE" &&
                    Array.isArray(currentQuestion.options) && (
                      <div className="list-group">
                        {currentQuestion.options.map((option: any) => (
                          <label
                            key={option.id}
                            className="list-group-item list-group-item-action"
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              className="mr-2"
                              checked={
                                currentAnswer?.selectedOptionId === option.id
                              }
                              onChange={() => selectAnswer(option.id)}
                            />
                            {option.text}
                          </label>
                        ))}
                      </div>
                    )}

                  {(currentQuestion.type === "SHORT_ANSWER" ||
                    currentQuestion.type === "ESSAY") && (
                    <div className="form-group">
                      <textarea
                        className="form-control"
                        rows={currentQuestion.type === "ESSAY" ? 10 : 3}
                        value={currentAnswer.textAnswer}
                        onChange={(e) => handleTextAnswer(e.target.value)}
                        placeholder="Entrez votre réponse..."
                      ></textarea>
                    </div>
                  )}
                </div>
                <div className="card-footer d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <i className="fas fa-arrow-left"></i> Précédent
                  </button>
                  {currentQuestionIndex === questionsList.length - 1 ? (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleSubmitQuiz(false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-1"></i>{" "}
                          Envoi...
                        </>
                      ) : (
                        "Soumettre le quiz"
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={nextQuestion}
                    >
                      Suivant <i className="fas fa-arrow-right"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <div className="container">
          <div className="row mb-2">
            <div className="col-sm-6 d-flex align-items-center">
              <button
                onClick={() => navigate(`/student/${id}`)}
                className="btn btn-tool mr-2"
                style={{ fontSize: "1.2rem", color: "#6c757d" }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className="m-0">
                Quiz : {module?.name || module?.title || ""}
              </h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item">
                  <Link to={"/student"}>Accueil</Link>
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
              <div className="card card-outline card-primary">
                <div className="card-header">
                  <h3 className="card-title">Quiz disponibles</h3>
                </div>
                <div className="card-body p-0">
                  {quizzes.length === 0 ? (
                    <div className="p-5 text-center text-muted">
                      <p>Aucun quiz n'est disponible pour ce module.</p>
                    </div>
                  ) : (
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Titre</th>
                          <th>Description</th>
                          <th>Durée</th>
                          <th>Tentatives</th>
                          <th>Note de réussite</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizzes.map((quiz: any) => {
                          const attempts = studentResults.filter(
                            (r) => r.quizId === quiz.id,
                          ).length;
                          const isLimitReached =
                            quiz.maxAttempts !== null &&
                            attempts >= quiz.maxAttempts;

                          return (
                            <tr key={quiz.id}>
                              <td>
                                <strong>{quiz.title}</strong>
                              </td>
                              <td>{quiz.description}</td>
                              <td>{quiz.timeLimit} min</td>
                              <td>
                                {quiz.maxAttempts ? (
                                  <span
                                    className={`badge ${isLimitReached ? "badge-danger" : "badge-info"}`}
                                  >
                                    {attempts} / {quiz.maxAttempts}
                                  </span>
                                ) : (
                                  <span className="badge badge-secondary">
                                    {attempts} (Illimité)
                                  </span>
                                )}
                              </td>
                              <td>
                                {quiz.passingScore > 20
                                  ? `${(quiz.passingScore / 5).toFixed(1)}/20`
                                  : `${quiz.passingScore}/20`}
                              </td>
                              <td className="text-right">
                                <button
                                  onClick={() => startQuiz(quiz.id)}
                                  className={`btn btn-sm ${isLimitReached ? "btn-outline-secondary" : "btn-primary"}`}
                                  title={
                                    isLimitReached
                                      ? "Votre score ne sera pas comptabilisé"
                                      : ""
                                  }
                                >
                                  {isLimitReached
                                    ? "S'entraîner (hors limite)"
                                    : "Commencer le quiz"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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

export default StudentQuiz;
