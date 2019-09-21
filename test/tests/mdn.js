'use strict'
const assert = require('assert');
const Stats = require('../../lib/stats');

function almostEqual(a, b, precision)
{
  return Math.abs(a - b) < precision;
}

const RUNS = 500;
const INTERVALS =
[
    100 + Math.ceil( Math.random() * 60 * 1000 ),
    200 + Math.ceil( Math.random() * 60 * 10000 ),
    50 + Math.ceil( Math.random() * 60 * 100 )
];

it('should find mdn - not expired', function()
{
    for( let run = 0; run < RUNS; ++run )
    {

        let stats = new Stats( INTERVALS ),
            start = Date.now(), time, count = 0,
            values = new Array();

        for( time = start; time < start + INTERVALS[0]; time += Math.ceil( Math.random() * INTERVALS[0] / 100 ))
        {
            let value = Math.random() * 100;
            values.push(value);
            ++count;

            stats.push( value, time );
        }

        values.sort( (a,b) => a - b );
        assert.ok( almostEqual( values[Math.floor(count * 0.5)],
                                stats.mdn( INTERVALS[0] ),
                                stats.value_interval / 2));
    }
});
