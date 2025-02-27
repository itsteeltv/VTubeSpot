class TwitchAPI {
    constructor() {
        this.baseUrl = 'https://api.twitch.tv/helix';
        this.clientId = config.clientId;
        this.accessToken = config.accessToken;
        // ID du tag VTuber officiel de Twitch
        this.vtuberTagId = 'ff2744fb-0b05-43ef-9181-c6d733a5cf0c';
    }

    async getUserIdAndClips(username) {
        try {
            console.log('Recherche des clips pour:', username);
            
            // D'abord, on récupère l'ID de l'utilisateur
            const userResponse = await fetch(`${this.baseUrl}/users?login=${username}`, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const userData = await userResponse.json();
            console.log('Réponse API utilisateur:', userData);

            if (!userData.data || userData.data.length === 0) {
                throw new Error(`Aucun utilisateur trouvé avec le nom "${username}"`);
            }

            const userId = userData.data[0].id;
            console.log('ID utilisateur trouvé:', userId);

            // Ensuite, on récupère les clips
            const clipsResponse = await fetch(`${this.baseUrl}/clips?broadcaster_id=${userId}&first=100`, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const clipsData = await clipsResponse.json();
            console.log('Réponse API clips:', clipsData);

            if (!clipsData.data) {
                throw new Error('Format de réponse invalide de l\'API Twitch');
            }

            return clipsData.data;
        } catch (error) {
            console.error('Erreur détaillée:', error);
            throw new Error(`Erreur lors de la récupération des clips: ${error.message}`);
        }
    }

    async getLiveVTubersFR() {
        return this._getLiveVTubers('fr', ['Français', 'French', 'FR', 'France']);
    }

    async getLiveVTubersEN() {
        return this._getLiveVTubers('en', ['English', 'EN', 'ENG']);
    }

    async _getLiveVTubers(language, languageTags) {
        try {
            console.log(`Récupération des VTubers ${language.toUpperCase()} en direct...`);
            
            // Liste des tags pour les VTubers
            const vtuberTags = ['VTuber', 'vtuber', 'Vtuber'];
            
            let allStreams = new Map(); // Utiliser une Map pour éviter les doublons
            let cursor = null;
            let totalPages = 0;
            const maxPages = 10; // Nombre exact de pages à récupérer
            const streamsPerPage = 100; // Nombre de streams par page
            const maxViewers = 1000; // Nombre maximum de viewers

            do {
                // Construire l'URL avec le cursor si disponible
                const url = cursor 
                    ? `${this.baseUrl}/streams?first=${streamsPerPage}&language=${language}&after=${cursor}`
                    : `${this.baseUrl}/streams?first=${streamsPerPage}&language=${language}`;

                console.log(`Récupération de la page ${totalPages + 1}/${maxPages}...`);
                const streamsResponse = await fetch(url, {
                    headers: {
                        'Client-ID': this.clientId,
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });

                if (!streamsResponse.ok) {
                    const errorText = await streamsResponse.text();
                    console.error('Erreur de réponse:', streamsResponse.status, errorText);
                    throw new Error(`Erreur API: ${streamsResponse.status}`);
                }

                const streamsData = await streamsResponse.json();

                if (!streamsData.data) {
                    console.error('Pas de données dans la réponse');
                    break;
                }

                // Filtrer les VTubers de cette page avec moins de 30 viewers
                const vtuberStreams = streamsData.data.filter(stream => {
                    // Vérifier d'abord le nombre de viewers
                    if (stream.viewer_count > maxViewers) return false;
                    
                    if (!stream.tags) return false;
                    
                    // Vérifier si c'est un VTuber
                    const hasVTuberTag = stream.tags.some(tag => vtuberTags.includes(tag));
                    if (!hasVTuberTag) return false;

                    // Vérifier la langue
                    const isCorrectLanguage = stream.language === language || 
                                           stream.tags.some(tag => languageTags.includes(tag)) ||
                                           stream.title.toLowerCase().includes(languageTags[0].toLowerCase());

                    return isCorrectLanguage;
                });

                // Ajouter les streams trouvés à notre Map (évite les doublons)
                vtuberStreams.forEach(stream => {
                    if (!allStreams.has(stream.user_id)) {
                        allStreams.set(stream.user_id, stream);
                    }
                });

                console.log(`Page ${totalPages + 1}: ${vtuberStreams.length} VTubers ${language.toUpperCase()} trouvés avec moins de ${maxViewers} viewers (${allStreams.size} uniques au total)`);

                // Mettre à jour le cursor pour la prochaine page
                cursor = streamsData.pagination ? streamsData.pagination.cursor : null;
                totalPages++;

                // Continuer jusqu'à avoir parcouru les 20 pages ou jusqu'à ne plus avoir de résultats
            } while (cursor && totalPages < maxPages);

            console.log('Tags VTuber recherchés:', vtuberTags);
            console.log(`Tags ${language.toUpperCase()} recherchés:`, languageTags);
            console.log(`Nombre total de streams VTuber ${language.toUpperCase()} uniques avec moins de ${maxViewers} viewers:`, allStreams.size);

            // Convertir la Map en array et trier par nombre de spectateurs (croissant)
            const sortedStreams = Array.from(allStreams.values())
                .sort((a, b) => a.viewer_count - b.viewer_count);

            return sortedStreams;
        } catch (error) {
            console.error(`Erreur détaillée lors de la récupération des VTubers ${language.toUpperCase()}:`, error);
            throw new Error(`Erreur lors de la récupération des VTubers ${language.toUpperCase()} en direct: ${error.message}`);
        }
    }

    async getMoreVTubers(cursor, vtuberTags) {
        try {
            console.log('Chargement de plus de VTubers...');
            
            const response = await fetch(
                `${this.baseUrl}/streams?first=100&after=${cursor}`,
                {
                    headers: {
                        'Client-ID': this.clientId,
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erreur de réponse:', response.status, errorText);
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            
            // Filtrer pour garder les streams avec n'importe quel tag VTuber
            const vtuberStreams = data.data ? data.data.filter(stream => {
                if (!stream.tags) return false;
                return stream.tags.some(tag => vtuberTags.includes(tag));
            }) : [];

            console.log('Nombre de streams VTuber supplémentaires:', vtuberStreams.length);
            vtuberStreams.forEach((stream, index) => {
                console.log(`Stream VTuber supplémentaire ${index + 1}:`, {
                    user_name: stream.user_name,
                    title: stream.title,
                    viewer_count: stream.viewer_count,
                    tags: stream.tags,
                    matching_tags: stream.tags.filter(tag => vtuberTags.includes(tag))
                });
            });

            return vtuberStreams;
        } catch (error) {
            console.error('Erreur lors du chargement de plus de VTubers:', error);
            return [];
        }
    }
}
