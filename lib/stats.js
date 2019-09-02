module.exports = class Stats
{
    constructor( duration ,time ,value)
    {
        this.duration = duration;
        this.interval = time;
        this.value_int = value;
        this.buckets = [];
    }
    push( value, timestamp = Date.now() )
    {

    }

    cnt( interval )
    {

    }

    min( interval )
    {

    }

    max( interval )
    {

    }

    avg( interval )
    {

    }

    mdn( interval )
    {

    }

    sum( interval )
    {

    }
}
