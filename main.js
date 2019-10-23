fs = require('fs');
tools = require('./index.js');
utils = require('./utils.js');


db_contents = fs.readFileSync('db.json', 'utf8');

db = JSON.parse(db_contents)

players = db["joueurs"]

player_ranks = utils.calculRank(players)


matchPlayed = []

tools.readMatchPlayedSpreadSheet()
//tools.clearMatchPlayedSpreadSheet()


utils.sleep(2000).then(() => {
    utils.addNewPlayers(players, matchPlayed)
    player_ranks = utils.calculRank(players)

    matchPlayed.forEach(match => {
        utils.refreshMatch(match)
        player_ranks = utils.calculRank(players)
    });
    //utils.refreshDB(players)
    tools.writeRankIntoSpreadSheet(player_ranks)
    player_rank_top_cleaned = player_ranks.slice(0, 5).map(x => {
        return {
            nom: x.nom,
            points: x.points,
            rank: x.rank
        }
    })
    console.warn("Le classement à été mis à jour");
    console.warn("Top 5: ", player_rank_top_cleaned);
    
    tools.writeStatsIntoSpreadSheet()
})