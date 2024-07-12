<h1>MyCompanionAmiAmi</h1>
Ce dépôt contient le code source d'une application Tamagotchi simplifiée, avec un backend Node.js/Express et un frontend React Native.

<h2>Structure du projet</h2>
Le projet est structuré comme suit :

MyCompanionAppBackend/ : Contient le backend Node.js/Express.
MyCompanionApp/ : Contient le frontend React Native.
Prérequis
Avant de commencer, assurez-vous d'avoir installé les outils suivants :

Node.js & npm (ou yarn)
Expo CLI (pour le développement React Native)
Un émulateur iOS/Android ou un appareil mobile avec Expo Go installé pour tester l'application.

<h2>Installation</h2>

Cloner le dépôt :
git clone git@github.com:SDN33/MyCompanionAmiAmi.git
cd MyCompanionAmiAmi
Installer les dépendances du backend :


Copier le code:
cd MyCompanionAppBackend
npm install



Installer les dépendances du frontend :

Copier le code:
cd ../MyCompanionApp
npm install


<h2>Configuration</h2>

Backend :
Assurez-vous que les variables d'environnement nécessaires sont configurées correctement (ex. port, clés d'API, etc.).

Frontend :
Vérifiez le fichier de configuration pour l'URL du backend et ajustez si nécessaire.


<h2>Démarrage</h2>

Backend :

Copier le code:
cd MyCompanionAppBackend
npm start

Le serveur backend démarrera à l'adresse http://localhost:5000 par défaut.

Frontend :

Copier le code:
cd ../MyCompanionApp
npm start

Expo ouvrira une nouvelle fenêtre ou un onglet dans votre navigateur avec les options pour démarrer l'application sur un émulateur/simulateur ou un appareil physique via Expo Go.



<h2>Fonctionnalités</h2>

Nourrir, jouer, et reposer votre AmiAmi : Utilisez les boutons correspondants pour interagir avec votre Tamagotchi.

Suivi des statistiques : Visualisez les niveaux de faim, bonheur et énergie de votre AmiAmi, ainsi que son niveau et le temps écoulé depuis le démarrage.

Réinitialisation : Redémarrez votre Tamagotchi en appuyant sur le bouton "Recommencer".


<h2>Contributions</h2>
Les contributions sous forme de suggestions, rapports de bogues et pull requests sont les bienvenues. Pour les changements majeurs, veuillez ouvrir d'abord un ticket pour discuter de ce que vous aimeriez changer.

Licence
MIT

