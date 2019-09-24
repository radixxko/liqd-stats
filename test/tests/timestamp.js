const assert = require('assert');
const Stats = require('../../lib/stats');
const FullStats = require('../helpers/full_stats');

const RUNS = 5;
const INTERVALS =
[
    50 + Math.ceil( Math.random() * 25 ),
    100 + Math.ceil( Math.random() * 50 ),
    200 + Math.ceil( Math.random() * 100 )
];

it('should use current timestamp', function()
{
    let stats = new Stats( INTERVALS );

    stats.push( 42 );

    for( let interval of INTERVALS )
    {
        stats.min( interval );
        stats.max( interval );
        stats.cnt( interval );
        stats.sum( interval );
        stats.avg( interval );
        stats.mdn( interval );
        stats.pMin( interval, 0.9 );
        stats.pMax( interval, 0.9 );
    }
});
