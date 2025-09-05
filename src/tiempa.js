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