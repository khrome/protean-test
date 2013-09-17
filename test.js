var should = require("should");
var Protean = require("./protean");
var fs = require('fs');
//var Indexed = require('./indexed-set').enableProxyWrapper();

describe('Protean', function(){
    var user1 = {
        name : 'Ed Beggler',
        username : 'robble_rouser',
        referral : 'spamdexed_link_factory',
        product_count : 3
    };
    var assigned;
    
    before(function(done){
        Protean.init(function(){
            done();
        });
    });
    
    it('a set of experiments successfully load', function(done){
        Protean.create('landing', [
            {
                name : 'Sporty Landing Page',
                variant : 'landing/sporty'
            },
            {
                name : 'Intellectual Landing Page',
                variant : 'landing/intellectual'
            },
            {
                name : 'Outsider Landing Page',
                variant : 'landing/outsider'
            }
        ]);
        done();
    });
    
    it('a user is successfully assigned on first assignment', function(done){
        Protean.test('landing', user1, function(assignedValue){
            should.exist(assignedValue);
            assigned = assignedValue;
            done();
        });
    });
    
    it('a user receives the same group on second assignment', function(done){
        Protean.test('landing', user1, function(assignedValue){
            should.exist(assignedValue);
            assignedValue.should.equal(assigned);
            done();
        });
    });
    
    it('user hits are counting', function(done){
        Protean.db.query(
            'SELECT * FROM tests WHERE test = "landing" and variant = "'+assigned+'"',
            {
                name: String,
                test: String,
                variant: String,
                created: String,
                hits: String,
                conversions: String,
                weight: String
            },
            function(rows){
                rows.length.should.equal(1, 'There should only be a single result for this test variant');
                rows[0].hits.should.be.above(0, 'Hits should have registered');
                done();
            }
        );
    });
    
    it('user conversions counting', function(done){
        Protean.convert('landing', assigned, function(){
            Protean.db.query(
                'SELECT * FROM tests WHERE test = "landing" and variant = "'+assigned+'"',
                {
                    name: String,
                    test: String,
                    variant: String,
                    created: String,
                    hits: String,
                    conversions: String,
                    weight: String
                },
                function(rows){
                    rows.length.should.equal(1, 'There should only be a single result for this test variant');
                    rows[0].conversions.should.be.above(0, 'Hits should have registered');
                    done();
                }
            );
        })
    });
    
    it('a user receives a test assignment if criteria matches - SQL', function(done){
        done();
    });
    
    it('a user receives a test assignment if criteria matches - FN', function(done){
        done();
    });
    
    it('a user does not receive a test assignment if criteria does not match - SQL', function(done){
        done();
    });
    
    it('a user does not receive a test assignment if criteria does not match - FN', function(done){
        done();
    });
    
    it('statistics are working', function(done){
        //done();
        Protean.db.query(
            'SELECT * FROM tests WHERE test = "landing"',
            {
                name: String,
                test: String,
                variant: String,
                created: String,
                hits: Number,
                conversions: Number,
                weight: Number
            },
            function(rows){
                rows.forEach(function(row){
                    Protean.db.query('UPDATE tests SET hits="'+(row.hits + Math.floor(Math.random()*8346) +3430)+'", conversions="'+(row.conversions + Math.floor(Math.random()*3430)) +'" WHERE test="'+row.test +'" AND variant="'+row.variant+'"');
                });
                Protean.summary('landing', function(summary){
                    console.log('summary', summary);
                    done();
                });
            }
        );
    });
    
    after(function(done){
         //*
         fs.unlink('/Users/khrome/Dropbox/Code/NPMs/protean-test/test.db', function(status){
            done();
        }); //*/ done();
    });
});