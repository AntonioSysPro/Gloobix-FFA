const Cell = require( "./Cell" );
const Food = require( "./Food" );

/**
 * @implements {Spawner}
 */
class Mothercell extends Cell
{
    /**
     * @param {World} world
     */
    constructor ( world, x, y )
    {
        const size = world.settings.mothercellSize;
        super( world, x, y, size, 0xCE6363 );

        this.foodCount = 0;
        this.activeFoodFormQueue = 0;
        this.passiveFoodFormQueue = 0;
    }

    get type () { return 4; }
    get isSpiked () { return true; }
    get isAgitated () { return false; }
    get avoidWhenSpawning () { return true; }

    /**
     * @param {Cell} other
     * @returns {CellEatResult}
     */
    getEatResult ( other ) { return 0; }

    onTick ()
    {
        const settings = this.world.settings;
        const mothercellSize = settings.mothercellSize;
        const foodSize = settings.foodMinSize;
        const minSpawnSqSize = mothercellSize * mothercellSize + foodSize * foodSize;

        this.activeFoodFormQueue += settings.mothercellActiveSpawnSpeed * this.world.handle.stepMult;
        this.passiveFoodFormQueue += Math.random() * settings.mothercellPassiveSpawnChance * this.world.handle.stepMult;

        while ( this.activeFoodFormQueue > 0 )
        {
            if ( this.squareSize > minSpawnSqSize )
                this.spawnFood(), this.squareSize -= foodSize * foodSize;
            else if ( this.size > mothercellSize )
                this.size = mothercellSize;
            this.activeFoodFormQueue--;
        }
        while ( this.passiveFoodFormQueue > 0 )
        {
            if ( this.foodCount < settings.mothercellMaxFoods )
                this.spawnFood();
            this.passiveFoodFormQueue--;
        }
    }
    spawnFood ()
    {
        const angle = Math.random() * 2 * Math.PI;
        const x = this.x + this.size * Math.sin( angle );
        const y = this.y + this.size * Math.cos( angle );
        const food = new Food( this.world, this, x, y );
        food.boost.dx = Math.sin( angle );
        food.boost.dy = Math.cos( angle );
        const d = this.world.settings.mothercellFoodBoost;
        food.boost.d = d / 2 + Math.random() * d / 2;
        this.world.addCell( food );
        this.world.setCellAsBoosting( food );
    }

    onSpawned ()
    {
        this.world.mothercellCount++;
    }
    whenAte ( cell )
    {
        super.whenAte( cell );
        this.size = Math.min( this.size, this.world.settings.mothercellMaxSize );
    }
    /**
     * @param {Cell} cell
     */
    whenEatenBy ( cell )
    {
        super.whenEatenBy( cell );
        if ( cell.type === 0 ) this.world.popPlayerCell( cell );
    }
    onRemoved ()
    {
        this.world.mothercellCount--;
    }
}

module.exports = Mothercell;

const World = require( "../worlds/World" );
