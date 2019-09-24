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

let stats = new Stats( INTERVALS );

it('should return undefined for empty min', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.min( interval ));
    }

    assert.deepStrictEqual( undefined, stats.min( 0 ));
});

it('should return undefined for empty max', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.max( interval ));
    }

    assert.deepStrictEqual( undefined, stats.max( 0 ));
});

it('should return 0 for empty cnt', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( 0, stats.cnt( interval ));
    }

    assert.deepStrictEqual( 0, stats.cnt( 0 ));
});

it('should return undefined for empty sum', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.sum( interval ));
    }

    assert.deepStrictEqual( undefined, stats.sum( 0 ));
});

it('should return undefined for empty avg', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.avg( interval ));
    }

    assert.deepStrictEqual( undefined, stats.avg( 0 ));
});

it('should return undefined for empty mdn', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.mdn( interval ));
    }

    assert.deepStrictEqual( undefined, stats.mdn( 0 ));
});

it('should return undefined for empty pMin', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.pMin( interval, 0.9 ));
    }

    assert.deepStrictEqual( undefined, stats.pMin( 0, 0.9 ));
});

it('should return undefined for empty pMax', function()
{
    for( let interval of INTERVALS )
    {
        assert.deepStrictEqual( undefined, stats.pMax( interval, 0.9 ));
    }

    assert.deepStrictEqual( undefined, stats.pMax( 0, 0.9 ));
});

it('should return exact value for single item mdn, pMax, pMin', function()
{
    for( let interval of INTERVALS )
    {
        let stats = new Stats( INTERVALS ),
            start = Math.floor( Date.now() / ( interval * 1000 )) * ( interval * 1000 ),
            end = start + interval * 1000;

        stats.push( 42, start );

        assert.deepStrictEqual( 42, stats.mdn( interval, end ));
        //assert.deepStrictEqual( 42, stats.pMin( interval, 0.9, end ));
        assert.deepStrictEqual( 42, stats.pMax( interval, 0.9, end ));
    }
});
