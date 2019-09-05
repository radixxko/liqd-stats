const Stats = require('../lib/stats');

const INTERVALS = [ 1000, 5 * 1000, 15 * 1000, 60 * 1000, 5 * 60 * 1000 ];

function simulate( interval, samples, min, max )
{
    let end = Date.now(), start = end - interval, tick = ( end - start ) / samples;

    const stats = new Stats( INTERVALS );

    for( let i = 0; i < samples; ++i )
    {
        stats.push( min + Math.random() * ( max - min ), start + i * tick );
        //console.log(stats.intervals[0]);
    }

    let result = {};

    for( let interval of INTERVALS )
    {
        result[interval] =
        {
            cnt : stats.cnt( interval ),
            min : stats.min( interval ),
            max : stats.max( interval ),
            avg : stats.avg( interval ),
            mdn : stats.mdn( interval ),
            sum : stats.sum( interval ),
            pvl : stats.p_interval( interval, 0.05 )
        }
    }

    console.log( result );
}

simulate( 10000, 200, 10, 100 );

