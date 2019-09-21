const assert = require('assert');
const Stats = require('../../lib/stats');

const RUNS = 500;
const INTERVALS =
[
    100 + Math.ceil( Math.random() * 60 * 1000 ),
    200 + Math.ceil( Math.random() * 60 * 10000 ),
    50 + Math.ceil( Math.random() * 60 * 100 )
];

function almostEqual(a, b, precision)
{
  return Math.abs(a - b) < precision;
}
it('should find sum - not expired', function()
{
    for( let run = 0; run < RUNS; ++run )
    {
        let stats = new Stats( INTERVALS ),
            start = Date.now(), time, min = Infinity;
          let sum = 0;

        for( time = start; time < start + INTERVALS[0]; time += Math.ceil( Math.random() * INTERVALS[0] / 1000 ))
        {
            let value = Math.random() * 100;

            sum += value;

            stats.push( value, time );
        }

        assert.ok( almostEqual( sum, stats.sum( INTERVALS[0] ), 0.000000001 ) );
    }
});
