const Stats = require('../lib/stats');
/*
const INTERVALS = [ 1000, 5 * 1000, 15 * 1000, 60 * 1000, 5 * 60 * 1000 ];

function simulate( interval, samples, min, max )
{
    let end = Date.now(), start = end - interval, tick = ( end - start ) / samples;

    const stats = new Stats( INTERVALS );

    for( let i = 0; i < samples; ++i )
    {
        stats.push( min + Math.random() * ( max - min ), start + i * tick );
    }

    let result = {};

    for( let interval of INTERVALS )
    {
        result[interval] =
        {
            cnt : stats.min( interval ),
            min : stats.min( interval ),
            max : stats.min( interval ),
            avg : stats.min( interval ),
            mdn : stats.min( interval ),
            sum : stats.min( interval )
        }
    }

    console.log( result );
}

simulate( 30 * 1000, 10, 10, 100 );
*/

function simulate(samples, min, max, val_bucket_size, time_bucket_size, history_time, tick, interval)
{
    let start = Date.now()

    const stats = new Stats(history_time, time_bucket_size, val_bucket_size);

    result = {};

    for(let i = 0; i < samples; i++)
    {
        stats.push(min + Math.random() * ( max - min ), start + i * tick - Math.random()*45);
        console.log(stats.buckets/*[stats.pointer].sub*/);
    
        if(i % 7 == 0)
        {    
            result =
            {
                cnt : stats.cnt( interval ),
                min : stats.min( interval ),
                max : stats.max( interval ),
                avg : stats.avg( interval ),
                mdn : stats.mdn( interval ),
                sum : stats.sum( interval )
            };
            console.log(result);
        }
    }

}

simulate(45, 150, 600, 25, 100, 400, 30, 200);
