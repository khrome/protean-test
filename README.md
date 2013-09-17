protean.js
==========
A wrapper for administering and measuring AB tests at any place in the stack using zscore probability. Rather than trying to be a one stop solution for both content and grouping and measurement, it just handles the binning of a user into a test group and the transformation of the incoming id into the tested id (ids could be routes, file paths, or any other simple value).

A word of caution: You must show both patience and restraint when testing and acknowledge outside factors, such as publicity, traffic, slanted demographics due to a mometary marketing campaign, etc. It's very easy to fool yourself once the graphs feel like they're moving towards a conclusion. 
    
Creating Tests:
---------------

You simply pass in a test set:

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

Strategies for Use:
-------------------

1. Route Testing
Sometimes you want your tests to be simple routes substitutions which allow the view to be swapped wholesale with another, in a controller oriented framework this means triggering a different controller. Whereas in a View oriented framework, the render implies the controller, so you start from the view. Either way, it works like a charm.
    1. Controller Oriented:
        //we assume a 'user' object and a clean 'path' variable and a 'controller_root'
        Protean.passthru(path, user, function(testedPath){
            //this file becomes the resolved controller for the test
            eval(controller_root+path+'.js');
            // or you could isolate the controllers by using vm.runInNewContext()
        });
    2. View Oriented:
        //we assume a 'user', 'data' and 'response' object, a clean 'path' variable and a 'Renderer' object
        Protean.passthru(path, user, function(testedPath){
            Renderer.render(testedPath, data, function(renderedText){
                response.end(renderedText);
            });
        });
2. Template Testing
Often views are broken down into templates, which are rendered and aggregated from within some monolithic controller. You can invert this relationship by linking controller execution to the view by adding a macro to your template language to render a subpanel, and conditionally include the controller for data loading.
Examples to come
3. Database Testing
You could also store variants in a DB, so that the DB configuration becomes the control point, rather than the controller or the view. In order to use the DB as your test control point.
    
Really, you can do anything, this is just a sample of some common strategies.

Goals
-----

To achieve a goal, you just need to trigger a conversion on the variant you are currently on

    Protean.convert(id, variant, callback);

Test Data Storage
-----------------
By default, Protean stores all test assignment and results in SQLite. Sometimes you want your own control of the storage engine. To do this you need to override a few functions... I'll have more on this later.

Analytics
---------

When you want to measure the result of your test you just need to call:

    Protean.summary(path, function(results){
    
    });
    
and you'll get back something like this:

    [
        { 
            name: 'Sporty Landing Page',
            test: 'landing',
            variant: 'landing/sporty',
            created: '2013-09-17 05:43:00',
            hits: 6398,
            conversions: 93,
            weight: 1,
            confidence: 0.5,
            conversionRate: 0.01
        },
        { 
            name: 'Intellectual Landing Page',
            test: 'landing',
            variant: 'landing/intellectual',
            created: '2013-09-17 05:43:01',
            hits: 7397,
            conversions: 3365,
            weight: 1,
            confidence: 1,
            conversionRate: 0.45 
        },
        { 
            name: 'Outsider Landing Page',
            test: 'landing',
            variant: 'landing/outsider',
            created: '2013-09-17 05:43:01',
            hits: 4887,
            conversions: 947,
            weight: 1,
            confidence: 1,
            conversionRate: 0.19
        }
    ]
    
And you're good to go.

Testing
-------

Run the test harness at the project root with:

    mocha

Enjoy,

-Abbey Hawk Sparrow