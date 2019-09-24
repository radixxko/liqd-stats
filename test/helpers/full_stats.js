'use strict';

module.exports = class FullStats
{
    constructor( polling_intervals, precision = 0.1 )
    {
        this.cache = new Map();
        this.interval_index = polling_intervals.reduce(( o, i, n ) => ( o[i] = n, o ), {});
        this.polling_intervals = polling_intervals.map( interval_s => (
        {
            interval        : interval_s * 1000,
            precision       : precision,
            time_intervals  : new Map()
        }));
    }

    push( value, timestamp )
    {
        for( let polling_interval of this.polling_intervals )
        {
            let index = Math.floor( timestamp / ( polling_interval.interval * polling_interval.precision ));
            let time_interval = polling_interval.time_intervals.get( index );

            if( !time_interval )
            {
                polling_interval.time_intervals.set( index, time_interval = []);
            }

            time_interval.push( value );
        }
    }

    * _time_iterator( polling_interval, timestamp )
    {
        if( this.interval_index.hasOwnProperty( polling_interval ))
        {
            let interval = this.polling_intervals[ this.interval_index[ polling_interval ]],
                current = Math.floor( timestamp / ( interval.interval * interval.precision ));

            for( let i = current - Math.round( 1 / interval.precision ); i < current; ++i )
            {
                if( interval.time_intervals.has( i ))
                {
                    yield interval.time_intervals.get( i );
                }
            }
        }
    }

    _nth_value( polling_interval, timestamp , percentile, direction = 1 )
    {
        let values = this.cache.get( polling_interval + ':' + timestamp + ':' + direction );

        if( !values )
        {
            values = [];

            for( let time_interval of this._time_iterator( polling_interval, timestamp ))
            {
                for( let value of time_interval )
                {
                    values.push( value );
                }
            }

            this.cache.set( polling_interval + ':' + timestamp + ':' + direction, values.sort(( a, b ) => direction * ( a - b )));
        }

        return values.length ? values[Math.floor( values.length * percentile - 0.0000000001 )] : undefined;
    }

    min( polling_interval, timestamp )
    {
        let min = Infinity;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            for( let value of time_interval )
            {
                min > value && ( min = value );
            }
        }

        return min !== Infinity ? min : undefined;
    }

    max( polling_interval, timestamp )
    {
        let max = -Infinity;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            for( let value of time_interval )
            {
                max < value && ( max = value );
            }
        }

        return max !== -Infinity ? max : undefined;
    }

    cnt( polling_interval, timestamp )
    {
        let cnt = 0;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            for( let value of time_interval )
            {
                ++cnt;
            }
        }

        return cnt;
    }

    sum( polling_interval, timestamp )
    {
        let sum = 0;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            for( let value of time_interval )
            {
                sum += value;
            }
        }

        return sum;
    }

    avg( polling_interval, timestamp )
    {
        let sum = 0, cnt = 0;

        for( let time_interval of this._time_iterator( polling_interval, timestamp ))
        {
            for( let value of time_interval )
            {
                sum += value;
                ++cnt;
            }
        }

        return cnt ? sum / cnt : undefined;
    }

    mdn( polling_interval, timestamp )
    {
        return this._nth_value( polling_interval, timestamp , 0.5 );
    }

    pMin( interval, percentile, timestamp = getTimestamp())
    {
        return this._nth_value( interval, timestamp, percentile, -1 );
    }

    pMax( interval, percentile, timestamp = getTimestamp())
    {
        return this._nth_value( interval, timestamp, percentile );
    }

    destroy()
    {
        this.cache = null;
        this.polling_intervals = null;
    }
}
