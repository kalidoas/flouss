# Flouss (فلوس) 🇲🇦 — Finances Personnelles & Épargne

Application PWA de finances personnelles conçue pour un utilisateur au Maroc.
Suivi des dépenses, gestion des objectifs d'épargne par catégorie et pilotage des revenus en **Dirham Marocain (MAD)**.

---

## ✨ Fonctionnalités Clés

### 1. Onboarding & Verrouillage Inviolable
- Au premier lancement, l'application pose une unique question : *"Combien d'argent avez-vous actuellement au total ?"*.
- Ce montant initial est **définitivement verrouillé** avec confirmation de sécurité. Il ne peut plus être ni modifié ni supprimé.
- L'évolution ultérieure du solde se fait exclusivement par :
  - L'ajout de **Revenus** (augmente le solde disponible).
  - L'enregistrement de **Dépenses** ou de **Contributions aux objectifs** (diminue le solde disponible).

### 2. Catégories & Objectifs d'Épargne
- Catégories de dépenses courantes ou d'objectifs d'épargne.
- Chaque objectif comporte :
  - Montant cible (ex: 8 000 MAD pour un PC).
  - Durée en mois ou date cible.
  - **Calcul automatique de la mensualité requise** : `(cible - déjà épargné) / mois restants`.
  - Bouton rapide d'alimentation d'épargne avec déduction automatique du solde principal.
  - Barre de progression animée, statut (*Terminé*, *En bonne voie*, *En retard*, *Non commencé*).
  - Gestion complète : création, édition, archivage et suppression avec choix de réinjection de l'argent épargné vers le solde principal.
  - Catégories pré-remplies par défaut : Café, École, Nourriture, Salle de sport, Investissement, PC, Vêtements, Sadaqa.

### 3. Gestion des Revenus par Sources
- Sources configurées : *Salaire, Bourse / Minha, Bricolage (petits boulots), Cadeau, Autre*.
- Création de sources personnalisées avec choix de couleur et d'icône.
- Historique filtrable par mois et par source avec total par source.

### 4. Grand Livre des Transactions
- Typologie stricte : `income`, `expense`, `contribution`, `goal_withdraw`.
- Filtres multicritères (type, catégorie/source, mois, recherche textuelle).
- Suppression de transaction avec recalcul instantané et intègre du solde et des épargnes.

### 5. Statistiques & Santé Financière
- Graphique mensuel en barres Recharts (*Revenus vs Dépenses vs Épargne*) sur 6 mois.
- Graphique Donut de répartition des dépenses par catégorie.
- Taux d'épargne mensuel (part des revenus mise de côté).

### 6. PWA & Synchronisation Cloud Sécurisée
- Support PWA installable sur iOS Safari et Desktop.
- Synchronisation en temps réel via Firebase Firestore avec persistance locale Zustand (`localStorage`).
- Mode hors-ligne complet prévu dans la Phase 4.
- Sauvegarde et restauration locale par fichier JSON (`flouss_backup_*.json`).
- Bouton de chargement de données de démonstration marocaines.
- Thème Sombre / Clair / Système avec bascule instantanée.
- Masquage du solde d'un clic (Mode Confidentialité) pour les lieux publics.
- Support trilingue complet (Arabe RTL, Français, Anglais).

---

## 🛠️ Stack Technique

- **Framework :** React 18 + TypeScript + Vite
- **Styles :** Tailwind CSS (palette émeraude, polices système & JetBrains Mono, coins arrondis `rounded-3xl`)
- **Icônes :** Lucide React
- **Graphiques :** Recharts
- **State Management :** Zustand avec persistance `localStorage`
- **Animations :** Canvas-confetti lors de l'atteinte d'un objectif

---

## 🚀 Instructions de Lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur de développement
npm run dev

# 3. Compiler pour la production
npm run build

# 4. Prévisualiser le build de production
npm run preview
```

L'application est accessible sur `http://localhost:3000`.

---

## 📂 Structure des Fichiers

```
flouss/
├── public/
│   ├── icon.svg             # Logo vectoriel officiel Flouss (Dirham MAD)
│   ├── manifest.json        # Configuration PWA
│   └── sw.js                # Service Worker pour le mode hors-ligne
├── src/
│   ├── types/
│   │   └── index.ts         # Types TypeScript (Category, Transaction, etc.)
│   ├── store/
│   │   ├── useAppStore.ts   # Store Zustand persistant avec règles financières
│   │   └── defaultData.ts   # Catégories et sources marocaines initiales
│   ├── utils/
│   │   ├── formatters.ts    # Formatage MAD ("1 250,00 MAD"), dates françaises
│   │   ├── calculations.ts  # Algorithmes de calcul de solde, mensualité, progression
│   │   └── icons.tsx        # Sélecteur et mapper d'icônes Lucide
│   ├── i18n/
│   │   └── translations.ts  # Dictionnaire français & anglais
│   ├── components/
│   │   ├── common/          # Boutons, inputs MAD, modals, badges, cartes
│   │   ├── layout/          # Header, Sidebar desktop, Navbar mobile
│   │   ├── onboarding/      # Modal de fixation et verrouillage du solde initial
│   │   ├── goals/           # Barres de progression et calculs d'objectifs
│   │   ├── categories/      # Cartes, création et détails de catégories
│   │   └── transactions/    # Modals de dépenses, revenus, contributions
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── IncomePage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── StatsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```
