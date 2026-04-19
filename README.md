# LMS EPT - Learning Management System

Cette plateforme est un système complet de gestion de l'apprentissage (LMS) conçu pour l'École Polytechnique de Thiès. Elle repose sur une architecture distribuée de microservices, optimisée pour une exécution locale fluide via Docker.

## Groupe de Développement
Projet réalisé par le **Groupe 2 - DIC2 GIT** :

* Médoune Diop : Infrastructure & Sécurité (Config, Discovery, Gateway, User-Service).
* Matar Faly : University-Service (Référentiel académique).
* Abdou Salam Mboup : Course-Service & AI-Service (Pédagogie et IA).
* Mouhamadou Abdoulaye Sow : Announcement-Service & LMS-Frontend (Communication et UI).

## Fonctionnalités Principales
La plateforme propose des outils avancés pour la modernisation de l'expérience académique :

* **Assistant IA & RAG** : Chatbot intelligent intégré permettant d'interroger les supports de cours (PDF) grâce à une architecture de recherche vectorielle (pgvector).
* **Système de Mentorat** : Mise en relation dynamique entre étudiants et professeurs pour un suivi personnalisé.
* **Gestion Pédagogique Complète** : Modules de cours, création de quiz interactifs, et gestion des notes.
* **Annonces Ciblées** : Diffusion d'informations par département, classe ou unité d'enseignement.
* **Architecture Scalable** : Découpage fonctionnel en microservices permettant une maintenance isolée et une haute disponibilité.

## Guide de Lancement Local (Installation Rapide)

### 1. Configuration de l'environnement
Copiez le fichier d'exemple et renseignez vos clés API (IA) dans le fichier `.env` :
```bash
cp lms-microservices/.env.example lms-microservices/.env
```

### 2. Lancement Manuel (Recommandé)
Ouvrez deux terminaux à la racine du projet :

**Terminal 1 : Backend (Microservices)**
```bash
cd lms-microservices
chmod +x run-local.sh
./run-local.sh
```

**Terminal 2 : Frontend (Interface)**
```bash
cd lms-frontend
npm install && npm run dev
```

### 3. Lancement via Docker (Alternative)
```bash
docker-compose up --build
```

## Caractéristiques Techniques
* Backend : Spring Boot 3 et Spring Cloud (Netflix Eureka, Config Server, Gateway).
* Sécurité : Jetons JWT et contrôle d'accès basé sur les rôles (RBAC).
* IA : Architecture RAG intégrant Groq (Llama 3) et Google Gemini.
* Frontend : Application React 18 intégrée.

---
DIC2 GIT - Groupe 2 - Avril 2026
