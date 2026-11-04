# Cahier des charges : nouveau site lease-auto.fr

**Référence :** CDC-LEA1 · version 1.1 du 04/11/2026
**Client :** Lease Auto, 42 boulevard Foch, 93800 Épinay-sur-Seine
**Prestataire :** Magar Développement, Andrys MAGAR

---

## 1. Contexte et objectifs

Lease Auto vend des véhicules d'occasion contrôlés avec financement LOA, LLD ou crédit, et livraison partout en France. Le site actuel présente des défauts relevés dans l'audit NOTE-LEA-01 et ne dispose d'aucun outil de gestion. Le projet consiste à créer un nouveau site complet, plus professionnel et plus interactif, développé sur mesure, avec une administration, du mailing, du référencement et des automatisations.

**Objectifs du projet :**

- Augmenter le nombre de demandes de financement qualifiées.
- Permettre à Lease Auto de gérer seul son stock, ses demandes et ses contenus.
- Gagner du temps grâce aux e-mails et relances automatiques.
- Améliorer la visibilité sur Google, en particulier en local.
- Sécuriser le site et le mettre en conformité (crédit à la consommation, RGPD).

**Priorités :** *Indispensable* = requis pour la mise en ligne · *Important* = prévu dans le projet · *Confort* = peut être retiré pour ajuster le budget.

## 2. Utilisateurs et rôles

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| ROL-01 | **Visiteur** | Consulte le catalogue, simule une mensualité, dépose une demande, s'abonne aux alertes. | Indispensable |
| ROL-02 | **Administrateur** | Accès complet : véhicules, demandes, contenus, réglages, utilisateurs. | Indispensable |
| ROL-03 | **Commercial** | Gère les véhicules et les demandes, sans accès aux réglages ni aux utilisateurs. | Important |

## 3. Site public


### Accueil et navigation

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| PUB-01 | **Page d'accueil** | Accroche, recherche rapide (marque, budget, mensualité), véhicules à la une, formules de financement, chiffres clés, avis, étapes du parcours. | Indispensable |
| PUB-02 | **Menu et pied de page** | Navigation claire sur mobile et ordinateur, coordonnées, horaires, liens légaux, numéro ORIAS. | Indispensable |
| PUB-03 | **Boutons de contact** | Appel, WhatsApp et demande de rappel accessibles depuis toutes les pages. | Indispensable |

### Catalogue et fiches véhicules

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| PUB-04 | **Catalogue** | Liste des véhicules disponibles avec photo, prix total, mensualité « à partir de », kilométrage, année, carburant. | Indispensable |
| PUB-05 | **Filtres et tri** | Marque, modèle, budget total, mensualité, année, kilométrage, carburant, boîte, type de véhicule. Tri par prix, date, kilométrage. | Indispensable |
| PUB-06 | **Fiche véhicule** | Galerie photos plein écran, caractéristiques, équipements, garantie, prix, mensualités par formule, bouton de demande. | Indispensable |
| PUB-07 | **Statuts visibles** | Badges « Nouveau », « Réservé », « Vendu ». Les véhicules vendus restent visibles un temps défini puis sont retirés. | Important |
| PUB-08 | **Favoris et comparateur** | Le visiteur enregistre des véhicules et en compare jusqu'à 3 côte à côte. | Confort |
| PUB-09 | **Partage** | Partage d'une fiche par WhatsApp, e-mail ou lien. | Confort |

### Financement et demandes

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| PUB-10 | **Simulateur** | Calcul de la mensualité en LOA, LLD ou crédit selon l'apport et la durée, avec TAEG, coût total et mentions légales obligatoires. | Indispensable |
| PUB-11 | **Pages formules** | Une page par formule (LOA, LLD, crédit) : principe, avantages, conditions, FAQ. | Indispensable |
| PUB-12 | **Demande de financement** | Formulaire en étapes : véhicule choisi, formule, situation, coordonnées. Envoi possible des justificatifs. | Indispensable |
| PUB-13 | **Estimation de reprise** | Le visiteur décrit son véhicule actuel (marque, modèle, année, kilométrage, photos) pour une estimation. | Important |
| PUB-14 | **Prise de rendez-vous** | Réservation d'un essai ou d'un passage en agence sur les créneaux définis dans l'administration. | Important |
| PUB-15 | **Alertes véhicule** | Le visiteur indique ses critères et reçoit un e-mail quand un véhicule correspondant est publié. | Important |

### Confiance et contenus

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| PUB-16 | **Avis clients** | Affichage des avis Google réels avec prénom, note et date. | Indispensable |
| PUB-17 | **À propos et agence** | Présentation de l'entreprise, photos de l'agence, plan d'accès, horaires. | Important |
| PUB-18 | **FAQ et guides** | Questions fréquentes et articles de conseil gérés depuis l'administration. | Important |
| PUB-19 | **Pages légales** | Mentions légales, politique de confidentialité, gestion des cookies, conditions générales. | Indispensable |

## 4. Administration

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| ADM-01 | **Tableau de bord** | Vue d'ensemble : nouvelles demandes, véhicules en ligne, rendez-vous du jour, demandes à relancer. | Indispensable |
| ADM-02 | **Gestion des véhicules** | Ajout, modification, duplication et suppression. Photos par glisser-déposer avec ordre et photo principale. Statut disponible, réservé ou vendu. | Indispensable |
| ADM-03 | **Mensualités** | Saisie ou calcul automatique des mensualités par formule à partir des taux définis dans les réglages. | Indispensable |
| ADM-04 | **Gestion des demandes** | Liste des demandes de financement, reprise et contact, avec statuts (nouvelle, en étude, accord, refus, livrée), notes internes et historique. | Indispensable |
| ADM-05 | **Justificatifs** | Consultation et téléchargement des documents envoyés par les clients, suppression automatique après un délai défini. | Important |
| ADM-06 | **Rendez-vous** | Définition des créneaux disponibles, liste et annulation des rendez-vous. | Important |
| ADM-07 | **Contenus** | Modification des textes, images, FAQ, articles et avis mis en avant, sans compétence technique. | Indispensable |
| ADM-08 | **Abonnés et contacts** | Liste des abonnés newsletter et alertes, export en fichier tableur. | Important |
| ADM-09 | **Réglages** | Coordonnées, horaires, taux et durées de financement, mentions légales, réseaux sociaux. | Indispensable |
| ADM-10 | **Utilisateurs** | Création des comptes administrateur et commercial, réinitialisation des mots de passe. | Important |
| ADM-11 | **Statistiques** | Nombre de visites, demandes reçues, véhicules les plus consultés, taux de transformation. | Confort |

## 5. Mailing

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| MAIL-01 | **Accusé de réception** | E-mail automatique au client après chaque demande, avec récapitulatif. | Indispensable |
| MAIL-02 | **Suivi du dossier** | E-mail au client à chaque changement de statut de sa demande. | Indispensable |
| MAIL-03 | **Notification interne** | E-mail immédiat à Lease Auto à chaque nouvelle demande ou rendez-vous. | Indispensable |
| MAIL-04 | **Alertes véhicule** | Envoi aux abonnés des nouveaux véhicules correspondant à leurs critères. | Important |
| MAIL-05 | **Newsletter** | Création et envoi depuis l'administration d'une sélection de véhicules ou d'une offre, avec désinscription en un clic. | Important |
| MAIL-06 | **Modèles aux couleurs** | Tous les e-mails aux couleurs de Lease Auto, lisibles sur mobile. | Indispensable |

## 6. Automatisations

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| AUTO-01 | **Relance dossier incomplet** | Relance automatique du client si des justificatifs manquent après 48 h, puis après 5 jours. | Indispensable |
| AUTO-02 | **Relance interne** | Rappel à l'équipe si une demande reste sans réponse plus de 24 h. | Important |
| AUTO-03 | **Rappel de rendez-vous** | E-mail ou SMS au client la veille du rendez-vous. | Important |
| AUTO-04 | **Demande d'avis** | E-mail au client quelques jours après la livraison avec lien vers la fiche Google. | Indispensable |
| AUTO-05 | **Publication automatique** | Envoi automatique des alertes aux abonnés à la mise en ligne d'un véhicule. | Important |
| AUTO-06 | **Retrait des vendus** | Retrait automatique des véhicules vendus du catalogue après le délai défini. | Confort |

## 7. Référencement

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| SEO-01 | **Rendu côté serveur** | Toutes les pages et annonces lisibles directement par les moteurs de recherche. | Indispensable |
| SEO-02 | **Pages marque et modèle** | Pages générées automatiquement par marque et modèle en stock, avec texte de présentation. | Indispensable |
| SEO-03 | **Pages locales** | Pages dédiées à Épinay-sur-Seine, Saint-Denis, Paris nord, Seine-Saint-Denis et Val-d'Oise. | Important |
| SEO-04 | **Balises et partage** | Titre, description et image de partage personnalisables pour chaque page et véhicule. | Indispensable |
| SEO-05 | **Données structurées** | Annonces, entreprise locale, avis et FAQ balisés pour les résultats enrichis de Google. | Important |
| SEO-06 | **Plan du site et redirections** | Plan du site automatique et redirection de toutes les anciennes adresses vers les nouvelles pages. | Indispensable |
| SEO-07 | **Outils Google** | Configuration de Search Console, de la mesure d'audience et de la fiche Google. | Indispensable |

## 8. Conformité et sécurité

| ID | Fonctionnalité | Description | Priorité |
|---|---|---|---|
| CONF-01 | **Publicité du crédit** | Exemple représentatif avec TAEG, coût total et mention « Un crédit vous engage et doit être remboursé » sur chaque offre chiffrée. | Indispensable |
| CONF-02 | **RGPD** | Consentement cookies, consentement aux e-mails, droit d'accès et de suppression, durée de conservation des données et des justificatifs. | Indispensable |
| CONF-03 | **Sécurité** | Connexion sécurisée à l'administration, protection anti-spam des formulaires, sauvegardes quotidiennes, nettoyage des pages parasites. | Indispensable |
| CONF-04 | **Accessibilité** | Contrastes, tailles de texte et navigation au clavier conformes aux bonnes pratiques. | Important |

## 9. Exigences techniques

- **Technologies :** Next.js 15 et Payload CMS v3, base de données PostgreSQL, développement sur mesure.
- **Hébergement :** Vercel, plan Pro, à la charge du client. Stockage des photos et documents sur un espace sécurisé.
- **E-mails et SMS :** outil d'envoi professionnel (type Resend ou Brevo), abonnement à la charge du client selon les volumes.
- **Performance :** score Lighthouse supérieur à 90 sur mobile, chargement d'une fiche véhicule en moins de 2 secondes.
- **Compatibilité :** affichage adapté mobile, tablette et ordinateur, sur les navigateurs récents.
- **Propriété :** code hébergé sur un dépôt au nom du client, accès transmis à la livraison.

## 10. Planning et livrables

| Étape | Contenu | Durée |
|---|---|---|
| 1. Cadrage | Validation du cahier des charges, récupération des accès et des contenus | Semaine 1 |
| 2. Design | Création de l'identité du site et maquettes des pages principales, validation par le client | Semaines 1 à 2 |
| 3. Développement | Site public, administration, mailing et automatisations | Semaines 2 à 6 |
| 4. Contenus et SEO | Import du stock, pages locales et modèles, redirections | Semaines 6 à 7 |
| 5. Recette | Tests par le client, corrections | Semaine 7 |
| 6. Mise en ligne | Bascule du domaine, formation à l'administration | Semaine 8 |

**Livrables :** site en ligne, administration, modèles d'e-mails, automatisations actives, accès au code et à l'hébergement, guide d'utilisation de l'administration.

## 11. Hors périmètre, pour une phase 2

- Espace client avec connexion et suivi du dossier en ligne.
- Signature électronique des contrats.
- Diffusion automatique du stock vers les plateformes d'annonces.
- Génération automatique des bons de commande en PDF.
- Campagnes Google Ads et gestion des réseaux sociaux.

## 12. Validation

Toute fonctionnalité non décrite dans ce document fera l'objet d'un devis complémentaire.

| Pour Magar Développement | Pour Lease Auto |
|---|---|
| M. Andrys MAGAR | Nom et qualité : |
| Date : | Date : |
| Signature : | Signature et cachet : |
