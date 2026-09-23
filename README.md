# Échos de la forêt

Un roguelite d’action en pixel art, inspiré des donjons de Zelda et des combats de The Binding of Isaac. Trois étages, 38 salles et des tentatives où les objets, les armes et les dons changent votre façon de jouer. Graphismes en Canvas et musiques originales synthétisées, sans ressources extraites des jeux Nintendo.

## Jouer

Ouvrir **index.html** dans un navigateur récent sur ordinateur. Aucune installation ni compilation. Les polices facultatives utilisent une connexion Internet ; le jeu reste fonctionnel hors ligne.

Pour un serveur local, depuis le dossier du jeu : `python -m http.server 8765 --bind 127.0.0.1`, puis ouvrir `http://127.0.0.1:8765/`.

| Action | Commandes |
| --- | --- |
| Se déplacer | ZQSD, WASD ou flèches |
| Attaquer | Espace, J ou clic gauche pour viser |
| Attaque continue | Maintenir l’attaque avec l’épée, la grande épée ou le boulet |
| Master Sword : attaque circulaire | Maintenir l’attaque 0,7 s, puis relâcher |
| Boomerang | K |
| Esquive invulnérable | Maj + direction |
| Coffre, achat, fontaine, escalier | E à proximité |
| Pause | Échap |

Le son démarre après une interaction. Le bouton **SON** coupe musique et bruitages et mémorise votre préférence. Quitter la fenêtre met le jeu en pause. Sur appareil tactile, les commandes apparaissent directement sur la scène : joystick à gauche, bouton A pour attaquer ou interagir et deux petits boutons pour l’esquive et le boomerang. Elles sont semi-transparentes et fonctionnent simultanément. Maintenir puis relâcher A charge la Master Sword. Les cœurs sont en haut à gauche, les rubis juste dessous. En haut à droite, **CARTE** affiche le plan et suspend la partie, **PLEIN ÉCRAN** agrandit la scène, et **Ⅱ** met en pause. Si le navigateur refuse le plein écran natif, le jeu occupe toute la fenêtre disponible. La scène conserve ses proportions sans être coupée. Les commandes PC sont conservées.

## Les trois étages

1. **Les racines anciennes — 12 salles.** Le plan du premier étage est conservé : combats, trésor, boutique, clé au nord-ouest, fontaine et Morne-Racine au nord-est. Ce premier gardien conserve ses 54 PV, ses projectiles lents et sa charge annoncée.
2. **Le dédale des ombres — 23 salles.** Ambiance sombre, lanternes bleues, passages explicitement reliés, boucles et impasses. Trois trésors, une boutique, deux fontaines et une nouvelle clé. Le Veilleur des ombres possède 120 PV, des attaques plus rapides et des zones dangereuses annoncées au sol.
3. **Le sanctuaire de l’éclipse — exactement 3 salles.** Une entrée, une grande fontaine de fée qui soigne entièrement, puis une arène de 1440 × 960 (contre 960 × 640 pour les salles habituelles). Voragh est un boss géant à deux phases : **180 PV**, puis une **nouvelle barre complète de 220 PV**. Aucune clé n’est nécessaire à cet étage.

Les portes de temple sculptées se ferment pendant les combats. Les battants scellés se distinguent du passage sombre et des marches visibles lorsque la porte est ouverte. Une fois un gardien vaincu, son coffre apparaît. Ouvrez-le avec **E**, récupérez la récompense, puis utilisez l’escalier pour descendre. L’équipement, les rubis et les statistiques sont conservés entre les étages ; la clé est propre à chaque étage. Le trésor final, le **Cœur de l’aube**, termine l’aventure.

Les plans sont fixes, tandis que les rencontres et les offres de trésors changent entre les tentatives. La carte révèle les passages des salles explorées, sans dévoiler les impasses à l’avance.

Les trois étages traversent des ruines forestières : pierres moussues et lumière au premier, végétation sombre dans le dédale, puis arbre-mère corrompu au centre du sanctuaire. L’arbre est un décor traversable, dessiné derrière les personnages.

Morne-Racine alterne graines en éventail, racines et charge lente. Le Veilleur chasse le héros avec des salves ciblées, des ruées et une traînée d’épines. Voragh attaque avec des éruptions, des couronnes de projectiles et des racines qui balayent l’arène ; sa deuxième phase accélère les enchaînements et densifie les attaques. Les préparations sont silencieuses : les créatures se tassent, gonflent, replient leurs ailes ou prennent appui, et chaque attaque de boss possède sa propre posture. Aucun texte ni tracé ne révèle les tirs ou les charges ; les zones d’effet des boss restent visibles au sol. Les tirs et les charges ont des bruitages de départ discrets et distincts.

Chaque ennemi ordinaire a 38 % de chances de laisser 1 rubis (parfois 2) et, indépendamment, 12 % de chances de laisser un cœur. Une salle gagnée rapporte 1 rubis. Les boutiques restent des choix de dépense limités.

## Combat et armes

L’ancienne surface blanche semi-transparente a été retirée. Le dessin de la lame et les collisions utilisent désormais la même géométrie animée. Une cible est touchée lorsque la lame passe sur elle, une seule fois par attaque. Les obstacles bloquent les frappes. Les portées ci-dessous sont exprimées en unités du monde, depuis le héros.

Le premier boss propose **les trois armes au choix**. Sélectionnez celle que vous garderez pour la suite de la tentative :

| Arme | Portée | Dégâts de base multipliés par | Recharge de base | Particularité |
| --- | ---: | ---: | ---: | --- |
| Épée du voyageur (départ) | 78 | 1 | 0,36 s | Rapide et précise |
| Boulet du crépuscule | 250 | 4,6 | 1,18 s | Tête à pointes lancée en ligne droite, puis rappelée ; la chaîne ne fait pas de dégâts |
| Lame de la divinité | 126 | 1,7 | 0,57 s | Épée à deux mains plus longue et plus lente |
| Master Sword | 94 | 1,4 | 0,34 s | Rayon à vie pleine ; attaque circulaire chargée de portée 112 |

Le boulet ne touche chaque cible qu’une fois pendant son aller-retour, s’arrête devant les obstacles et ralentit les déplacements pendant le lancer. Les bonus de cadence accélèrent aussi l’animation des attaques ordinaires.

Avec la Master Sword, une pression lance une frappe normale ; maintenir charge ensuite un tournoiement. Relâcher après 0,7 seconde déclenche la rotation complète, qui inflige 50 % de dégâts supplémentaires. Un demi-cœur manquant suffit à désactiver le rayon. Le boomerang reste disponible avec toutes les armes.

## Reliques et dons

Les salles au trésor proposent un choix parmi trois objets d’un catalogue de **18 reliques**. Chaque objet modifie plusieurs statistiques : dégâts, cadence, vitesse, recharge ou durée d’esquive, cœurs maximum, soin, régénération ou boomerang. Les bonus se cumulent. Les boutiques vendent deux reliques et une potion ; un article ne peut être acheté qu’une fois.

Le deuxième boss donne le choix entre trois bénédictions, **valables uniquement jusqu’à la fin de la tentative** :

- **Force** : +75 % à tous les dégâts du héros, y compris les rayons et le boomerang.
- **Courage** : une seule résurrection, à la moitié exacte des cœurs maximum, avec trois secondes de protection. Le don est ensuite marqué comme consommé.
- **Sagesse** : tous les dégâts reçus sont divisés par deux ; les cœurs sont entourés de blanc et les demi-cœurs sont affichés.

La mort remet à zéro l’arme, les reliques et le don. Seuls les compteurs de victoires/défaites et l’héritage (+2 rubis de départ par tentative achevée, jusqu’à 8) restent enregistrés dans le navigateur. Pas de sauvegarde d’une tentative en cours : recharger la page la recommence.

## Audio et fichiers

Six arrangements chiptune (forêt, dédale, sanctuaire, boutique, boss et thème exclusif de Voragh) et 23 bruitages, synthétisés localement sans téléchargement audio. La musique est davantage présente dans le mixage.

- `index.html`, `style.css` : interface et affichage des cœurs.
- `content.js` : étages, passages, objets, armes et dons.
- `combat.js` : géométrie partagée entre animation et collisions.
- `game.js` : simulation, entrées, progression et récompenses.
- `touch.js` : joystick et commandes tactiles multitouch.
- `mobile-view.js`, `mobile.css` : commandes en surimpression, carte et plein écran mobile.
- `renderer.js` : pixel art, salles, armes, boss et carte.
- `audio.js` : musique, effets, pause et préférences sonores.

## Vérifications

Avec Node.js, sans dépendances :

```sh
node --check game.js
node --check content.js
node --check combat.js
node --check renderer.js
node --check audio.js
node test-game.cjs
node test-audio.cjs
node test-touch.cjs
node test-mobile-view.cjs
```

Les tests de simulation vérifient les 38 salles, les passages et clés, les collisions des armes, les coffres et achats, les 18 reliques, chaque don, les neuf combinaisons arme/don à travers les trois étages, les deux barres de vie finales et les resets à la mort. Ils couvrent aussi les préparations silencieuses, les postures des boss, les zones d’effet et la Master Sword au repos. Les tests audio couvrent les effets, les six arrangements, la pause et la coupure du son. L’équilibrage reste ajustable après des parties jouées.
