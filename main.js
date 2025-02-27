let refreshInterval = null;
let currentPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    const twitch = new TwitchAPI();

    // Fonction pour créer un lecteur Twitch
    function createTwitchPlayer(channel, containerId) {
        if (currentPlayer) {
            currentPlayer.destroy();
        }
        
        currentPlayer = new Twitch.Player(containerId, {
            channel: channel,
            width: "100%",
            height: "100%",
            muted: true
        });
    }

    // Fonction pour afficher les VTubers dans un conteneur
    async function displayVTubers(container, getVTubersFunction) {
        try {
            const streams = await getVTubersFunction();
            container.innerHTML = ''; // Nettoyer le conteneur

            streams.forEach(stream => {
                const thumbnailUrl = stream.thumbnail_url
                    .replace('{width}', '440')
                    .replace('{height}', '248');

                const streamElement = document.createElement('div');
                streamElement.className = 'col-md-4 mb-4';
                const previewId = `preview-${stream.user_id}`;
                
                streamElement.innerHTML = `
                    <div class="card h-100 stream-card">
                        <div class="position-relative">
                            <img src="${thumbnailUrl}" 
                                 alt="${stream.user_name}" 
                                 class="stream-thumbnail"
                                 loading="lazy">
                            <div class="viewer-count">
                                ${stream.viewer_count.toLocaleString()}
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title" title="${stream.user_name}">${stream.user_name}</h5>
                            <p class="card-text" title="${stream.title}">${stream.title}</p>
                            <p class="card-text small" title="${stream.game_name}">${stream.game_name}</p>
                            <a href="https://twitch.tv/${stream.user_login}" 
                               target="_blank" 
                               class="btn btn-primary">
                                Regarder
                            </a>
                        </div>
                    </div>
                `;
                container.appendChild(streamElement);
            });
        } catch (error) {
            console.error('Erreur lors de l\'affichage des VTubers:', error);
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Erreur lors du chargement des VTubers: ${error.message}
                    </div>
                </div>
            `;
        }
    }

    // Fonction pour gérer le changement d'onglet
    function handleTabChange(event) {
        const tab = event.target;
        if (!tab.classList.contains('nav-link')) return;

        // Arrêter l'actualisation précédente
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }

        // Détruire le lecteur actuel s'il existe
        if (currentPlayer) {
            currentPlayer.destroy();
            currentPlayer = null;
        }

        // Configurer l'actualisation selon l'onglet
        if (tab.id === 'vtubers-tab') {
            const container = document.getElementById('vtubersContainer');
            displayVTubers(container, () => twitch.getLiveVTubersFR());
            refreshInterval = setInterval(() => {
                displayVTubers(container, () => twitch.getLiveVTubersFR());
            }, 60000); // 1 minute
        } 
    }

    // Ajouter les gestionnaires d'événements
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', handleTabChange);
    });

    // Gestionnaire pour la recherche de clips
    document.getElementById('searchButton')?.addEventListener('click', async () => {
        const username = document.getElementById('channelInput')?.value.trim();
        if (!username) return;

        const container = document.getElementById('clipsContainer');
        try {
            container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border"></div></div>';
            const clips = await twitch.getUserIdAndClips(username);
            
            if (clips.length === 0) {
                container.innerHTML = '<div class="col-12"><div class="alert alert-info">Aucun clip trouvé pour cet utilisateur.</div></div>';
                return;
            }

            container.innerHTML = '';
            clips.forEach(clip => {
                const clipElement = document.createElement('div');
                clipElement.className = 'col-md-4 mb-4';
                clipElement.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${clip.title}</h5>
                            <p class="card-text">Par ${clip.broadcaster_name}</p>
                            <p class="card-text">
                                <small class="text-muted">
                                    ${clip.view_count} vues
                                </small>
                            </p>
                            <a href="${clip.url}" 
                               target="_blank" 
                               class="btn btn-primary">
                                Regarder
                            </a>
                        </div>
                    </div>
                `;
                container.appendChild(clipElement);
            });
        } catch (error) {
            console.error('Erreur:', error);
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        Erreur: ${error.message}
                    </div>
                </div>
            `;
        }
    });
  

    // Afficher les VTubers FR par défaut
    const vtubersTab = document.getElementById('vtubers-tab');
    if (vtubersTab) {
        const tab = new bootstrap.Tab(vtubersTab);
        tab.show();
        // Déclencher manuellement le chargement initial des VTubers FR
        const container = document.getElementById('vtubersContainer');
        if (container) {
            displayVTubers(container, () => twitch.getLiveVTubersFR());
            refreshInterval = setInterval(() => {
                displayVTubers(container, () => twitch.getLiveVTubersFR());
            }, 60000); // 1 minute
        }
    }
});

// Fonctions utilitaires
function showLoading(show) {
    document.getElementById('loading').classList.toggle('d-none', !show);
}

function showVTubersLoading(show) {
    document.getElementById('vtubersLoading').classList.toggle('d-none', !show);
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

function showVTubersError(message) {
    const errorElement = document.getElementById('vtubersError');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

function hideError() {
    document.getElementById('error').classList.add('d-none');
}

function hideVTubersError() {
    document.getElementById('vtubersError').classList.add('d-none');
}
