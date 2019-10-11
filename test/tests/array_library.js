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
function index( value, bucket_size = 1, bucket_count = 10 ) // 0 - 2**32-2
{
    if(value >= 0)
    {
        return Math.floor( value / bucket_size) + bucket_count / 2;
    }
    else
    {
        return bucket_count / 2 - Math.floor( (-1) * value / bucket_size ) - 1;
    }
}


function simple_initializer( index )
{
    return (
        {
          start   :  index,
          values  :  []
        });
}

function default_getter( from, to, bucket, current )
{
    return current ? Object.assign( current,
    {
        min : Math.min( bucket.min, current.min ),
        max : Math.max( bucket.max, current.max ),
        cnt : bucket.cnt + current.cnt,
        sum : bucket.sum + current.sum
    }) :
    ({
        from, to,
        min : bucket ? bucket.min : Infinity,
        max : bucket ? bucket.max : -Infinity,
        cnt : bucket ? bucket.cnt : 0,
        sum : bucket ? bucket.sum : 0
    })
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
            bucket_count = 10,
            RUNS = 100;
        for(let test of [0,1])
        {
            let buckets = new SparseBuckets( default_getter, bucket_size, bucket_count);
            let values  = [];

            for(let run = 0; run < RUNS; ++run)
            {
                value = test ? (run - RUNS / 2 ) * ( bucket_count - 1 ) / RUNS : ( Math.random() - 0.5 ) * bucket_size * bucket_count;
                values.push(value);
                updateInterval( buckets[ buckets.index( value )] || buckets.init( value ), value );
            }
            values.sort( (a,b) => a - b );
            let actual = buckets.values().sort( (a,b) => a.from - b.from ),
                expected = new Array(bucket_count);

            for(let i = 0; i < bucket_count; ++i)
            {
                expected[ i ] = default_getter( ( i - bucket_count / 2 ) * bucket_size, ( i - bucket_count / 2 + 1) * bucket_size );
            }

            for(let value of values)
            {
                updateInterval( expected[ index( value, bucket_size, bucket_count ) ], value );
            }

            for(let i = 0,j = 0; i < bucket_count; ++i,++j)
            {
                while(expected[i].cnt === 0){++i};
                //console.log(expected[i], actual[j])
                for(let property of Object.getOwnPropertyNames( expected[ i ] ))
                {
                    assert.ok( almostEqual( expected[i][property], actual[j][property] ));
                }
            }
        }
    });

    it( "Should store value buckets - multiple recalculatings", () => {
        let bucket_size = 1,
            bucket_count = 10,
            RUNS = 1000;

        for(let test of [0,1])
        {
            for( let density of [1, 2**3, 2**5, 2**10] )
            {
                let buckets = new SparseBuckets( default_getter, bucket_size, bucket_count);
                let values  = [];

                for(let run = 0; run < RUNS; ++run)
                {
                    value = test ? density * ( run - RUNS / 2 ) * ( bucket_count - 1 ) / RUNS : ( Math.random() - 0.5 ) * bucket_size * bucket_count * density;
                    values.push(value);
                    updateInterval( buckets[ buckets.index( value )] || buckets.init( value ), value );
                }
                values.sort( (a,b) => a - b );
                let actual = buckets.values().sort( (a,b) => a.from - b.from ),
                    expected = new Array(bucket_count);

                for(let i = 0; i < bucket_count; ++i)
                {
                    expected[ i ] = default_getter( ( i - bucket_count / 2 ) * buckets.bucket_size, ( i - bucket_count / 2 + 1) * buckets.bucket_size );
                }

                for(let value of values)
                {
                    updateInterval( expected[ index( value, buckets.bucket_size, bucket_count ) ], value );
                }

                for(let i = 0,j = 0; i < bucket_count; ++i,++j)
                {
                    while(expected[i].cnt === 0){++i};
                    //console.log(expected[i], actual[j])
                    for(let property of Object.getOwnPropertyNames( expected[ i ] ))
                    {
                        assert.ok( almostEqual( expected[i][property], actual[j][property] ));
                    }
                }
            }
        }
    });

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
