# Site Publix 360°

Site vitrine de l'agence de publicité et de marketing **Publix 360°** (Conakry).
En ligne sur **https://publix-alpha.vercel.app** : chaque envoi sur la branche `main` le met à jour automatiquement.

## Ce que contient ce dépôt

| Élément | Rôle |
|---|---|
| `index.html`, `a-propos.html`, `services.html`, `realisations.html`, `galerie.html`, `contact.html` | Les pages publiées (fabriquées automatiquement, **ne pas les modifier à la main**) |
| `style.css`, `main.js` | Styles et animations publiés (copiés depuis `source/src/`) |
| `img/` | Photos, logos, vidéo |
| `source/src/` | **Les fichiers de travail** : c'est ici qu'on modifie le site |
| `source/build.py` | Le programme qui assemble les fichiers de travail en pages finales |
| `api/` | Fonctions Vercel : inscription à la newsletter et espace admin (base Upstash reliée au projet Vercel) |
| `admin/` | Espace admin sur **/admin** : liste des inscrits, export PDF, changement du mot de passe (variable `ADMIN_PASSWORD` dans Vercel) |
| `package.json` | Indique à Vercel le format des fonctions de `api/` (à garder) |

Le formulaire de contact envoie les demandes par Web3Forms (clé publique dans `source/src/main.js`).

`source/` et ce README ne sont pas publiés sur le site (voir `.vercelignore`).

## Modifier le site

1. Modifiez le bon fichier dans `source/src/` :
   - menu du haut : `source/src/header.html`
   - pied de page (coordonnées, réseaux sociaux) : `source/src/footer.html`
   - contenu d'une page : `source/src/pages/<page>.html`
   - couleurs, polices, effets : `source/src/style.css`
   - animations et formulaires : `source/src/main.js`
2. Reconstruisez les pages depuis la racine du dépôt :
   ```bash
   python3 source/build.py
   ```
3. Enregistrez et envoyez (`git add -A`, `git commit`, `git push`) : le site se met à jour tout seul sur Vercel.

Les nouvelles images vont dans `img/`.
