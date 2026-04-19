# Plan d'Optimisation des Performances IA (Sub-15s)

Ce document détaille les stratégies pour réduire le temps de réponse du service IA à moins de 15 secondes pour les tâches lourdes (Génération de Quiz, Syllabus, Remédiation).

## 1. Changement de Modèle d'Inférence (Priorité Haute)

### Analyse
Le modèle actuel `llama-3.3-70b-versatile` privilégie la précision au détriment de la vitesse pure. Pour des structures répétitives (JSON), un modèle plus léger est préférable.

### Recommandation
Utiliser `llama-3.1-8b-instant` sur Groq pour les tâches de génération de masse.
*   **Vitesse estimée** : ~500 tokens/sec.
*   **Temps de génération** : < 5 secondes pour un syllabus complet.

## 2. Parallélisation des Requêtes (Architecture)

### Analyse
La génération séquentielle de 10 questions de quiz prend du temps (le temps de génération est proportionnel au nombre de tokens).

### Recommandation
Implémenter un `ParallelGeneratorService` :
1.  Diviser la requête (ex: 10 questions) en 3 sous-requêtes de 3-4 questions.
2.  Lancer les appels à Groq en parallèle via `CompletableFuture`.
3.  Fusionner les résultats JSON en un seul objet final.
*   **Gain espéré** : Division du temps par 2 ou 3.

## 3. Optimisation du RAG (Focus Mode)

### Analyse
La recherche vectorielle et l'insertion du contexte ajoutent une latence fixe de 2-4 secondes.

### Recommandation
1.  **Cache de Contexte** : Si un utilisateur pose plusieurs questions sur le même module, garder les extraits RAG en cache (Redis ou local) pendant 5 minutes.
2.  **TopK Dynamique** : Réduire `topK` à 1 pour les questions simples, et ne monter à 2 ou 3 que pour les analyses complexes.

## 4. Amélioration de l'Expérience Utilisateur (UX)

### Analyse
L'attente "aveugle" du JSON complet crée une frustration même si le temps est de 12 secondes.

### Recommandation
1.  **Streaming JSON** : Envoyer les morceaux de texte via Server-Sent Events (SSE).
2.  **Affichage Progressif** : Modifier le frontend pour afficher les questions du quiz au fur et à mesure de leur réception, sans attendre la fin du flux.

---

## Prochaines Étapes Immédiates
1.  Modifier `application.yml` pour introduire une variable `GROQ_QUIZ_MODEL=llama-3.1-8b-instant`.
2.  Adapter `AiService` pour choisir le modèle en fonction du type de tâche.
