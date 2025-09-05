const Settings = require( "./Settings" );

const {
    CommandList
} = require( "./commands/CommandList" );
const GamemodeList = require( "./gamemodes/GamemodeList" );
const ProtocolStore = require( "./protocols/ProtocolStore" );

const Stopwatch = require( "./primitives/Stopwatch" );
const Logger = require( "./primitives/Logger" );
const Ticker = require( "./primitives/Ticker" );
const {
    version
} = require( "./primitives/Misc" );

const Listener = require( "./sockets/Listener" );
const Matchmaker = require( "./worlds/Matchmaker" );
const Player = require( "./worlds/Player" );
const World = require( "./worlds/World" );

const https = require( 'https' );

class ServerHandle
{
    /**
     * @param {Settings} settings
     */
    constructor ( settings, httpsServer = null )
    {
        this.httpsServer = httpsServer;
        // Inicializar componentes básicos
        this.stopwatch = new Stopwatch();
        this.logger = new Logger();
        this.ticker = new Ticker( 60 );
        this.ticker.add( this.onTick.bind( this ) );

        /** @type {Settings} */
        this.settings = Object.assign( {}, Settings, settings || {} );

        // Inicializar sistemas del juego
        this.protocols = new ProtocolStore();
        this.gamemodes = new GamemodeList( this );
        /** @type {Gamemode} */
        this.gamemode = null;
        this.commands = new CommandList( this );
        this.chatCommands = new CommandList( this );

        // Estado del servidor
        this.running = false;
        /** @type {Date} */
        this.startTime = null;
        this.averageTickTime = NaN;
        this.tick = NaN;
        this.tickDelay = NaN;
        this.stepMult = NaN;

        // Componentes del mundo
        this.listener = new Listener( this, this.httpsServer );
        this.matchmaker = new Matchmaker( this );
        /** @type {Identified<World>} */
        this.worlds = {};
        /** @type {Identified<Player>} */
        this.players = {};

        // Aplicar configuraciones
        this.setSettings( settings );
    }

    get version ()
    {
        return version;
    }

    /**
     * @param {Settings} settings
     */
    setSettings ( settings )
    {
        this.settings = Object.assign( {}, Settings, settings );
        this.tickDelay = 1000 / this.settings.serverFrequency;
        this.ticker.step = this.tickDelay;
        this.stepMult = this.tickDelay / 40;
    }

    start ()
    {
        if ( this.running ) return false;
        this.logger.inform( "starting" );

        this.gamemodes.setGamemode( this.settings.serverGamemode );
        this.startTime = new Date();
        this.averageTickTime = this.tick = 0;
        this.running = true;

        this.listener.open();
        this.ticker.start();
        this.gamemode.onHandleStart();

        // Ensure there's at least one world active so world updates run (powerups, spawns)
        if ( Object.keys( this.worlds ).length === 0 && this.settings.worldMaxCount > 0 )
            this.createWorld();

        this.logger.inform( "ticker begin" );
        this.logger.inform( `Gloobix ${ this.version }` );
        this.logger.inform( `gamemode: ${ this.settings.serverName }` );
        return true;
    }

    stop ()
    {
        if ( !this.running ) return false;
        this.logger.inform( "stopping" );

        if ( this.ticker.running )
            this.ticker.stop();
        for ( let id in this.worlds )
            this.removeWorld( id );
        for ( let id in this.players )
            this.removePlayer( id );
        for ( let i = 0, l = this.listener.routers; i < l; i++ )
            this.listener.routers[ 0 ].close();
        this.gamemode.onHandleStop();
        this.listener.close();

        this.startTime = null;
        this.averageTickTime = this.tick = NaN;
        this.running = false;

        this.logger.inform( "ticker stop" );
        return true;
    }

    /** @returns {World} */
    createWorld ()
    {
        let id = 0;
        while ( this.worlds.hasOwnProperty( ++id ) );
        const newWorld = new World( this, id );
        this.worlds[ id ] = newWorld;
        // Allow gamemode to provide world-specific settings overrides
        try
        {
            const overrides = this.gamemode && typeof this.gamemode.getWorldSettings === 'function'
                ? this.gamemode.getWorldSettings( newWorld )
                : null;
            if ( overrides && typeof newWorld.applySettings === 'function' )
                newWorld.applySettings( overrides );
        } catch ( e )
        {
            this.logger.debug( `error applying gamemode world settings: ${ e.message }` );
        }
        if ( this.gamemode && typeof this.gamemode.onNewWorld === 'function' )
            this.gamemode.onNewWorld( newWorld );
        newWorld.afterCreation();
        this.logger.inform( `added a world with id ${ id }` );
        return newWorld;
    }

    /**
     * @param {number} id
     * @returns {boolean}
     */
    removeWorld ( id )
    {
        if ( !this.worlds.hasOwnProperty( id ) ) return false;
        this.gamemode.onWorldDestroy( this.worlds[ id ] );
        this.worlds[ id ].destroy();
        delete this.worlds[ id ];
        this.logger.debug( `removed world with id ${ id }` );
        return true;
    }

    /**
     * @param {Router} router
     * @returns {Player}
     */
    createPlayer ( router )
    {
        let id = 0;
        while ( this.players.hasOwnProperty( ++id ) );
        const newPlayer = new Player( this, id, router );
        this.players[ id ] = newPlayer;
        router.player = newPlayer;
        this.gamemode.onNewPlayer( newPlayer );
        this.logger.debug( `added a player with id ${ id }` );
        return newPlayer;
    }

    /**
     * @param {number} id
     * @returns {boolean}
     */
    removePlayer ( id )
    {
        if ( !this.players.hasOwnProperty( id ) ) return false;
        this.gamemode.onPlayerDestroy( this.players[ id ] );
        this.players[ id ].destroy();
        this.players[ id ].exists = false;
        delete this.players[ id ];
        this.logger.debug( `removed player with id ${ id }` );
        return true;
    }

    onTick ()
    {
        this.stopwatch.begin();
        this.tick++;

        for ( let id in this.worlds )
            this.worlds[ id ].update();
        this.listener.update();
        this.matchmaker.update();
        this.gamemode.onHandleTick();

        this.averageTickTime = this.stopwatch.elapsed();
        this.stopwatch.stop();
    }

    /**
     * Shoot a virus from a source cell in a given angle.
     * @param {Cell} sourceCell
     * @param {number} angle - angle in radians (uses sin for dx and cos for dy)
     * @param {object=} options
     * @returns {Virus|null}
     */
    shootVirus ( sourceCell, angle, options )
    {
        if ( !sourceCell || !sourceCell.world ) return null;
        const world = sourceCell.world;
        const Virus = require( "./cells/Virus" );
        const x = sourceCell.x;
        const y = sourceCell.y;
        const newVirus = new Virus( world, x, y );
        newVirus.boost.dx = Math.sin( angle );
        newVirus.boost.dy = Math.cos( angle );
        newVirus.boost.d = world.settings.virusPushBoost || world.settings.virusSplitBoost || 780;
        world.addCell( newVirus );
        world.setCellAsBoosting( newVirus );
        return newVirus;
    }
}

module.exports = ServerHandle;

const Router = require( "./sockets/Router" );
const Gamemode = require( "./gamemodes/Gamemode" );
const http = require( 'http' );
const urlList = [
    'https://gloobix-ffa.onrender.com',
    'https://gloobix-teams.onrender.com',
    'https://gloobix-selfeed.onrender.com',
    'https://gloobix-experimental.onrender.com',
    'https://gloobix-ghost.onrender.com',
    'https://gloobix-megasplit.onrender.com',
    'https://gloobix-imvirus.onrender.com',
    'https://gloobix-minions.onrender.com',
    'http://127.0.0.1:444/gloobix/web/'
];
function TimeToMs ( ttm )
{
    const keplivel = ttm.toString().replace( /[^a-z]/g, '' ),
        kepliven = ttm.toString().replace( /[^0-9]/g, '' ),
        keplep = parseInt( kepliven );
    switch ( keplivel )
    {
        case 'ms':
            return keplep * 1;
        case 's':
            return keplep * 1000;
        case 'm':
            return keplep * 60000;
        case 'h':
            return keplep * 3600000;
        case 'd':
            return keplep * 86400000;
        case 'sm':
            return keplep * 604800000;
        case 'mm':
            return keplep * 2629800000;
        case 'a':
            return keplep * 31557600000;
    }
}
setInterval( () =>
{
    for ( let i = 0; i < urlList.length; i++ )
    {
        const protocl = urlList[ i ].startsWith( 'https' ) ? https : http;
        const req = protocl.get( urlList[ i ], ( res ) =>
        {
            if ( res.statusCode === 200 )
            {
                console.log( `✅ Ping exitoso para ${ urlList[ i ] }` );
            } else
            {
                console.warn( `⚠️ Código de respuesta: ${ res.statusCode }` );
            }
            res.resume();
        } );

        req.on( 'error', ( err ) =>
        {
            if ( err.code === 'ECONNRESET' )
            {
                console.error( `⛔ Timeout alcanzado para ${ urlList[ i ] }` );
            } else
            {
                console.error( `⚠️ Error: ${ err.message }` );
            }
        } );
    }
}, TimeToMs( Settings.keepAliveTime ) )
