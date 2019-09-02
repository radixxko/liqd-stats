const Stats = module.exports = class Stats
{
  constructor( schema, options )
  {
    this.schema = JSON.parse( JSON.stringify( schema ) );

    this.total = new Map();
    this.current = new Map();
    this.min = new Map();
    this.max = new Map();
  }

  static get type()
  {
    return { current: 0, aggregated: 1 }
  }

  static get polling()
  {
    return { min: 0, max: 1, avg: 2 }
  }

  set( property, value )
  {
    if( this.schema[property] )
    {
      if( this.schema[property].type === Stats.type.current )
      {
        let min = this.min.get( property ),
            max = this.max.get( property );

        if( min === undefined && min > value )
        {
          this.min.set( property, value );
        }

        if( max === undefined && max < value )
        {
          this.max.set( property, value );
        }

        this.current.set( property, value );
      }
      else{ throw 'Invalid property "' + property + '" type'; }
    }
    else{ throw 'Undefined property "' + property + '"'; }
  }

  inc( property )
  {
    this.add( property, 1 );
  }

  add( property, increment )
  {
    if( this.schema[property] )
    {
      if( this.schema[property].type === Stats.type.aggregated )
      {
        let total = this.total.get( property ) || 0;

        this.total.set( property, total + increment );
      }
      else{ throw 'Invalid property "' + property + '" type'; }
    }
    else{ throw 'Undefined property "' + property + '"'; }
  }

  dump()
  {
    let dump = {};

    for( let property in this.schema )
    {
      if( this.schema[property].type === Stats.type.aggregated )
      {
        dump[property] = this.total.get( property ) || 0;
      }
      else if( this.schema[property].type === Stats.type.current )
      {
        dump[property] = this.current.get( property ) || 0;
      }
    }

    return dump;
  }
}

let stats = new Stats(
{
  cpu:
  {
    type      : Stats.type.current,
    polling   : Stats.polling.avg,
    intervals : 3
  },
  ram:
  {
    type      : Stats.type.current,
    polling   : Stats.polling.max,
    intervals : 3
  },
  threads:
  {
    type      : Stats.type.current,
    polling   : Stats.polling.max,
    intervals : 3
  },
  queries:
  {
    type      : Stats.type.aggregated,
    polling   : Stats.polling.avg,
    intervals : 3
  },
  messages:
  {
    type      : Stats.type.aggregated,
    polling   : Stats.polling.avg,
    intervals : 3
  },
  calls:
  {
    type      : Stats.type.aggregated,
    polling   : Stats.polling.avg,
    intervals : 3
  }
});

console.log( Stats.type.aggregated );

setInterval( () =>
{
  stats.set( 'cpu', Math.random() / 10 );
  stats.set( 'ram', 22 + Math.random() * 4 );
  stats.set( 'threads', 16 );

  if( Math.random() < 0.5 ){ stats.inc( 'queries' ); }
  if( Math.random() < 0.5 ){ stats.inc( 'messages' ); }
  if( Math.random() < 0.5 ){ stats.inc( 'calls' ); }
}
, 100)


setInterval( () => { console.log( stats.dump() ); }, 1000 );
