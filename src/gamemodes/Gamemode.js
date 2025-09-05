/** @abstract */
class Gamemode
{
    /** @param {ServerHandle} handle */
    constructor ( handle )
    {
        this.handle = handle;
    }

    /** @returns {number} @abstract */
    static get type () { throw new Error( "Must be overriden" ); }
    /** @returns {number} */
    get type () { return this.constructor.type; }
    /** @returns {string} @abstract */
    static get name () { throw new Error( "Must be overriden" ); }
    /** @returns {string} */
    get name () { return this.constructor.name; }

    /** @virtual */
    onHandleStart () { }
    /** @virtual */
    onHandleTick () { }
    /** @virtual */
    onHandleStop () { }

    /** @param {World} world @virtual */
    canJoinWorld ( world ) { return !world.frozen; }
    /** @param {Player} player @param {World} world @virtual */
    onPlayerJoinWorld ( player, world ) { }
    /** @param {Player} player @param {World} world @virtual */
    onPlayerLeaveWorld ( player, world ) { }

    /** @param {World} world @virtual */
    onNewWorld ( world ) { }
    /** @param {World} world @virtual */
    onWorldTick ( world ) { }
    /** @param {World} world @abstract */
    compileLeaderboard ( world )
    {
        throw new Error( "Must be overriden" );
    }
    /** @param {Connection} connection @abstract */
    sendLeaderboard ( connection )
    {
        throw new Error( "Must be overriden" );
    }
    /** @param {World} world @virtual */
    onWorldDestroy ( world ) { }

    /** @param {Player} player @virtual */
    onNewPlayer ( player ) { }
    /** @param {Player} player @virtual */
    whenPlayerPressQ ( player )
    {
        // If player has powerups related to shooting viruses, use them first
        if ( player.canShootVirus && player.hasWorld && player.ownedCells.length > 0 )
        {
            // shoot a virus from the first owned cell towards mouse
            const cell = player.ownedCells[ 0 ];
            const dx = player.router.mouseX - cell.x;
            const dy = player.router.mouseY - cell.y;
            let d = Math.sqrt( dx * dx + dy * dy );
            if ( d < 1 ) d = 1;
            const angle = Math.atan2( dx / d, dy / d );
            player.handle.shootVirus( cell, angle );
            player.canShootVirus = false; // consume
            return;
        }
        if ( player.canShootPopsplitVirus && player.hasWorld )
        {
            // spawn one PopsplitVirus at a random position near player and consume
            const Popsplit = require( "../cells/PopsplitVirus" );
            // place at player's view center or first cell
            const ownerCell = player.ownedCells.length > 0 ? player.ownedCells[ 0 ] : null;
            const x = ownerCell ? ownerCell.x : player.world.getSafeSpawnPos( player.world.settings.virusSize ).x;
            const y = ownerCell ? ownerCell.y : player.world.getSafeSpawnPos( player.world.settings.virusSize ).y;
            const pv = new Popsplit( player.world, x, y );
            player.world.addCell( pv );
            player.canShootPopsplitVirus = false;
            return;
        }

        player.updateState( 2 );
    }
    /** @param {Player} player @virtual */
    whenPlayerEject ( player )
    {
        if ( !player.hasWorld ) return;
        player.world.ejectFromPlayer( player );
    }
    /** @param {Player} player @virtual */
    whenPlayerSplit ( player )
    {
        if ( !player.hasWorld ) return;
        player.world.splitPlayer( player );
    }
    /** @param {Player} player @param {string} name @param {string} skin @abstract */
    onPlayerSpawnRequest ( player, name, skin )
    {
        throw new Error( "Must be overriden" );
    }
    /** @param {Player} player @virtual */
    onPlayerDestroy ( player ) { }

    /** @param {Cell} cell @virtual */
    onNewCell ( cell ) { }
    /** @param {Cell} a @param {Cell} b @virtual */
    canEat ( a, b ) { return true; }
    /** @param {PlayerCell} cell @virtual */
    getDecayMult ( cell ) { return cell.world.settings.playerDecayMult; }
    /** @param {Cell} cell @virtual */
    onCellRemove ( cell ) { }
}

module.exports = Gamemode;

const ServerHandle = require( "../ServerHandle" );
const World = require( "../worlds/World" );
const Connection = require( "../sockets/Connection" );
const Player = require( "../worlds/Player" );
const Cell = require( "../cells/Cell" );
const PlayerCell = require( "../cells/PlayerCell" );
