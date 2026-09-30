# FashionStore — Backend

REST API for the FashionStore e-commerce app. Express 5 + MongoDB (Mongoose) + JWT auth + Stripe.

## Démarrage

```bash
npm install
cp .env.example .env         # puis remplir les valeurs
npm run seed                 # catalogue de démonstration (247 articles)
npm run dev                  # ou: npm start
```

L'API écoute sur `http://localhost:3000`. Test rapide : `GET /api/health`.
Vérification complète : `npm run smoke`.

### Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` / `npm start` | démarre l'API (watch / simple) |
| `npm run seed` | insère le catalogue de démonstration (upsert, idempotent) |
| `npm run seed -- --fresh` | vide la collection `Clothes` avant d'insérer |
| `npm run seed -- --admin` | crée/promeut l'admin décrit dans `.env` |
| `npm run migrate` | migrations de données (`-- --list`, `-- --dry-run`) |
| `npm run indexes` | aligne les index Mongo sur les schémas (`-- --check`) |
| `npm run smoke` | démarre l'API sur un port libre et vérifie 15 points |
| `npm run mail:test` | teste le SMTP (`-- --verify-only`, `-- --to a@b.com`) |

## Structure

```
app.js          application Express (middlewares + routes), sans écoute
index.js        démarrage : validation .env, connexion Mongo, écoute, arrêt propre
config/         env (source unique des variables), connexion Mongo, client Stripe
Models/         schémas Mongoose
Controllers/    logique HTTP
Routers/        définition des routes
Middlewares/    auth, admin, rateLimiter, sanitize, gestion d'erreurs
services/       règles métier réutilisables (catalogue, Stripe)
validators/     validation des corps de requête (index.js)
Utils/          ApiError, asyncHandler, jwt, apiFeatures, response, mailer
seed/           catalogue de démonstration + script d'insertion
scripts/        migrate, syncIndexes, smokeTest, testMail
```

Les anciens chemins restent valides : `Middlewares/validate.js`,
`Utils/generateToken.js` et `Utils/stripeError.js` réexportent simplement leur
nouvelle implémentation.

## Configuration

Tout passe par `.env`, lu **une seule fois** par `config/env.js` qui convertit
et valide les valeurs : le serveur refuse de démarrer si `JWT_SECRET` ou
`DB_URI` manquent, et prévient (sans bloquer) si Stripe, Google ou le SMTP ne
sont pas configurés. Voir `.env.example` pour la liste complète et commentée.

Ces valeurs doivent rester alignées avec `FrontendFashionStore/.env` :

| Backend | Frontend |
|---|---|
| `PORT=3000` | `VITE_API_URL=http://localhost:3000/api` |
| `CLIENT_URL` (liste d'origines) | ports de Vite : 5173 (dev) et 4173 (preview) |
| `GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` — **identiques** |
| `STRIPE_SECRET_KEY` (`sk_…`) | `VITE_STRIPE_PUBLISHABLE_KEY` (`pk_…`), même compte |

`CLIENT_URL` accepte plusieurs origines séparées par des virgules ; la
**première** sert de domaine canonique pour les liens de confirmation d'email
et les URL de retour Stripe.

## Sécurité des requêtes

- **Assainissement** (`Middlewares/sanitize.js`) : les clés commençant par `$`,
  contenant un `.` ou touchant au prototype sont retirées des corps de requête
  et des query strings. Un `{"email": {"$ne": null}}` posté sur `/login` ne peut donc plus
  servir de filtre Mongo. Les commentaires d'avis et les descriptions d'article
  sont en plus débarrassés de leurs balises HTML.
- **Limitation de débit** (`Middlewares/rateLimiter.js`) : 600 requêtes / 15 min
  sur `/api`, 20 tentatives ratées / 15 min sur les routes d'authentification
  (les connexions réussies ne comptent pas), 60 envois d'images. Dépassement :
  `429` avec `Retry-After` et les en-têtes `RateLimit-*`.
- Derrière un reverse proxy, mettre `TRUST_PROXY=true` — sinon tout le trafic
  est compté sur l'IP du proxy.

## Authentification

Les routes protégées attendent un header :

```
Authorization: Bearer <token>
```

Le token est renvoyé par `/api/auth/login`, `/api/auth/google` et
`/api/auth/verify-email` — pas par `/api/auth/register`, qui laisse le compte
en attente de confirmation (voir ci-dessous).
Deux rôles : `user` (défaut) et `admin`.

> Pour créer le premier admin, passer le champ `role` à `"admin"` directement en
> base sur un utilisateur existant. Ensuite `PUT /api/users/:id/role` suffit.

## Endpoints

Légende : 🔓 public · 🔒 utilisateur connecté · 👑 admin

### Auth — `/api/auth`
| Méthode | Route | Accès |
|---|---|---|
| POST | `/register` | 🔓 |
| POST | `/login` | 🔓 |
| POST | `/google` | 🔓 |
| POST | `/verify-email` | 🔓 |
| POST | `/resend-verification` | 🔓 |
| GET | `/me` | 🔒 |

`/register` attend `firstName`, `lastName`, `email`, `phone` et `password`
(8 caractères minimum). L'adresse de livraison n'est plus stockée sur
l'utilisateur : elle est portée par `Payement.shipping` et
`OrderReview.ShippingAddress`.

### Confirmation d'email

Un compte créé par `/register` naît avec `isEmailVerified: false` et **aucun
token n'est renvoyé** : `/login` répond `403` avec `code: "EMAIL_NOT_VERIFIED"`
tant que l'adresse n'est pas confirmée. Les comptes Google sont confirmés
d'office, Google ayant déjà vérifié l'adresse.

1. `/register` envoie un lien `CLIENT_URL/verify-email?token=…` valable 24 h.
   La base ne garde que l'empreinte SHA-256 du jeton.
2. La page front récupère le `token` de l'URL et le poste à
   `POST /api/auth/verify-email` → le compte est activé et la réponse contient
   le JWT (connexion immédiate, sans ressaisir le mot de passe).
3. Lien perdu ou expiré : `POST /api/auth/resend-verification` avec `{ email }`.
   La réponse est toujours la même, qu'un compte existe ou non.

Le SMTP se configure dans `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `MAIL_FROM`). Avec Gmail, `SMTP_PASS` doit être un *mot de passe
d'application*. Si ces variables sont vides, rien n'est envoyé et le lien est
affiché dans la console du serveur — pratique en développement.

### Utilisateurs — `/api/users`
| Méthode | Route | Accès |
|---|---|---|
| GET / PUT | `/profile` | 🔒 |
| PUT | `/password` | 🔒 |
| GET | `/` | 👑 |
| GET / DELETE | `/:id` | 👑 |
| PUT | `/:id/role` | 👑 |

### Catalogue — `/api/clothes`
| Méthode | Route | Accès |
|---|---|---|
| GET | `/` (voir filtres ci-dessous) | 🔓 |
| GET | `/:id` | 🔓 |
| GET | `/:clothesId/reviews` | 🔓 |
| POST | `/:clothesId/reviews` | 🔒 |
| POST / PUT / DELETE | `/` · `/:id` | 👑 |

`GET /api/clothes` accepte `keyword` (index texte), `category`, `subCategory`,
`audience`, `author`, `badge`, `inStock`, `type`, `fitType`, ainsi que des
opérateurs sur les champs numériques (`price[gte]`, `price[lte]`,
`rating[gte]`), `sort` (`-price,title`), `fields` et `page` / `limit`.

La réponse reste `{ total, data }`. **Sans `page` ni `limit`, la liste est
complète** — les écrans qui chargent tout le catalogue d'un coup ne changent
pas. Avec l'un des deux, la réponse gagne `page`, `limit`, `pages` et
`hasMore`, que le frontend ignore sans dommage.

#### Seule source des articles

`seed/clothes.js` est la définition unique du catalogue : le frontend
n'embarque plus de copie locale des produits, ses écrans lisent tous
`GET /api/clothes` (`src/hooks/useCatalog.js`). Un article ajouté ou corrigé
ici, puis `npm run seed`, se propage donc à toute l'application.

En conséquence, `Models/clothes.js` porte aussi les champs descriptifs
optionnels dont l'UI se sert (`type`, `fitType`, `fit`, `features`,
`ageRange`, `ageGroup`, `gender`, `occasion`, `collar`, `neckline`, `sleeve`,
`length`, `inseam`, `rise`, `heelHeight`, `closure`, `uvProtection`,
`lensType`, `weight`, `care`). Sans eux au schéma, Mongoose les supprimerait
en silence et les filtres de coupe comme les fiches produit perdraient ces
informations. Ils figurent pour la même raison dans `WRITABLE_FIELDS`
(`services/catalogService.js`), et côté frontend `normalizeProduct`
(`src/utils/normalize.js`) fait l'adaptation document Mongo → forme attendue
par les composants.

### Avis — `/api/reviews`
| Méthode | Route | Accès |
|---|---|---|
| GET | `/` (filtres : `clothes`, `user`) · `/:id` | 🔓 |
| POST | `/` | 🔒 |
| PUT / DELETE | `/:id` | 🔒 (auteur, ou admin pour DELETE) |

Un avis n'est accepté que si l'utilisateur a une commande **payée** contenant
l'article, et une seule fois par article. Le `rating` et le compteur `reviews`
du produit sont recalculés automatiquement.

### Récapitulatif de commande — `/api/order-reviews`
| Méthode | Route | Accès |
|---|---|---|
| GET | `/` (filtre : `order`) · `/:id` | 🔒 |
| POST | `/` | 🔒 |
| PUT / DELETE | `/:id` | 🔒 (propriétaire, ou admin) |

Étape « Review your order » du checkout : adresse de livraison, mode de
livraison et mode de paiement figés pour une commande donnée (un seul
récapitulatif par commande). À ne pas confondre avec `/api/reviews`, qui porte
les avis produits.

### Panier / Wishlist / Commandes / Paiements
`/api/carts`, `/api/wishlists`, `/api/orders`, `/api/payments` — 🔒 pour les
opérations courantes, 👑 pour lister l'ensemble du magasin.

Aucune donnée de carte ne transite par l'API : le front tokenise la carte avec
Stripe.js et envoie `paymentMethodId` (`pm_...`) à `POST /api/carts`. Le
serveur relit le PaymentMethod chez Stripe et ne stocke que `CardBrand`,
`Last4`, `ExpiryDate`, `CartholderName` et `stripePaymentMethodId`. Un envoi
de `CartNumber`/`CVV` est rejeté en 400. Avec
`SaveCardForFuturePurchases: true`, la carte est rattachée à un client Stripe
(`User.stripeCustomerId`, créé au besoin). Nécessite `STRIPE_SECRET_KEY`.

Une commande exige un `orderNumber` unique : il est généré côté serveur s'il
n'est pas fourni.

## Format des erreurs

Toutes les erreurs passent par un handler unique :

```json
{ "success": false, "message": "Invalid email or password" }
```

Le champ `stack` est ajouté hors production, et un champ `code` stable
(`EMAIL_NOT_VERIFIED`, `RATE_LIMITED`, `STRIPE_NOT_CONFIGURED`…) quand l'erreur
en porte un. Codes utilisés : 400 (validation), 401 (token absent/invalide),
403 (droits insuffisants ou origine CORS refusée), 404, 409 (doublon),
429 (quota dépassé), 503 (service externe non configuré), 500.
