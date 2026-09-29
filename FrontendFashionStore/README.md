# FashionStore — Frontend

Boutique de vêtements en React 19 + Vite, branchée sur l'API
[`BackendFashionStore`](../BackendFashionStore) (Express 5 + MongoDB + Stripe).

---

## 1. Démarrage

```bash
# 1. Lancer d'abord le backend (dossier voisin)
cd ../BackendFashionStore && npm install && npm run dev   # http://localhost:3000

# 2. Puis le frontend
npm install
cp .env.example .env      # si .env n'existe pas encore
npm run dev               # http://localhost:5173
```

Vérification rapide : ouvrir **<http://localhost:5173/api>**. Cette page de
diagnostic affiche l'URL de l'API utilisée, l'état du serveur, la source du
catalogue et le résultat d'un appel sur chaque ressource.

### Scripts

| Commande          | Effet                                        |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Serveur de dev + proxy `/api` vers le backend |
| `npm run build`   | Build de production dans `dist/`              |
| `npm run preview` | Sert `dist/` avec le même proxy               |
| `npm run lint`    | ESLint sur tout le projet                     |

---

## 2. Variables d'environnement

Fichier `.env` à la racine (modèle : `.env.example`). Seules les variables
préfixées `VITE_` sont exposées au navigateur.

| Variable                      | Défaut                      | Rôle                                             |
| ----------------------------- | --------------------------- | ------------------------------------------------ |
| `VITE_API_URL`                | `http://localhost:3000/api` | Racine de l'API Express                          |
| `VITE_API_TIMEOUT`            | `20000`                     | Délai max d'une requête (ms)                     |
| `VITE_STRIPE_PUBLISHABLE_KEY` | *(vide)*                    | Clé publique Stripe (`pk_...`), optionnelle      |
| `VITE_TOKEN_KEY`              | `fashionstore_token`        | Clé localStorage du jeton JWT                    |

Le backend autorise `CLIENT_URL` (par défaut `http://localhost:5173`) en CORS.
`vite.config.js` proxifie en plus `/api` et `/uploads`, donc mettre
`VITE_API_URL=/api` supprime toute question de CORS en développement.

---

## 3. Architecture de la couche API

```
src/
├─ config/env.js            # lecture unique des variables Vite + clés localStorage
├─ constants/api.js         # miroir des enums backend (PAYMENT_METHODS, DELIVERY_METHODS…)
├─ Api/
│  ├─ axiosClient.js        # instance axios : baseURL, Bearer, erreurs normalisées, 401
│  ├─ endpoints.js          # carte de toutes les routes du backend
│  ├─ authApi.js            # /api/auth      register · login · me
│  ├─ usersApi.js           # /api/users     profile · password · admin
│  ├─ clothesApi.js         # /api/clothes   catalogue + avis d'un article
│  ├─ reviewsApi.js         # /api/reviews
│  ├─ ordersApi.js          # /api/orders
│  ├─ orderReviewsApi.js    # /api/order-reviews
│  ├─ paymentsApi.js        # /api/payments
│  ├─ cartsApi.js           # /api/carts     (moyen de paiement Stripe)
│  ├─ wishlistApi.js        # /api/wishlists
│  ├─ uploadApi.js          # /api/upload    (admin)
│  ├─ healthApi.js          # /api/health
│  ├─ index.js              # barrel : import { clothesApi } from "../Api"
│  └─ Api.jsx               # page /api de diagnostic
├─ utils/
│  ├─ storage.js            # localStorage tolérant aux pannes + jeton
│  ├─ normalize.js          # documents Mongo → formes attendues par l'UI
│  └─ checkoutMapper.js     # formulaire de checkout → corps acceptés par l'API
├─ hooks/
│  ├─ useCatalog.js         # catalogue filtré (API, repli local)
│  └─ useApiHealth.js       # sonde /api/health
├─ features/
│  ├─ products/productsSlice.js
│  └─ orders/ordersSlice.js
└─ components/
   ├─ AppBootstrap/         # synchronisation au démarrage
   └─ ProtectedRoute/       # garde de route (jeton, rôle admin)
```

### Gestion du jeton

`axiosClient` ajoute `Authorization: Bearer <token>` à chaque requête. Sur une
réponse `401`, il purge la session et émet l'événement
`fashionstore:unauthorized` ; `AppBootstrap` l'écoute et déclenche `logout()`.

### Erreurs

Toute erreur devient une `ApiRequestError` avec `.status`, `.message`
(le champ `message` renvoyé par `Middlewares/errorHandler.js`) et
`.isNetworkError`.

---

## 4. État Redux

| Slice      | Fichier                                  | Source de vérité                            |
| ---------- | ---------------------------------------- | ------------------------------------------- |
| `auth`     | `pages/Auth/authSlice.js`                | API (`/api/auth`), jeton en localStorage    |
| `products` | `features/products/productsSlice.js`     | API (`/api/clothes`) — source unique       |
| `orders`   | `features/orders/ordersSlice.js`         | API                                         |
| `cart`     | `pages/Checkout/cartSlice.js`            | client (persisté), pas de panier serveur    |
| `wishlist` | `components/WishList/wishlistSlice.js`   | client, synchronisé avec `/api/wishlists`   |
| `reviews`  | `components/Rating/reviewsSlice.js`      | client, thunks vers `/api/clothes/:id/reviews` |
| `ratings`  | `components/Rating/ratingsSlice.js`      | client                                      |

### Catalogue : le backend et lui seul

Les articles vivent côté serveur (`BackendFashionStore/seed/clothes.js` →
collection `Clothes`). Le frontend n'embarque **aucune** copie locale : tout
passe par `GET /api/clothes`, chargé une fois au démarrage par `AppBootstrap`
et conservé dans `productsSlice`.

Ajouter ou corriger un article se fait donc dans le seed du backend
(`npm run seed` côté API), jamais dans le frontend.

Un écran produit lit le catalogue via `useCatalog` :

```js
import useCatalog from "../../hooks/useCatalog";
// ...
const { allProducts: products } = useCatalog();                     // tout
const { products } = useCatalog({ audience: "men", category: "T-Shirts" });
```

`useCatalog` expose aussi `loading` et `error` : le catalogue arrivant par le
réseau, les premiers rendus voient une liste vide.

**Adaptation du schéma → UI.** `src/utils/normalize.js` (`normalizeProduct`)
traduit le document Mongo vers la forme attendue par les composants : `id`
reconverti en nombre, `_id` conservé, URL d'image résolue, nombres et tableaux
garantis. Les champs descriptifs optionnels (`type`, `fitType`, `features`,
`ageRange`, `uvProtection`…) sont déclarés dans `Models/clothes.js` et listés
dans `WRITABLE_FIELDS` côté backend : c'est ce qui les fait voyager jusqu'aux
filtres et aux fiches produit.

Les objets renvoyés ont exactement la même forme que ceux du fichier local, avec
en plus `_id` (l'ObjectId Mongo) — c'est lui qui permet de rattacher un article
à une commande ou à une wishlist.

---

## 5. Parcours de commande

`Checkout.jsx` déclenche le thunk `placeOrder` (`features/orders/ordersSlice.js`)
qui enchaîne trois appels :

1. `POST /api/orders` — la commande (bloquant) ;
2. `POST /api/payments` — le paiement rattaché ;
3. `POST /api/order-reviews` — le récapitulatif (adresse, livraison, paiement).

Seule l'étape 1 est bloquante ; un échec sur 2 ou 3 remplit `orders.warnings`
sans annuler l'achat. Si l'API entière est injoignable, la commande est
conservée en localStorage et un avertissement s'affiche sur l'écran de succès.

`utils/checkoutMapper.js` fait la traduction exigée par
`Middlewares/validate.js` :

| Formulaire                        | API                                            |
| --------------------------------- | ---------------------------------------------- |
| `shippingInfo.address`            | `ShippingAddress.StreetAddress`                |
| `shippingInfo.apartment`          | `ShippingAddress.ApartementSuite`              |
| `shippingInfo.state`              | `ShippingAddress.StateProvince`                |
| `zipCode: "75011"` *(String)*     | `ZipCode: 75011` *(Number obligatoire)*        |
| `shippingMethod: "express"`       | `DeliveryMethod: "Express Delivery"`           |
| `paymentMethod: "card"` + n° `4…` | `PaymentMethod: "Visa"` (sinon `"MasterCard"`) |
| `item.size: "M"`                  | `size: ["M"]` *(tableau)*                      |
| `item.id: 1`                      | `clothes: "<ObjectId>"` via le catalogue       |

Un article du panier introuvable dans le catalogue distant est envoyé **sans**
champ `clothes` (facultatif au schéma) plutôt qu'avec un id invalide qui ferait
échouer toute la commande.

Le numéro de carte ne quitte jamais le navigateur : il sert uniquement à
déduire la marque affichée.

---

## 6. Limites de l'API et contournements

Ces comportements viennent du backend ; le frontend s'y adapte, il ne les
corrige pas.

| Limite backend                                                     | Contournement frontend                                                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `GET /api/orders` est **admin only** : pas de « mes commandes »     | `fetchMyOrders` lit `GET /api/order-reviews` (filtré serveur, `order` populé) puis complète avec les ids retenus en localStorage |
| `GET /api/wishlists` est **admin only**                             | l'`_id` de la wishlist créée est mémorisé en localStorage et relu via `GET /api/wishlists/:id`            |
| `PUT /api/orders/:id` est **admin only**                            | `isPaid` est fixé à la création (`true` sauf paiement à la livraison)                                     |
| Un avis exige une commande **payée** contenant l'article            | `submitProductReview` remonte le message d'erreur (403) ; les avis locaux restent affichés                |
| `/api/carts` refuse toute donnée de carte brute                     | aucun appel tant que `VITE_STRIPE_PUBLISHABLE_KEY` est vide ; `cartsApi` est prêt pour un `pm_...`         |
| Le catalogue distant peut être vide                                 | `useCatalog` expose `loading` / `error` ; l'écran affiche une liste vide plutôt qu'une copie locale périmée |

### Brancher Stripe plus tard

1. `npm install @stripe/stripe-js @stripe/react-stripe-js`
2. renseigner `VITE_STRIPE_PUBLISHABLE_KEY` dans `.env`
3. tokeniser la carte dans l'étape 3 du checkout, puis appeler
   `cartsApi.createCart({ paymentMethodId: "pm_...", SaveCardForFuturePurchases })`.

`config/env.js` expose déjà `IS_STRIPE_ENABLED` pour conditionner l'affichage.

---

## 7. Routes de l'application

| Chemin                                   | Écran                              |
| ---------------------------------------- | ---------------------------------- |
| `/`                                      | Accueil                            |
| `/menclothing`, `/womenclothing`, …      | Catégories produits                |
| `/search`                                | Recherche                          |
| `/wishlist`                              | Liste d'envies                     |
| `/cart`, `/checkout`                     | Panier et tunnel de commande       |
| `/orders`                                | Historique — **connexion requise** |
| `/login`, `/register`                    | Authentification                   |
| `/api`                                   | Diagnostic de connexion à l'API    |
| `*`                                      | 404                                |

`ProtectedRoute` redirige vers `/login` en mémorisant la destination
(`auth.redirectTo`), que `Login.jsx` restaure après connexion.
