import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        accueil: 'index.html',
        boutique: 'boutique.html',
        piece: 'piece.html',
        maison: 'maison.html',
        panier: 'panier.html',
        adresse: 'adresse.html',
        livraison: 'livraison.html',
        paiement: 'paiement.html',
        recapitulatif: 'recapitulatif.html',
        confirmation: 'confirmation.html',
      },
    },
  },
});
