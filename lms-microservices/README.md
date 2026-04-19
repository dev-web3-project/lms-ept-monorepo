# LMS Backend - Architecture Microservices

Ce dossier contient les services backend de la plateforme LMS. Le système est conçu selon les standards de l'architecture Cloud Native (Spring Cloud).

## Structure du Système
1. Service Discovery (Eureka) : Annuaire dynamique permettant la communication inter-services.
2. API Gateway : Point d'entrée unique gérant le routage, le filtrage et la sécurité.
3. Config Server : Gestion centralisée des configurations via un dépôt Git local.
4. Database per Service : Isolation physique des données via des instances PostgreSQL dédiées.
5. AI Service : Intégration hybride RAG (Retrieval-Augmented Generation) pour l'analyse documentaire.

## Stack Technique
* Core : Spring Boot 3.4, Java 17, Spring Cloud.
* Sécurité : Spring Security, JWT Stateless, RBAC.
* Persistance : PostgreSQL, Hibernate/JPA.
* IA : Spring AI, Groq SDK, Google Generative AI.

## Instructions de Lancement Manuel
1. Configurer le fichier .env (voir .env.example).
2. Initialiser les bases de données (voir DATABASE_SETUP_GUIDE.md).
3. Lancer le script d'orchestration :
   ```bash
   chmod +x run-local.sh
   ./run-local.sh
   ```

## Tests et API
Des collections Postman sont disponibles dans ce dossier pour tester chaque endpoint de l'API de manière indépendante.

---
DIC2 - École Polytechnique de Thiès - 2026
