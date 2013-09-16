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
            console.log('bin', assignedValue);
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
        Protean.test('landing', user1, function(assignedValue){
            should.exist(assignedValue);
            assignedValue.should.equal(assigned);
            done();
        });
    });
    
    it('user conversions counting', function(done){
        done();
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
        done();
    });
    
    after(function(done){
         fs.unlink('/Users/khrome/Dropbox/Code/NPMs/protean-test/test.db', function(status){
            done();
        });
    });
});