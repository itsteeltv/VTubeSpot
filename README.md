# Twitch Clips Viewer

Un site web pour visualiser les clips d'une chaîne Twitch.

## Configuration

1. Créez une application sur [dev.twitch.tv](https://dev.twitch.tv)
2. Notez votre Client ID
3. Ouvrez le site dans votre navigateur
4. Entrez votre Client ID dans le champ correspondant
5. Entrez le nom de la chaîne Twitch dont vous voulez voir les clips

## Fonctionnalités

- Interface utilisateur moderne et responsive
- Récupération des 100 derniers clips d'une chaîne
- Affichage des informations importantes :
  - Titre du clip
  - Créateur
  - Nombre de vues
  - Date de création
- Lien direct vers les clips
- Design aux couleurs de Twitch

## Hébergement

Ce site est entièrement statique et peut être hébergé sur n'importe quelle plateforme d'hébergement web comme :
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## Sécurité

⚠️ Note : Dans une version de production, il est recommandé de :
1. Ne pas exposer directement le Client ID dans l'interface
2. Gérer l'authentification Twitch côté serveur
3. Mettre en place un système de cache pour les tokens
