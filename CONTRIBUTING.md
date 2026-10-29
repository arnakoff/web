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

## Règles de code

- Pas de duplication : avant d'écrire un composant, un utilitaire ou un style, cherche dans `src/components`, `src/lib` et `src/styles`, et étends ce qui existe.
- Les couleurs passent uniquement par les jetons de `src/styles/tokens.css`, en thème clair et en thème sombre.
- Chaque lien externe ou URL absolue est défini une seule fois dans `src/lib/site.ts`.
- Animations en CSS uniquement, qui respectent `prefers-reduced-motion`. Pas de JavaScript côté client sans une fonctionnalité qui l'exige.
- Une nouvelle page s'ajoute à la liste des pages vérifiées dans `scripts/check-site.mjs`.
- Les en-têtes de sécurité vivent dans `public/_headers` : un nouveau script en ligne ou une nouvelle origine externe met à jour la CSP dans la même pull request.
- Une dépendance ajoutée ou mise à jour est épinglée à une version exacte, vérifiée sur le registre npm, avec des plages de pairs compatibles.

## Vérifications locales

Avant chaque push, lance les mêmes commandes que la CI :

```sh
npm run check   # 0 erreur, 0 avertissement
npm run build
npm test
```

Pour un changement visible, regarde chaque page touchée à 375 px et 1440 px de large, en thème clair et sombre : pas de défilement horizontal, navigation au clavier possible, focus visible. Le site vise le niveau AA du [RGAA](https://accessibilite.numerique.gouv.fr/).

## Commits et pull requests

- Branche : `<type>/<issue>-<description>`, par exemple `docs/5-community-files`.
- Commits et titres de pull request au format [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) : `feat(docs): add the RFC 9457 error pages`. Le corps explique pourquoi.
- Les pull requests sont fusionnées en squash dans `main` : leur titre devient le commit.
- Avant la fusion, la CI est verte et chaque conversation de relecture est résolue. Les personnes listées dans `.github/CODEOWNERS` sont ajoutées d'office en relecture.

## Licence

En contribuant, tu acceptes que ta contribution soit publiée sous la [licence MIT](LICENSE) du dépôt.
