const assert = require('assert');
const Stats = require('../../lib/stats');

const INTERVALS =
[
    100 + Math.ceil( Math.random() * 60 * 1000 ),
    200 + Math.ceil( Math.random() * 60 * 10000 ),
    50 + Math.ceil( Math.random() * 60 * 100 )
];

it('should find min - not timeouted', function()
{
    let stats = new Stats( INTERVALS ),
        start = Date.now(), time, max = -Infinity;

    for( time = start; time < start + INTERVALS[0]; time += Math.ceil( Math.random() * INTERVALS[0] / 1000 ))
    {
        let value = Math.random() * 100;

        if( value > max ){ max = value; }

        stats.push( value, time );
    }

    assert.strictEqual( max, stats.max( INTERVALS[0] ));
});
