var Protean = {};

var sqlite = require('dblite');
var db = sqlite('test.db');
Protean.init = function(callback){
    var count = 0;
    var startJob = function(){ count++; };
    var finishJob = function(){
        count--;
        if(count == 0) callback();
    }
    startJob();
    db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='tests'", function(results){
        if(!results.length) db.query(
            'CREATE TABLE tests ('+
                'name TEXT NOT NULL,'+
                'test TEXT NOT NULL,'+
                'variant TEXT NOT NULL,'+
                'created NUMERIC DEFAULT CURRENT_TIMESTAMP,'+
                'hits NUMERIC DEFAULT 0,'+
                'conversions NUMERIC DEFAULT 0,'+
                'weight NUMERIC DEFAULT 1'+
            ')', 
            function(){
                finishJob();
            }
        );
        finishJob();
    });
    db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='bins'", function(results){
        if(!results.length) db.query(
            'CREATE TABLE bins ('+
                'requestor TEXT NOT NULL,'+
                'test TEXT NOT NULL,'+
                'variant TEXT NOT NULL'+
            ')', 
            function(){
                finishJob();
            }
        );
        finishJob();
    });
}

/*function chiSquared(a, b, c, d){
    var e = a * d - b * c;
    return ( e * e * ( a + b + c + d) ) / ( (a + b) * (c + d) * (b + d) * (a + c) );
}*/

function confidenceInterval(conversionRate, trialCount){
    var cvr = conversionRate * (1 - conversionRate);
    return sqrt( cvr / trialCount );
}

function cr(t){ 
    return t[1] / t[0]; 
}

function zscore(c, t){
    var z = cr(t) - cr(c);
    var s = (cr(t) * (1 - cr(t))) / t[0] + (cr(c) * (1 - cr(c))) / c[0];
    return z / sqrt(s);
}

function cumulativeNormalDistribution($x){
    var b1 =  0.319381530;
    var b2 = -0.356563782;
    var b3 =  1.781477937;
    var b4 = -1.821255978;
    var b5 =  1.330274429;
    var p  =  0.2316419;
    var c  =  0.39894228;
    
    if(x >= 0.0) {
        t = 1.0 / ( 1.0 + p * x );
        return (1.0 - c * exp( - x * x / 2.0 ) * t *
            ( t *( t * ( t * ( t * b5 + b4 ) + b3 ) + b2 ) + b1 ));
    }else{
        t = 1.0 / ( 1.0 - p * x );
        return ( c * exp( - x * x / 2.0 ) * t *
            ( t *( t * ( t * ( t * b5 + b4 ) + b3 ) + b2 ) + b1 ));
    }
}

function ssize(conv){
    var a = 3.84145882689; 
    var res = [];
    var bs = [0.0625, 0.0225, 0.0025];
    bs.forEach(function(b){
        res.push( Math.floor( (1-conv) * a / (b * conv) ) );
    });
    return res;
}

function confidenceToWin($base, $version){
    return cumulativeNormalDistribution(zscore( 
        [base['hits'], base['conversions']], 
        [version['hits'], version['conversions']] 
    ));
}

function percentImprovement(base, version){
    return ((version['improvement'] / base['improvement']) -1);
}

Protean.cache = false; //do we want to cache tests or always load them fresh

Protean.qualifies = function(id, requestor, callback){
    return true;
};

Protean.tests = function(test, requestor){
    
};

Protean.test = function(id, requestor, callback){
    Protean.group(id, requestor, function(group){
        callback(group.variant);
    });
};

Protean.create = function(id, variants, callback){
    var count = 0;
    var startJob = function(){ count++; };
    var finishJob = function(){
        count--;
        if(count == 0) callback();
    }
    variants.forEach(function(variant){
        startJob();
        if(!variant.test) variant.test = id;
        Protean.variant(variant, function(){
            finishJob();
        });
    });
};

Protean.variant = function(variant, callback){
    db.query(
        'INSERT INTO tests(name, test, variant) VALUES (?, ?, ?)',
        [variant.name, variant.test, variant.variant],
        function(){
            callback();
        }
    );
};

Protean.convert = function(id, variant, callback){
    db.query(
        'SELECT * FROM tests WHERE test = :test AND variant = :variant',
        {
            test: id,
            variant: variant
        },
        {
            test: String,
            value: String
        },
        function(rows){
            if(rows[0]){
                var variant = rows[0];
                variant.hits++;
                db.query(
                    'UPDATE hits=? WHERE test=? AND variant=?',
                    [variant.hits, variant.test, variant.variant],
                    function(){
                        callback();
                    }
                );
            } //add error handling
        }
    );
};

Protean.hit = function(id, variant, callback){
    db.query(
        'SELECT * FROM tests WHERE test = :test AND variant = :variant',
        {
            test: id,
            variant: variant
        },
        {
            test: String,
            value: String
        },
        function(rows){
            if(rows[0]){
                var variant = rows[0];
                variant.conversions++;
                db.query(
                    'UPDATE conversions=? WHERE test=? AND variant=?',
                    [variant.conversions, variant.test, variant.variant],
                    function(){
                        callback();
                    }
                );
            } //add error handling
        }
    );
};

Protean.requestorIdentifier = 'username';

Protean.group = function(id, requestor, callback){
    db.query(
        'SELECT * FROM bins WHERE test = "'+id+'" AND requestor = "'+requestor[Protean.requestorIdentifier]+'"',
        {
            requestor: String,
            test: String,
            variant: String
        },
        function(rows){
            if(rows[0]){ //assigned
                callback(rows[0]);
            }else{ //unassigned
                Protean.variants(id, function(variants){
                    var total = 0;
                    variants.forEach(function(variant){
                        total += (variant.weight || 1);
                    });
                    var index = Math.floor(Math.random()*total+1);
                    var selected;
                    var position = 0;
                    variants.forEach(function(variant){
                        if(selected) return;
                        position = position + (variant.weight || 1);
                        if(position >= index) selected = variant;
                    });
                    if(!selected) throw new Error('could not assign group!');
                    db.query(
                        'INSERT INTO bins(requestor, test, variant) VALUES (?, ?, ?)',
                        [requestor[Protean.requestorIdentifier], selected.test, selected.variant]
                    );
                    callback(selected);
                });
            }
        }
    );
};

Protean.variants = function(id, callback){
    db.query(
        'SELECT * FROM tests WHERE test = "'+id+'"',
        {
            name: String,
            test: String,
            variant: String
        },
        function(rows){
            callback(rows || []);
        }
    );
};

Protean.summary = function(id, query, callback){ //get aggregate values
    
};

Protean.passthru = function(id, requestor, passthru, conditions){
    if(Protean.cache === true) Protean.cache = {};
    if(Protean.qualifies(id, requestor)){
        Protean.test(id, requestor, function(testID){
            passthru(testID);
        });
    }else passthru(id);
}

module.exports = Protean;