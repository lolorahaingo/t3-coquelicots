# T3 Coquelicots — maquette 3D

Site statique (GitHub Pages) qui affiche la maquette du T3 réalisée avec l'éditeur [Pascal](https://www.npmjs.com/package/@pascal-app/cli) :

- **Vue 3D** : maquette orbitale, murs coupés à 1,30 m, clic sur une porte pour l'ouvrir, nom des meubles au survol ;
- **Plan** : plan coté généré depuis le graphe Pascal (murs, ouvertures, sens d'ouverture des portes, mobilier, surfaces) ;
- **Visite** : visite à pied (ZQSD / flèches, glisser pour regarder, joystick sur mobile), portes qui s'ouvrent à l'approche, mini-carte.

Aucune compilation : `index.html` + modules ES, three.js chargé depuis jsDelivr.

## Accès par mot de passe

Le dépôt est public mais la maquette n'y est que **chiffrée** (`data/*.enc`, AES-256-GCM, clé dérivée du mot de passe par PBKDF2-SHA256, 600 000 itérations). La page demande le mot de passe et déchiffre dans le navigateur ; sans lui, rien n'est lisible. Les fichiers en clair restent dans `private/` (ignoré par git).

- Mot de passe : `~/.config/coquelicots/site.password` (chmod 600), ou variable `SITE_PASSWORD`.
- Le changer : `printf '%s' 'nouveau-mot-de-passe' > ~/.config/coquelicots/site.password && node tools/encrypt.mjs`, puis commit + push.
- « Se souvenir sur cet appareil » garde la clé dérivée dans le navigateur ; le cadenas en haut à droite l'efface.

## Contenu

| Chemin | Rôle |
|---|---|
| `index.html`, `css/`, `js/` | le site |
| `data/model.glb.enc` | rendu 3D exporté par Pascal (Settings → Export GLB), chiffré |
| `data/scene.json.enc` | graphe Pascal (murs, pièces, portes, meubles), chiffré : sert au plan, aux surfaces et aux collisions de la visite |
| `data/meta.json` | sel et nombre d'itérations de la dérivation de clé (publics) |
| `tools/coquelicots-sync.mjs` | synchro entre Pascal local et plan.hellofabien.fr (`status`, `pull`, `push --glb`, `check`) |
| `tools/update-site.mjs` | récupère la maquette en ligne dans `private/` et la chiffre dans `data/` |
| `tools/encrypt.mjs` | chiffre `private/` → `data/` (`--new-password` pour en générer un) |
| `tools/serve.mjs` | serveur local de prévisualisation |

## Mettre la maquette à jour

1. Modifier la scène dans Pascal, exporter le GLB, l'envoyer : `node tools/coquelicots-sync.mjs push --glb ~/Downloads/<export>.glb`.
2. Récupérer la version en ligne dans le site (et la chiffrer) : `node tools/update-site.mjs`.
3. Publier : `git add data && git commit -m "Maquette à jour" && git push` (GitHub Pages se met à jour en ~1 min).

Le jeton d'accès à l'API est lu dans `~/.config/coquelicots/laurent.token` (ou `LAURENT_TOKEN`) et n'est jamais écrit dans ce dépôt.

## Prévisualiser en local

```bash
node tools/serve.mjs 8765
```

puis ouvrir http://localhost:8765.

## Repère

Mètres ; x vers l'est, z vers le sud, y vers le haut. Sol fini à y = 0,05, plafond à y = 2,48. Les surfaces affichées sont calculées depuis la maquette (polygone sur l'axe des murs moins une demi-épaisseur de mur).
