# Guide de Configuration des Bases de Données (Microservices LMS)

Ce document explique comment configurer l'environnement de base de données pour le projet LMS après la migration vers l'architecture **"Database per Service"**.

## 1. Création des Bases de Données
Chaque microservice possède désormais sa propre base de données physique. Vous devez créer les 5 bases suivantes dans votre instance PostgreSQL :

```sql
CREATE DATABASE user_db;
CREATE DATABASE course_db;
CREATE DATABASE university_db;
CREATE DATABASE announcement_db;
CREATE DATABASE ai_db;
```

## 2. Peuplement des Données (Migration)
Pour obtenir les mêmes données que l'environnement de référence, suivez ces étapes :

### Étape A : Restaurer la base source
Assurez-vous d'avoir une base `lmsdb` contenant les données originales. Si vous avez le fichier `lmsdb_dump.sql` :
```bash
createdb lmsdb
psql -d lmsdb < lmsdb_dump.sql
```

### Étape B : Exécuter le script de migration
Un script automatisé se charge de répartir les tables de `lmsdb` vers les 5 bases séparées :
```bash
bash migrate_databases.sh
```
*Le script va automatiquement copier les données dans `user_db`, `course_db`, etc., et vérifier les compteurs de lignes.*

## 3. Configuration de l'Environnement (.env)
Assurez-vous que votre fichier `.env` à la racine du projet contient les URLs correctes :

```env
# Identifiants communs
DB_USERNAME=votre_user
DB_PASSWORD=votre_password

# URLs spécifiques par service
USER_DB_URL=jdbc:postgresql://localhost:5432/user_db
COURSE_DB_URL=jdbc:postgresql://localhost:5432/course_db
UNIVERSITY_DB_URL=jdbc:postgresql://localhost:5432/university_db
ANNOUNCEMENT_DB_URL=jdbc:postgresql://localhost:5432/announcement_db
AI_DB_URL=jdbc:postgresql://localhost:5432/ai_db
```

## 4. Lancement
Une fois les bases créées et le `.env` configuré, lancez les services normalement :
```bash
./run-local.sh
```

---
**Note :** Le Config Server chargera automatiquement ces réglages depuis le dossier `config-repo/`. Vous n'avez rien à modifier dans les fichiers `application.yml` des microservices.
