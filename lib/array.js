module.exports.SparseBuckets = class SparseBuckets extends Array
{
    constructor( default_getter, merge_func, starting_bucket_size = 10, max_bucket_count = 100, ...args )
    {
        super( ...args );

        this.bucket_size = starting_bucket_size;

        this._default_getter = default_getter;
        this.indexes = [];
        this.max_size = max_bucket_count;

        this._merge_func = merge_func;


    }

    index( value ) // 0 - 2**32-2
    {
        return Math.floor( value / this.bucket_size );
    }

    init( value )
    {

        if(this.indexes.length >= this.max_size)
        {
          this.recalculate()
        }

        let index = this.index( value );

        this.indexes.push( index ); // TODO sort indexes by value to increase performance

        return this[ index ] = this._default_getter( index * this.bucket_size, ( index + 1 ) * this.bucket_size );
    }

    values()
    {
        return this.indexes.map( i => this[ i ]);
    }

    recalculate()
    {
        this.indexes = this.indexes.filter( (item, index) => this.indexes.indexOf(item) === index ); //// TODO: duplicate indexes occurs and I don't know why yet!!! Might cause or be caused by some bug

        let indexes = this.indexes,
            new_indexes = [];
        indexes.sort( (a,b) => a - b );

        for(let i = 0; i < indexes.length; i++)
        {
            if( indexes[ i ] % 2 === 0 )
            {
                if( indexes[ i ] + 1 === indexes[ i+1 ] )
                {
                    this[ indexes[ i ] / 2 ] = this._merge_func( this[ indexes[ i ]], this[ indexes[ i + 1 ]]);
                    delete this[ indexes ];
                    delete this[ indexes[ i + 1 ]];
                    ++i;
                }
                else
                {
                    let from = this[ indexes[ i ]].to,
                        to   = this[ indexes[ i ]].to + this.bucket_size;

                    this[ indexes[ i ] / 2 ] = this._merge_func( this[ indexes[ i ]], this._default_getter( from, to ) );
                    delete this[ indexes[ i ]];
                }
            }

            else
            {
                let to = this[ indexes[ i ]].from;
                let from = to - this.bucket_size;

                new_indexes.push( indexes[ i ] - 1 );
                this[ ( indexes[ i ] - 1 ) / 2 ] = this._merge_func( this._default_getter( from, to ), this[ indexes[ i ]]);
                delete this[ indexes[ i ]];
            }
        }

        this.indexes = this.indexes.concat( new_indexes ).sort( (a,b) => a - b );

        for (let i = 0; i < this.indexes.length; ++i)
        {
            if( this.indexes[i] % 2 === 1)
            {
                this.indexes.splice( i, 1 );
                --i;
            }
            else
            {
                this.indexes[i] = Math.floor( this.indexes[i] / 2 );
            }
        }

        this.bucket_size *= 2;
    }
};

module.exports.ArraySegment = new Proxy( Object,
{
    construct( target, args )
    {
        return new Proxy(
        {
            segment     : new Array( args[0] ),
            initializer : args[1],
            index       : -1
        },
        {
            get: function( target, property )
            {
                if( target.index == property )
                {
                    return target.segment[ target.index % target.segment.length ];
                }
                else
                {
                    let index = parseInt( property );

                    if( index <= target.index - target.segment.length )
                    {
                        return target.initializer( index );
                    }
                    else
                    {
                        if( index > target.index )
                        {
                            for( let i = Math.max( index - target.segment.length, target.index + 1 ); i <= index; ++i )
                            {
                                target.segment[ i % target.segment.length ] = target.initializer( i );
                            }

                            target.index = index;
                        }

                        return target.segment[ index % target.segment.length ];
                    }
                }
            }
        });
    }
});
