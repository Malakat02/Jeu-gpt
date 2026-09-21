# Échos de la forêt

Roguelite d’action en 2D, en pixel art, inspiré des donjons de Zelda et des salles de combat de The Binding of Isaac. Graphismes originaux dessinés en Canvas, sans ressources de Nintendo.

## Lancer

Ouvrir **index.html** dans un navigateur récent sur ordinateur. Aucune installation nécessaire. Une connexion n’est utile que pour les polices facultatives ; le jeu fonctionne hors ligne.

## Contrôles

| Action | Touches |
| --- | --- |
| Déplacement | ZQSD, WASD ou flèches |
| Épée | Espace ou J ; clic pour viser et frapper |
| Boomerang | K |
| Esquive invulnérable | Maj + direction |
| Coffre, marchand, source | E à proximité |
| Pause | Échap |

## Premier étage

12 salles : entrée, six salles de combat, autel de la clé, trésor, boutique, source et boss. Les portes s’ouvrent après élimination des ennemis. Le coffre offre un choix parmi trois reliques. Le marchand vend une potion (8 rubis), de la puissance (16) et un cœur permanent pour la tentative (14). Le boomerang traverse les obstacles ; il peut toucher chaque ennemi une fois par lancer. L’esquive évite les dégâts.

La clé se trouve au nord-ouest ; le boss est au nord-est, après la source de soin. Morne-Racine possède 54 points de vie, des projectiles et une charge ; il devient plus agressif à mi-vie. Ses projectiles sont espacés et sa charge est annoncée pendant 0,95 seconde, avec la trajectoire au sol. Après la charge, il reste vulnérable pendant 1,35 seconde et subit le double des dégâts. Les attaques à l’épée sont dirigées selon la dernière direction de déplacement, ou vers le clic.

Les rencontres, butins et choix de reliques changent à chaque nouvelle tentative. La disposition de cet étage reste fixe. Les reliques et rubis ramassés sont perdus à la mort. Chaque tentative achevée, gagnée ou perdue, renforce l’héritage : +2 rubis de départ pour les suivantes, jusqu’à 8. Cet héritage et les compteurs de victoires et défaites sont conservés localement si le navigateur permet le stockage. Il n’y a pas de sauvegarde de partie en cours.

## Audio

Musique chiptune originale avec variations pour la forêt, la boutique et le boss. Bruitages distincts pour les armes, l’esquive, les dégâts, les ennemis, les rubis, les soins, les portes, le coffre et les fins de partie. Le son démarre après le clic sur Entrer ; le bouton SON coupe musique et bruitages et mémorise votre préférence. La pause coupe le son. Aucun téléchargement audio nécessaire.

## Fichiers

- `index.html` : interface et lancement.
- `style.css` : présentation adaptative.
- `audio.js` : synthèse sonore, musique et bruitages.
- `game.js` : simulation, graphismes pixel art, sons, carte et progression.

Prototype solo conçu pour clavier et souris ; les commandes tactiles ne sont pas implémentées.

## Vérification

Avec Node.js : `node --check game.js`, `node --check audio.js`, `node test-game.cjs` et `node test-audio.cjs`. Les tests simulent la progression, les portes, le coffre, les achats, la source, la clé, le boss, le boomerang, la pause, les états de victoire et de défaite, ainsi que les chemins de rendu des salles. Ils vérifient aussi les bruitages, les thèmes musicaux et la coupure du son. Ils ne remplacent pas un test d’équilibrage par un joueur.
