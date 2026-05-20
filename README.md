# Rapport de Stage / Projet de Conception : Plateforme Éducative "Creatix"

**Réalisé au sein de l'Association :** Pensez y
**Projet :** Creatix - Écosystème Éducatif de Nouvelle Génération
**Cadre :** Soutenance de Stage / Présentation de Projet

---

## 1. Introduction & Contexte du Projet

Dans le cadre de mon stage au sein de l'association **"Pensez y"**, j'ai été chargé de concevoir et de développer de A à Z une solution technologique innovante pour le secteur de l'éducation. L'objectif principal était de réduire la fracture numérique et d'améliorer l'interaction entre les enseignants et les élèves en dehors du cadre scolaire traditionnel.

C'est ainsi qu'est née **Creatix**, une plateforme web collaborative, interactive et profondément intégrée avec les dernières avancées en Intelligence Artificielle. Ce projet ne se limite pas à un simple outil de gestion, mais se positionne comme un véritable assistant pédagogique multifonctionnel.

---

## 2. Présentation de la Plateforme "Creatix"

Creatix est une application web découpée en **trois espaces de travail distincts et sécurisés**, adaptés aux besoins spécifiques de chaque utilisateur :
1. **L'Espace Élève (Student)** : Centré sur l'apprentissage, l'évaluation et le tutorat.
2. **L'Espace Professeur (Teacher)** : Axé sur la création de contenu, le suivi des classes et la communication.
3. **L'Espace Designer (Créateur de contenu)** : Dédié à la création d'outils visuels et d'aide à la conception.

Le design a été pensé pour être immersif et moderne, utilisant les codes visuels du "Glassmorphism" (effets de verre, flous, gradients dynamiques) pour rendre l'expérience d'apprentissage attrayante.

---

## 3. Fonctionnalités Principales Développées

### A. La Classe Virtuelle (Cœur du système collaboratif)
- **Création et Adhésion :** Les professeurs peuvent créer des classes et générer des liens d'invitation. Les élèves peuvent rejoindre ces classes en un clic.
- **Mur d'Annonces Interactif :** Un espace où le professeur publie des annonces. Il intègre un système robuste de partage multimédia permettant l'upload et l'affichage en temps réel d'Images, de Vidéos et de documents PDF.
- **Chat de Groupe en Temps Réel :** Un canal de discussion instantané exclusif aux membres de la classe, favorisant l'entraide.

### B. Évaluations et Quiz Chronométrés
- **Création (Professeur) :** Interface complète pour concevoir des quiz avec des questions à choix multiples, définition d'une limite de temps par question et sélection des bonnes réponses.
- **Participation (Élève) :** L'élève passe l'évaluation dans un environnement contrôlé. Son score est calculé instantanément après soumission grâce à un algorithme de comparaison de tableaux (arrays).
- **Suivi des Résultats :** Le professeur a accès à un tableau de bord listant les scores de chaque élève pour une évaluation donnée.

### C. L'Assistant Pédagogique IA (Creatix AI)
Intégration d'un assistant conversationnel intelligent :
- **Pour l'élève :** Agit comme un tuteur personnel. Il peut résoudre des équations (avec rendu mathématique LaTeX/KaTeX), expliquer des concepts, et même générer des images pédagogiques sur demande.
- **Pour le professeur :** Agit comme un assistant de préparation de cours, générateur d'idées d'exercices ou correcteur automatique.
- L'IA gère la persistance de l'historique et prend en charge l'envoi d'images pour analyse visuelle.

### D. Bibliothèque de Ressources
- Espace de stockage centralisé permettant aux professeurs de téléverser des supports de cours volumineux (jusqu'à 50MB) et aux élèves de les consulter ou les télécharger.

---

## 4. Stack Technologique (Outils & Langages)

Le projet a été bâti sur une architecture moderne, robuste et scalable :

* **Frontend (Interface Utilisateur) :**
  * **React.js & Vite** : Pour la construction d'une Single Page Application (SPA) ultra-rapide.
  * **Tailwind CSS** : Framework utilitaire utilisé pour concevoir une interface réactive et esthétique (Dark mode, dégradés, glassmorphism).
  * **Framer Motion** : Bibliothèque utilisée pour créer des animations fluides et des transitions d'interface (AnimatePresence pour les onglets et modales).
  * **Lucide React** : Collection d'icônes vectorielles cohérentes.
  * **React Markdown & KaTeX** : Pour le formatage du texte riche et le rendu des formules mathématiques de l'IA.

* **Backend as a Service (Firebase) :**
  * **Firestore Database** : Base de données NoSQL orientée documents. Utilisée intensivement avec des *Listeners temps réel* (`onSnapshot`) pour le chat et les notifications.
  * **Firebase Storage** : Pour l'hébergement sécurisé des fichiers lourds (PDF, photos, vidéos de la classe).
  * **Firebase Authentication** : Gestion de l'inscription et de la connexion des utilisateurs.

* **Intelligence Artificielle (APIs externes) :**
  * **Google Gemini API (Gemini 2.5 Flash)** : Modèle de langage puissant utilisé pour animer "Creatix AI". Capable de comprendre du texte et des images (multimodal).
  * **Pollinations AI** : Astucieusement intégré via des requêtes Markdown générées par Gemini pour dessiner des images à la volée.

---

## 5. Défis Techniques & Solutions Apportées

Durant le développement, plusieurs complexités techniques ont été surmontées, prouvant la robustesse de l'architecture :

1. **Le problème des Index Composites Firestore (Temps Réel) :**
   * **Défi :** Lors de la récupération des messages du chat triés par date d'envoi, Firebase refusait d'afficher les messages instantanément car l'heure locale (générée par `serverTimestamp()`) était temporairement nulle avant d'atteindre le serveur.
   * **Solution :** Refactorisation de la logique de tri. La requête Firestore ne fait plus qu'un filtrage basique (`where`), et le tri chronologique complexe est géré de manière asynchrone dans la mémoire du navigateur (JavaScript `.sort()`). Cela a rendu le chat et le mur instantanés.

2. **Upload Multimédia Asynchrone :**
   * **Défi :** Associer de manière fluide un fichier téléversé à une publication sur le mur sans bloquer l'expérience utilisateur.
   * **Solution :** Utilisation de l'API `uploadBytesResumable` de Firebase couplée à des Promises en JavaScript, permettant d'afficher une barre de progression en pourcentage avant de lier l'URL finale au document Firestore.

3. **Protection des Routes et Gestion d'État :**
   * Création d'un `AuthContext` (React Context API) enveloppant toute l'application pour surveiller l'état de connexion et le rôle de l'utilisateur, interdisant l'accès aux pages non autorisées via des composants `PrivateRoute`.

---

## 6. Conclusion et Perspectives

La plateforme **Creatix** répond pleinement au cahier des charges initial fixé par l'association **Pensez y**. En alliant la simplicité d'utilisation à la puissance du Cloud (Firebase) et de l'Intelligence Artificielle (Gemini), ce projet démontre comment les technologies modernes peuvent transformer la pédagogie.

**Perspectives d'évolution pour le futur du projet :**
- Intégration de visioconférence intégrée (via WebRTC) pour des cours en direct.
- Ajout de tableaux de bord statistiques pour les professeurs (Analytics) permettant de suivre le taux de progression d'un élève sur la durée.
- Développement d'une application mobile dédiée (React Native) utilisant la même base de données.

---
*Projet développé et documenté pour la soutenance de fin de stage.*
