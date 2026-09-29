# TODO - wishlist sur tous les composants

- [x] Lire tous les composants produits sous `src/components/*.jsx` qui utilisent une wishlist locale (useState) ou un coeur.
- [ ] Remplacer la wishlist locale par Redux `wishlistSlice` (useSelector state.wishlist.items).
- [ ] Mettre en place `isInWishlist(id)` basé sur Redux.
- [ ] Remplacer les actions coeur: dispatch addToWishlist/removeFromWishlist.
- [ ] Vérifier aussi les coeurs dans les modals/quick view.
- [ ] Uniformiser le payload envoyé à `addToWishlist` (même structure que WomenTShirts).
- [ ] Lancer `npm run build` (ou `npm run lint`) pour valider compilation.
