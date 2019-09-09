const assert = require('assert');
const Stats = require('../../lib/stats');

const INTERVALS =
[
    100 + Math.ceil( Math.random() * 60 * 1000 ),
    200 + Math.ceil( Math.random() * 60 * 10000 ),
    50 + Math.ceil( Math.random() * 60 * 100 )
];

it('should find max - not timeouted', function()
{
    let stats = new Stats( INTERVALS ),
        start = Date.now(), time, min = Infinity;

    for( time = start; time < start + INTERVALS[0]; time += Math.ceil( Math.random() * INTERVALS[0] / 1000 ))
    {
        let value = Math.random() * 100;

        if( value < min ){ min = value; }

        stats.push( value, time );
    }

    assert.strictEqual( min, stats.min( INTERVALS[0] ));
});
