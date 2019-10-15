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
    console.warn(player_ranks);
    //utils.refreshDB(players)
    tools.writeRankIntoSpreadSheet(player_ranks)
})

