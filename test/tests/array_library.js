const assert = require('assert');
const { SparseBuckets, ArraySegment } = require('../../lib/array');


function initializer( index )
{
    return (
    {
        start  :   index,
        min    :   Infinity,
        max    :   -Infinity,
        cnt    :   0,
        sum    :   0,
        sub    :   []
    });
}

function simple_initializer( index )
{
    return (
        {
          start   :  index,
          values  :  []
        });
}

function default_getter( from, to )
{
    return (
        {
          from,
          to,
          min  :  Infinity,
          max  : -Infinity,
          cnt  :  0,
          sum  :  0
        });
}

function merger( bucket_1, bucket_2 )
{
    return (
        {
            from  :   Math.min( bucket_1.from, bucket_2.from ),
            to    :   Math.max( bucket_1.to, bucket_2.to ),
            min   :   Math.min( bucket_1.min, bucket_2.min ),
            max   :   Math.max( bucket_1.max, bucket_2.max ),
            cnt   :   bucket_1.cnt + bucket_2.cnt,
            sum   :   bucket_1.sum + bucket_2.sum
        });
}

function updateInterval( interval, value )
{
    interval.min > value && ( interval.min = value );
    interval.max < value && ( interval.max = value );
    interval.sum += value;
    ++interval.cnt;
}


describe( "SparseBuckets", () =>
{
    it( "Should store value buckets - without recalculating", () => {
        let bucket_size = 1,
            bucket_count = 5,
            RUNS = 1000;

        let buckets = new SparseBuckets( default_getter, merger, bucket_size, bucket_count);
        let values  = [];

        for(let run = 0; run < RUNS; ++run)
        {
            value = Math.random() * bucket_size * bucket_count;
            values.push(value);
            updateInterval( buckets[ buckets.index( value )] || buckets.init( value ), value );
        }
        values.sort( (a,b) => a - b );
        let actual = buckets.values().sort( (a,b) => a.from - b.from ),
            expected = new Array(bucket_count);

        for(let i = 0; i < bucket_count; ++i)
        {
            expected[ i ] = default_getter( i * bucket_size, ( i + 1 ) * bucket_size );
        }

        for(let value of values)
        {
            updateInterval( expected[ Math.floor( value / bucket_size ) ], value );
        }

        for(let i = 0; i < bucket_count; ++i)
        {
            for(let property of Object.getOwnPropertyNames( expected[ i ] ))
            {
                assert.ok( almostEqual( expected[i][property], actual[i][property] ));
            }
        }

    });
/*
    it( "Should store value buckets - multiple recalculatings", () => {
        let bucket_size = 1,
            bucket_count = 13,
            RUNS = 10000;

        for( let density of [0.001, 1, 10, 100, 1000] )
        {
            let buckets = new SparseBuckets( default_getter, merger, bucket_size, bucket_count);
            let values  = [];

            for(let run = 0; run < RUNS; ++run)
            {
                value = Math.random() * bucket_size * bucket_count * density;
                values.push(value);
                updateInterval( buckets[ buckets.index( value )] || buckets.init( value ), value );
            }
            values.sort( (a,b) => a - b );
            let actual = buckets.values().sort( (a,b) => a.from - b.from ),
                expected = new Array(bucket_count);

            for(let i = 0; i < bucket_count; ++i)
            {
                expected[ i ] = default_getter( i * bucket_size, ( i + 1 ) * bucket_size );
            }

            for(let value of values)
            {
                updateInterval( expected[ Math.floor( value / bucket_size ) ], value );
            }

            for(let i = 0; i < bucket_count; ++i)
            {
                for(let property of Object.getOwnPropertyNames( expected[ i ] ))
                {
                    assert.ok( almostEqual( expected[i][property], actual[i][property] ));
                }
            }
        }

    });
*/
});


describe( "ArraySegment", () =>
{
    let segment_size = 10;
    it('should return default initializer value on new or expired index', function()
    {
        let segment = new ArraySegment( segment_size, initializer );

        assert.deepStrictEqual( initializer(0), segment[0] );

        segment[0].min = 5;

        assert.ok( initializer(0) !== segment[0] );

        assert.deepStrictEqual( initializer(1), segment[1] );

        assert.deepStrictEqual( initializer( segment_size ), segment[ segment_size ] );
        assert.deepStrictEqual( initializer(0), segment[0] );
    });

    it('should store values round robin', () =>
    {
        let RUNS = 1000,
            values = new Array(segment_size),
            segment = new ArraySegment( segment_size, simple_initializer ),
            index = Math.floor( Math.random() * 1000 ) + 10;

        for(let i = 0; i < segment_size; ++i)
        {
            values[ i ] = simple_initializer( index - segment_size + i + 1 )
        }

        for(let run = 0; run < RUNS; ++run)
        {
            let value = Math.random(),
                shift = Math.floor( Math.random() * 2 );

            for(let i = 0; i < shift; ++i)
            {
                values.push( simple_initializer( ++index ) );
            }

            values[ values.length - 1 ].values.push(value);
            segment[ index ].values.push(value);

            for(let i = 0; i < segment_size; ++i)
            {
                assert.deepStrictEqual( segment[ index - i ], values[ values.length - i - 1 ] );
            }
            assert.deepStrictEqual( segment[ index - segment_size ], simple_initializer( index - segment_size ) );
        }


    })
});
