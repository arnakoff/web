# Contribuer au site d'Arnakoff

Merci de ton aide. Ce guide couvre le site et la documentation ; pour l'API, vois le dépôt [`arnakoff/api`](https://github.com/arnakoff/api).

En participant, tu acceptes le [code de conduite](https://github.com/arnakoff/.github/blob/main/CODE_OF_CONDUCT.md). Une faille de sécurité se signale en privé, selon la [politique de sécurité](https://github.com/arnakoff/.github/blob/main/SECURITY.md).

## Avant de commencer

- Cherche si une issue existe déjà. Sinon, ouvre-en une avec l'un des [formulaires](https://github.com/arnakoff/web/issues/new/choose) : bogue du site, ou erreur dans le contenu.
- Une issue, une branche, une pull request. Pour un changement important, discute-en dans l'issue avant d'écrire du code.
- Les issues s'écrivent en français. Le code, les commentaires, les messages de commit et les pull requests s'écrivent en anglais.

## Le contenu suit l'API

L'API, dans [`arnakoff/api`](https://github.com/arnakoff/api), est la seule source de vérité. Une affirmation, un chiffre, un signal, une source, une limite ou un exemple n'entre sur le site que si ce dépôt le confirme : lien vers le fichier à l'appui dans ta pull request.

Règles de rédaction, les mêmes que pour l'API :

- français, tutoiement, phrases courtes ;
- jamais « sûr » ni « fiable » à propos d'une entité vérifiée ;
- jamais « arnaque » à propos d'une entité nommée ;
- chaque fait avec sa source.

Les contenus factuels sont copiés, jamais réécrits : `npm run sync` recopie `docs/sources.md`, `docs/signals.md`, `api/openapi.yaml` et `CHANGELOG.md` d'un clone de l'API (`../arnakoff`, ou le dossier nommé par `ARNAKOFF_API_DIR`) dans `src/content/api/`. Pour corriger une copie, corrige le fichier dans `arnakoff/api`, puis relance `npm run sync`. Un fichier que l'API ne publie pas encore est ignoré.

Le workflow `Content sync` le fait chaque jour et ouvre une pull request sur la branche `chore/content-sync` quand une copie change. Une PR ouverte avec `GITHUB_TOKEN` ne déclenche aucun workflow : il utilise donc le jeton d'une GitHub App de l'organisation, à configurer une fois par le propriétaire :

1. Créer une GitHub App dans l'organisation `arnakoff` (sans webhook), avec les permissions de dépôt _Contents_ et _Pull requests_ en écriture, puis l'installer sur `arnakoff/web` uniquement.
2. Enregistrer son _Client ID_ dans la variable Actions `SYNC_APP_CLIENT_ID` et une clé privée dans le secret Actions `SYNC_APP_PRIVATE_KEY`.

Tant que la variable n'existe pas, le workflow est ignoré.

## Déploiement

Le site est hébergé sur Cloudflare Pages. Le job `Deploy` du workflow `CI` publie le `dist/` vérifié avec `wrangler` (version de `package-lock.json`) : la production à chaque push sur `main`, une prévisualisation pour chaque pull request. L'adresse de la prévisualisation s'affiche dans la pull request, sur son déploiement (environnement `preview`).

Les pull requests venant d'un fork ou de Dependabot ne sont pas déployées : elles ne reçoivent aucun secret.

À configurer une fois par le propriétaire :

1. Créer dans Cloudflare un projet Pages `arnakoff-web` en envoi direct (_Direct Upload_), avec `main` comme branche de production, puis y rattacher le domaine `arnakoff.com`.
2. Créer un jeton d'API Cloudflare limité à _Cloudflare Pages : Edit_ sur ce compte.
3. Dans GitHub, créer les environnements `production` (déploiement limité à la branche `main`) et `preview`, et enregistrer le jeton dans le secret `CLOUDFLARE_API_TOKEN` de chacun.
4. Enregistrer l'identifiant du compte Cloudflare dans la variable Actions `CLOUDFLARE_ACCOUNT_ID` du dépôt.

Tant que la variable n'existe pas, le job est ignoré.

Les en-têtes de sécurité (CSP, HSTS, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`) sont dans `public/_headers`. `npm run build` y ajoute l'empreinte SHA-256 de chaque script en ligne des pages construites ; `npm test` vérifie que chaque page reçoit ces en-têtes et que Chromium ne signale aucune violation de la CSP, recherche de la documentation comprise.

## Règles de code

- Pas de duplication : avant d'écrire un composant, un utilitaire ou un style, cherche dans `src/components`, `src/lib` et `src/styles`, et étends ce qui existe.
- Les couleurs passent uniquement par les jetons de `src/styles/tokens.css`, en thème clair et en thème sombre.
- Chaque lien externe ou URL absolue est défini une seule fois dans `src/lib/site.ts`.
- Animations en CSS uniquement, qui respectent `prefers-reduced-motion`. Pas de JavaScript côté client sans une fonctionnalité qui l'exige.
- Une nouvelle page s'ajoute à la liste des pages vérifiées dans `scripts/dist.mjs`.
- Les en-têtes de sécurité vivent dans `public/_headers` : un nouveau script en ligne ou une nouvelle origine externe met à jour la CSP dans la même pull request.
- Une dépendance ajoutée ou mise à jour est épinglée à une version exacte, vérifiée sur le registre npm, avec des plages de pairs compatibles.

## Vérifications locales

Avant chaque push, lance les mêmes commandes que la CI :

```sh
npm run check   # 0 erreur, 0 avertissement
npm run build
npm test
```

`npm test` passe aussi chaque page dans Chromium à 375 px et 1440 px, en clair et en sombre : analyse axe (WCAG 2.2 AA, échec sur toute violation sérieuse ou critique), parcours au clavier avec focus visible, pas de défilement horizontal. Une fois par poste : `npx playwright install --only-shell chromium`.

Pour un changement visible, regarde chaque page touchée à 375 px et 1440 px de large, en thème clair et sombre : pas de défilement horizontal, navigation au clavier possible, focus visible. Le site vise le niveau AA du [RGAA](https://accessibilite.numerique.gouv.fr/).

## Commits et pull requests

- Branche : `<type>/<issue>-<description>`, par exemple `docs/5-community-files`.
- Commits et titres de pull request au format [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) : `feat(docs): add the RFC 9457 error pages`. Le corps explique pourquoi.
- Les pull requests sont fusionnées en squash dans `main` : leur titre devient le commit.
- Avant la fusion, la CI est verte et chaque conversation de relecture est résolue. Les personnes listées dans `.github/CODEOWNERS` sont ajoutées d'office en relecture.

## Licence

En contribuant, tu acceptes que ta contribution soit publiée sous la [licence MIT](LICENSE) du dépôt.
