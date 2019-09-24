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

const Simulations = [];

it('should simulate values - expired', function()
{
    for( let run = 0; run < RUNS; ++run )
    {
        let stats = new Stats( INTERVALS ),
            full = new FullStats( INTERVALS ),
            start = Math.floor( Date.now() / ( INTERVALS[2] * 1000 )) * ( INTERVALS[2] * 1000 ),
            end = start + 3 * INTERVALS[2] * 1000,
            value = 0;

        for( let time = start; time < end; time += Math.round( Math.random() * INTERVALS[2] / 100 ))
        {
            run === 0 ? ( value = Math.random() * 100 ) : ++value;

            stats.push( value, time );
            full.push( value, time );
        }

        Simulations.push({ stats, full, timestamp: end });
    }
})
.timeout( 60000 );

it('should find min - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            assert.strictEqual( simulation.stats.min( interval, simulation.timestamp ), simulation.full.min( interval, simulation.timestamp ));
        }
    }
})

it('should find max - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            assert.strictEqual( simulation.stats.max( interval, simulation.timestamp ), simulation.full.max( interval, simulation.timestamp ));
        }
    }
});

it('should find cnt - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            assert.strictEqual( simulation.stats.cnt( interval, simulation.timestamp ), simulation.full.cnt( interval, simulation.timestamp ));
        }
    }
});

it('should find sum - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            assert.ok( almostEqual( simulation.stats.sum( interval, simulation.timestamp ), simulation.full.sum( interval, simulation.timestamp ), 0.00001 ));
        }
    }
});

it('should find avg - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            assert.ok( almostEqual( simulation.stats.avg( interval, simulation.timestamp ), simulation.full.avg( interval, simulation.timestamp ), 0.00001 ));
        }
    }
});

it('should find mdn - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            let pMdn = simulation.stats.mdn( interval, simulation.timestamp );
            let fMdn = simulation.full.mdn( interval, simulation.timestamp );

            assert.ok( almostEqual( pMdn, fMdn, 5 ));
        }
    }
})
.timeout( 60000 );

it('should find pMin - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            for( let percentile = 0.05; percentile <= 0.96; percentile += 0.05 )
            {
                let pMin = simulation.stats.pMin( interval, percentile, simulation.timestamp );
                let fMin = simulation.full.pMin( interval, percentile, simulation.timestamp );

                //console.log( interval, percentile, pMin, fMin );

                assert.ok( almostEqual( pMin, fMin, 10 ));
            }
        }
    }
})
.timeout( 60000 );

it('should find pMax - expired', function()
{
    for( let simulation of Simulations )
    {
        for( let interval of INTERVALS )
        {
            for( let percentile = 0.05; percentile <= 0.96; percentile += 0.05 )
            {
                let pMax = simulation.stats.pMax( interval, percentile, simulation.timestamp );
                let fMax = simulation.full.pMax( interval, percentile, simulation.timestamp );

                //console.log( interval, percentile, pMax, fMax );

                assert.ok( almostEqual( pMax, fMax, 10 ));
            }
        }
    }
})
.timeout( 60000 );

it('should clear RAM', function()
{
    for( let simulation of Simulations )
    {
        simulation.full.destroy();
    }
})
