function calculTotalPoints(matchs) {
    let total = 0
    index_max = matchs.length
    matchs_by_date = JSON.parse(JSON.stringify(matchs)).reverse()
    match_to_keep = suppressionMatchMemeJoueur(matchs_by_date)
    last_match = match_to_keep.slice(0, 20)
    last_match.forEach(match => {
        total += match.points
    });
    return total
}

function suppressionMatchMemeJoueur(matchs) {
    player_list = {}
    match_to_keep = []
    matchs.forEach(match => {
        if (player_list[match.adversaire] == undefined) {
            player_list[match.adversaire] = 1
            match_to_keep.push(match)
        } else if (player_list[match.adversaire] < 3) {
            player_list[match.adversaire] += 1
            match_to_keep.push(match)
        }
    });
    return match_to_keep
}

function addNewPLayer(name) {
    new_player = {
        "matchs": [],
        "nom": name
    }
    players.push(new_player)
}


function addMatch(joueurs, match_result, player_total) {

    joueur_1 = joueurs.find(x => x.nom == match_result['joueur_1'])

    joueur_2 = joueurs.find(x => x.nom == match_result['joueur_2'])

    joueur_1.matchs.push({
        "adversaire": joueur_2.nom,
        "points": Math.round(match_result.score_joueur_1 * 5 * calculCoef(joueur_1, joueur_2, player_total)),
        "score": `${match_result.score_joueur_1}-${match_result.score_joueur_2}`
    })

    joueur_2.matchs.push({
        "adversaire": joueur_1.nom,
        "points": Math.round(match_result.score_joueur_2 * 5 * calculCoef(joueur_2, joueur_1, player_total)),
        "score": `${match_result.score_joueur_2}-${match_result.score_joueur_1}`
    })
}

function readFileToJSON(name) {
    return JSON.parse(fs.readFileSync(name, 'utf8'));
}

function writeFileToJSON(name, data) {
    fs.writeFileSync(name, JSON.stringify(data), 'utf8')
}

function calculCoef(player_1, player_2, player_total) {
    return (player_1.rank - player_2.rank + player_total) / player_total
}

module.exports = {
    suppressionMatchMemeJoueur: (matchs) => {
        player_list = {}
        match_to_keep = []
        matchs.forEach(match => {
            if (player_list[match.adversaire] == undefined) {
                player_list[match.adversaire] = 1
                match_to_keep.push(match)
            } else if (player_list[match.adversaire] < 3) {
                player_list[match.adversaire] += 1
                match_to_keep.push(match)
            }
        });
        return match_to_keep
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    refreshDB: (player) => {
        const db = {
            "joueurs": player
        }
        writeFileToJSON("db.json", db)
    },
    calculRank: (players) => {
        players_sorted = players
            .map(x => {
                x.points = calculTotalPoints(x.matchs)
                return x
            })
            .sort((a, b) => a.points > b.points ? -1 : 1)

        current_pts = 0
        last_rank = 1

        players_sorted.forEach((player, index) => {
            if (player.points == current_pts) {
                player.rank = last_rank
            } else {
                player.rank = index + 1
                last_rank = index + 1
                current_pts = player.points
            }

        });
        return players_sorted
    },


    refreshMatchs: (matchs) => {
        if (matchs) {
            matchs.forEach(game => {
                addMatch(player_ranks, game, player_ranks.length)
            });
        }
    },

    refreshMatch: (match) => {
        if (match) {
            addMatch(player_ranks, match, player_ranks.length)
        }
    },

    addNewPlayers: (players, matchPlayed) => {
        if (matchPlayed.length > 0) {
            list_total = []
            list_1 = matchPlayed.map(x => x.joueur_1)
            list_2 = matchPlayed.map(x => x.joueur_2)
            list_total.push(...list_1)
            list_total.push(...list_2)
            player_names = players.map(x => x.nom)
            list_total = Array.from(new Set(list_total))
            new_players = list_total.filter(x => !player_names.includes(x))
            new_players.forEach(new_player => {
                addNewPLayer(new_player)
            });
        }
    },

    getStats: (matchPlayed) => {
        player_mvp = {}
        player_looser = {}
        player_victime = {}
        player_bourreau = {}
        matchPlayed.forEach(match => {
            j1 = match['joueur_1']
            j2 = match['joueur_2']
            s1 = match['score_joueur_1']
            s2 = match['score_joueur_2']
            if (s1 == "2" || s1 == "3"){
                player_mvp[j1] = (player_mvp[j1] ? player_mvp[j1] : 0) + 1
                player_looser[j2] = (player_looser[j2] ? player_looser[j2] : 0) + 1
            }
            else if (s2 == "2" || s2 == "3"){
                player_mvp[j2] = (player_mvp[j2] ? player_mvp[j2] : 0) + 1
                player_looser[j1] = (player_looser[j1] ? player_looser[j1] : 0) + 1
            }
            if (s1 == "3"){
                player_bourreau[j1] = (player_bourreau[j1] ? player_bourreau[j1] : 0) + 1
                player_victime[j2] = (player_victime[j2] ? player_victime[j2] : 0) + 1
            }
            else if (s2 == "3"){
                player_bourreau[j2] = (player_bourreau[j2] ? player_bourreau[j2] : 0) + 1
                player_victime[j1] = (player_victime[j1] ? player_victime[j1] : 0) + 1
            }
        });
        best_mvp = Object.entries(player_mvp).sort((x, y) => y[1] - x[1])[0]
        best_looser = Object.entries(player_looser).sort((x, y) => y[1] - x[1])[0]
        best_bourreau = Object.entries(player_bourreau).sort((x, y) => y[1] - x[1])[0]
        best_victime = Object.entries(player_victime).sort((x, y) => y[1] - x[1])[0]
        console.warn("Plus de victoire", best_mvp);
        console.warn("Plus de défaite", best_looser);
        console.warn("Plus de 3-0", best_bourreau);
        console.warn("Plus de 0-3", best_victime);
    }
}