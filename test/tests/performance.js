const assert = require('assert');
const Stats = require('../../lib/stats');

const INTERVALS =
[
    30 * 60,
    5 * 60,
    60,
    10,
    1
];

it('should have good performance for 1,000,000 entries', function()
{
    let stats = new Stats( INTERVALS ), start = Date.now();

    for( let time = start; time < start + 1000000; ++time )
    {
        stats.push( time, time );
    }
})
.timeout( 60000 );
