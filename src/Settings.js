const fs = require( "fs" );
const skiki = fs.readFileSync( __dirname + "/txt/skinList.txt", "utf-8" ).split( "," );
const value = Object.seal( {
    httpServer: null, // Para almacenar el servidor HTTP
    listenerForbiddenIPs: [],
    listenerAcceptedOrigins: [],
    listenerMaxConnections: 50,
    listenerMaxClientDormancy: 1000 * 60,
    listenerMaxConnectionsPerIP: 10,
    listeningPort: 443,
    keepAliveTime: 13 + 'm',

    //server
    serverFrequency: 15,
    serverName: "FFA",
    serverGamemode: "FFA",

    //chat
    chatEnabled: true,
    chatFilteredPhrases: fs.readFileSync( __dirname + "/txt/badwords.txt", "utf-8" ).split( ", " ),
    playerCensoredNames: fs.readFileSync( __dirname + "/txt/badwords.txt", "utf-8" ).split( ", " ),
    chatCooldown: 1 + 's',

    //world
    worldMapX: 0,
    worldMapY: 0,
    worldMapW: 9071,
    worldMapH: 9071,
    worldFinderMaxLevel: 16,
    worldFinderMaxItems: 16,
    worldSafeSpawnTries: 64,
    worldSafeSpawnFromEjectedChance: 0,
    worldPlayerDisposeDelay: 500,
    worldEatMult: 1.140175425099138,
    worldEatOverlapDiv: 3,
    worldPlayerBotsPerWorld: 48,
    worldPlayerBotNames: fs.readFileSync( __dirname + "/txt/botnames.txt", "utf-8" ).split( "," ),
    worldPlayerBotSkins: fs.readFileSync( __dirname + "/txt/skinList.txt", "utf-8" ).split( "," ),
    worldMinionsPerPlayer: 0,
    worldMaxPlayers: 50,
    worldMinCount: 0,
    worldMaxCount: 1,
    matchmakerNeedsQueuing: false,
    matchmakerBulkSize: 1,

    //minion
    minionName: "Minion",
    minionSpawnSize: 32,
    minionEnableERTPControls: true,
    minionEnableQBasedControl: true,

    //food
    foodMinSize: 20,
    foodMaxSize: 50,
    foodGrowTicks: 25 * 60,
    foodCount: 2400,

    //virus
    virusMinCount: 30,
    virusMaxCount: 90,
    virusSize: 100,
    virusFeedTimes: 7,
    virusPushing: false,
    virusSplitBoost: 780,
    virusPushBoost: 120,
    virusMonotonePops: true,

    //booster
    boosterMinCount: 6,
    boosterMaxCount: 8,
    boosterSize: 90,
    boosterFeedTimes: 7,
    boosterPushing: true,
    boosterSplitBoost: 780,
    boosterPushBoost: 120,
    boosterMassGiven: 300,

    // powerups
    powerupMinCount: 200,
    powerupMaxCount: 400,
    powerupSize: 70,
    powerupDuration: 20 + 's',

    //eject
    ejectedSize: 40,
    ejectingLoss: 43,
    ejectDispersion: 0.3,
    ejectedCellBoost: 780,

    //mother
    mothercellSize: 149,
    mothercellCount: 0,
    mothercellPassiveSpawnChance: 0,
    mothercellActiveSpawnSpeed: 1,
    mothercellFoodBoost: 90,
    mothercellMaxFoods: 96,
    mothercellMaxSize: 65535,

    //player
    playerRoamSpeed: 22,
    playerRoamViewScale: 0.4,
    playerViewScaleMult: 1,
    playerMinViewScale: 0,
    playerMaxNameLength: 24,
    playerAllowSkinInName: true,
    playerMinSize: 32,
    playerSpawnSize: 110,
    playerMaxSize: 1500,
    playerMinSplitSize: 60,
    playerMinEjectSize: 60,
    playerSplitCap: 255,
    playerEjectDelay: 1 + 'ms',
    playerMaxCells: 28,
    playerMoveMult: 1,
    playerSplitSizeDiv: 1.414213562373095,
    playerSplitDistance: 60,
    playerSplitBoost: 780,
    playerNoCollideDelay: 13 + 'ms',
    playerNoMergeDelay: 0.5,
    playerMergeVersion: "new",
    playerMergeTime: 15 + 'ms',
    playerMergeTimeIncrease: 0 + 'ms',
    playerDecayMult: 0.001
} );

module.exports = value;
