const { randomColor } = require( "../primitives/Misc" );
const { playerNoCollideDelay } = require( "../Settings" );
const Player = require( "../worlds/Player" );
const Cell = require( "./Cell" );
const PlayerCell = require( "./PlayerCell" );
const Minion = require( "../bots/Minion" );
const QuadTree = require( "../primitives/QuadTree" );
const PlayerBot = require( "../bots/PlayerBot" );
const Food = require( "../cells/Food" );
const EjectedCell = require( "../cells/EjectedCell" );
const Mothercell = require( "../cells/Mothercell" );
const Virus = require( "../cells/Virus" );
const Booster = require( "../cells/Booster" );
const ChatChannel = require( "../sockets/ChatChannel" );
const { Router } = require( "express" );
const pepe = false;

class PowerUP extends Cell
{
    TimeToMs ( ttm )
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
    /**
     * @param {World} world
     * @param {number} x
     * @param {number} y
     */
    constructor ( world, x, y )
    {
        const size = world.settings.powerupSize || 50;
        super( world, x, y, size );
        this.powertimer = ( this.TimeToMs( world.settings.powerupDuration ) );
        this.power = Math.floor( Math.random() * 7 ) + 1; // 1..7
        if ( this.power == 1 )
        { this.skin = "PowerupSpeed"; }
        if ( this.power == 2 )
        { this.skin = "Minion"; }
        if ( this.power == 3 )
        { this.skin = "PowerupVirus"; }
        if ( this.power == 4 )
        { this.skin = "PowerupPopsplit"; }
        if ( this.power == 5 )
        { this.skin = "PowerupColor"; }
        if ( this.power == 6 )
        { this.skin = "PowerupShield"; }
        if ( this.power == 7 )
        {
            this.skin = "PowerupMerge"
        }
    }

    get type () { return 2; }
    get isSpiked () { return false; }
    get isAgitated () { return false; }
    get avoidWhenSpawning () { return false; }

    onSpawned ()
    {
        if ( typeof this.world.powerupCount === 'number' ) this.world.powerupCount++;
        /*if ( this.world && this.world.handle && this.world.handle.logger )
            this.world.handle.logger.inform( `powerup spawned at ${ this.x.toFixed( 0 ) }, ${ this.y.toFixed( 0 ) } (type ${ this.power })` );*/
    }

    onRemoved ()
    {
        if ( typeof this.world.powerupCount === 'number' ) this.world.powerupCount--;
    }

    /**
     * Called when eaten by another cell
     * @param {Cell} c
     */
    whenEatenBy ( c )
    {
        const player = c.owner;
        const self = this;
        if ( !player ) return;
        // Aplicar/Acumular powerup en el jugador y notificar al cliente con el tiempo restante
        try {
            if ( player && typeof player.addPowerup === 'function' )
            {
                // crear apply/remove según el tipo
                let applyFn = null, removeFn = null;
                switch ( this.power )
                {
                    case 1: // speed
                        applyFn = function () { player.doublespeed = true; };
                        removeFn = function () { player.doublespeed = false; };
                        break;
                    case 2: // minions
                        applyFn = function () { player.hasMinion = (player.hasMinion || 0) + 1; };
                        removeFn = function () { player.hasMinion = Math.max(0, (player.hasMinion || 1) - 1); };
                        break;
                    case 3: // shoot virus
                        applyFn = function () { player.canShootVirus = true; };
                        removeFn = function () { player.canShootVirus = false; };
                        break;
                    case 4: // popsplit virus
                        applyFn = function () { player.canShootPopsplitVirus = true; };
                        removeFn = function () { player.canShootPopsplitVirus = false; };
                        break;
                    case 5: // color
                        applyFn = function () { player.cellColor = randomColor(); };
                        removeFn = function () { }; // no-op
                        break;
                    case 6: // shield
                        applyFn = function () { player.hasShield = true; };
                        removeFn = function () { player.hasShield = false; };
                        break;
                    case 7: // merge
                        applyFn = function () { player.hasMerge = true; };
                        removeFn = function () { player.hasMerge = false; };
                        break;
                }
                const remaining = player.addPowerup( this.skin || '', this.powertimer, applyFn, removeFn );
                // Notificar al cliente el tiempo restante acumulado
                if ( player.router && player.router.protocol && typeof player.router.protocol.onPowerupActivate === 'function' )
                {
                    player.router.protocol.onPowerupActivate( this.skin || '', remaining );
                }
            }
        } catch ( e ) { /* noop */ }
        if ( this.power === 1 )
        {
            player.doublespeed = true;
            if ( player.router && player.router.send ) this.world.worldChat && this.world.handle && this.world.handle.gamemode && this.world.handle.logger; // noop to quiet lint
            setTimeout( function ()
            {
                player.doublespeed = false;
            }, this.powertimer );
        }

        // Spawn minions
        else if ( this.power === 2 )
        {/** @param {Player} player */
            new Minion( player.router )
            {
                try
                {
                    player.hasMinion = 10;
                    if ( !player.router.isExternal ) return;
                    for ( let i = 0; i < this.owner.hasMinion; i++ )
                        new Minion( player.router );
                }
                catch { }
            }
            setTimeout( function ()
            {
                player.hasMinion = 0;
                let realCount = 0;
                for ( let i = 0; i < player.router.minions.length > 0; i++ )
                {
                    player.router.minions[ 0 ].close();
                    realCount++;
                }
                player.router.listener.globalChat.directMessage( null, player.router, '¡Se acabo el tiempo' );
            }, 30000 );
        }

        // Shoot virus ability
        else if ( this.power === 3 )
        {
            player.canShootVirus = true;
            // Informar al jugador por el canal de chat (no usar router.send con objetos)
            if ( player.router && player.router.listener && player.router.listener.globalChat )
            {
                player.router.listener.globalChat.directMessage( null, player.router, '¡Ahora puedes disparar virus por tiempo limitado!' );
            }
            setTimeout( function ()
            {
                player.canShootVirus = false;
                player.router.listener.globalChat.directMessage( null, player.router, '¡Se acabo el tiempo' );
            }, this.powertimer );
        }

        // One popsplit virus
        else if ( this.power === 4 )
        {
            player.canShootPopsplitVirus = true;
            // Informar al jugador por el canal de chat
            if ( player.router && player.router.listener && player.router.listener.globalChat )
            {
                player.router.listener.globalChat.directMessage( null, player.router, '¡Puedes disparar un virus popsplit!' );
            }
            // Desactivar después de un disparo o tras el tiempo
            setTimeout( function ()
            {
                player.canShootPopsplitVirus = false;
            }, this.powertimer );
        }

        //Change color
        else if ( this.power === 5 )
        {
            player.cellColor = randomColor();
        }

        //Shield
        else if ( this.power === 6 )
        {
            // Activar escudo
            player.hasShield = true;
            if ( player.router && player.router.listener && player.router.listener.globalChat )
            {
                player.router.listener.globalChat.directMessage( null, player.router, '¡Escudo activado por tiempo limitado!' );
            }
            setTimeout( function ()
            {
                player.hasShield = false;
                if ( player.router && player.router.listener && player.router.listener.globalChat )
                {
                    player.router.listener.globalChat.directMessage( null, player.router, 'El escudo ha expirado.' );
                }
            }, this.powertimer );
        }
        else if ( this.power === 7 )
        {
            // Instant Merge
            player.hasMerge = true;
            if ( player.router && player.router.listener && player.router.listener.globalChat )
            {
                player.router.listener.globalChat.directMessage( null, player.router, '¡Merge activado por tiempo limitado!' );
            }
            setTimeout( function ()
            {
                player.hasMerge = false;
                if ( player.router && player.router.listener && player.router.listener.globalChat )
                {
                    player.router.listener.globalChat.directMessage( null, player.router, 'El merge ha expirado.' );
                }
            }, this.powertimer );
        }
    }
}

module.exports = PowerUP;
