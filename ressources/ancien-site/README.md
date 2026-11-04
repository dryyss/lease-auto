# Ressources récupérées de l'ancien site lease-auto.fr

Récupéré le 04/11/2026. L'ancien site est une application React (Vite, généré avec Tempo) avec une base Supabase (`uywwiwjiykrvbawvocwp.supabase.co`, table `vehicles`).

## Images (`images/`)

| Fichier | Contenu | Réutilisable ? |
|---|---|---|
| `logo-lease-auto.png` (626×398) | Logo Lease Auto (2 copies identiques) | Oui, mais demander le logo vectoriel (SVG/AI) au client |
| `images_services_utlitaires.png` | Visuel service « Utilitaires » | À vérifier (probablement généré par IA) |
| `images_services_vtc.png` | Visuel service « VTC » | À vérifier (probablement généré par IA) |
| `pexels/*.jpg` | Photos d'illustration de la banque Pexels | Oui (licence Pexels libre), mais génériques |
| `pexels/pexels-1592384.jpg` | **Capture Gran Turismo (© Sony / Polyphony Digital)** | **Non, à ne pas réutiliser** |

**Pas encore récupérées : les photos des véhicules en stock.** Elles sont stockées dans Supabase. Pour les obtenir, il faut l'accès au projet Supabase du client (export de la table `vehicles` et du bucket de stockage). Autre option : le client fournit directement ses photos d'origine, en meilleure qualité.

## Textes (`textes-ancien-site.md`)

Chaînes extraites automatiquement du code, classées par page. Elles contiennent aussi du bruit technique (messages d'erreur des bibliothèques) à ignorer. Utile pour reprendre :

- les formules LOA et achat, la FAQ financement et les étapes du parcours ;
- la liste des justificatifs par profil (salarié, indépendant, société) ;
- la politique de confidentialité (durées de conservation).

## Coordonnées trouvées dans le code

- Téléphone : 01 84 21 83 93
- E-mails : contact@lease-auto.fr, et aussi contact@leaseauto.fr, dpo@leaseauto.fr, leaseauto.epinay@gmail.com (**à faire confirmer par le client** : deux domaines différents)
- Adresse : 42 boulevard Foch, 93800 Épinay-sur-Seine (cahier des charges)
- ORIAS, SIREN et capital : absents du code, à demander au client (obligatoires, voir PUB-02 et CONF-01)

## Pages de l'ancien site (pour les redirections, SEO-06)

Accueil, Services, Financement, Contact, Dossier, Suivi de dossier, Véhicules (liste et fiche), Mentions légales, Politique de confidentialité, Conditions générales, Cookies, Admin.
Récupérer les URL exactes depuis la Search Console du client, car le site n'a pas de sitemap utilisable.
