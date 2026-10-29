# arnakoff.com

Site et documentation de l'API d'Arnakoff, l'API française de signaux sourcés contre les arnaques.

Le site porte la vitrine, la documentation de l'API (`/docs`) et, à terme, un vérificateur en ligne. Il est en construction : suis l'avancement dans la [feuille de route](https://github.com/orgs/arnakoff/projects/1).

L'API elle-même vit dans [`arnakoff/api`](https://github.com/arnakoff/api). Ce dépôt en est le reflet : chaque signal, source, limite ou exemple cité sur le site doit y être confirmé.

## Pile

- [Astro](https://astro.build) 7, avec [Starlight](https://starlight.astro.build) pour `/docs`.
- TypeScript strict.
- En français uniquement.
- Hébergé sur Cloudflare Pages.

## Démarrer

Il te faut Node.js 26 (version exacte dans `.node-version`) et npm.

```sh
npm ci
npm run dev      # http://localhost:4321
```

## Commandes

| Commande          | Rôle                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| `npm run dev`     | Serveur de développement.                                                      |
| `npm run check`   | `astro check`, ESLint et Prettier, sans erreur ni avertissement.               |
| `npm run format`  | Formate le code avec Prettier.                                                 |
| `npm run build`   | Construit le site dans `dist/`.                                                |
| `npm test`        | Vérifie `dist/` : pages attendues, liens internes, métadonnées de chaque page. |
| `npm run preview` | Sert `dist/` en local.                                                         |
| `npm run icons`   | Régénère les icônes PNG et l'image de partage depuis `public/favicon.svg`.     |

La CI lance `check`, `build` et `test` sur chaque pull request.

## Contribuer

Lis [CONTRIBUTING.md](CONTRIBUTING.md). Pour une faille de sécurité, suis la [politique de sécurité](https://github.com/arnakoff/.github/blob/main/SECURITY.md), jamais une issue publique.

## Licence

[MIT](LICENSE).
