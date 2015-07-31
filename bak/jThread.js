
/*-------------------Document for jsDOC--------------------------------------------------------------------------------------------------*/

/**
* Start a new Thread
* @param {Function} func - contains main thread logic
* @param {Function} onFinish - thread is restarted if the function returns true
* @param {Function=} onStep - called when one activity is finished and thread continues
* @example
* $ = window.jThread; 
* $(function(){ //main logic
*    $.log('start');    
*    return 'done';
* },function(ret){//finish callback
*    alert(ret);
* }); 
* 
*/
function $() { };

/**
* Wrap and start an Activity, should only be used in side a thread
* @param {Function} func - function to be wrapped 
* @example
* $ = window.jThread; 
* $(function(){ //main logic
*    var ret = $(function(){//activity which finishes immediately if no parameter
*       return 'result1';
*    }); 
*    ret = $(function(callback){// real async activity which finishes by calling the callback;
*       setTimeout(function(){
*           callback(ret + ' result2');    
*       },1000); 
*    }); 
*    return ret;
* },function(ret){//finish callback
*    alert(ret);
* }); 
*/
function $() { };














(function () {
    //To pass current thread to all activities inside thread function. It is safe because JavaScript is turn based.
    //The thread is passed to all inner Activities just before they are executed.
    var currentThread;
    //Start a thread
    function run(func, onFinish) {
        var currenFuncHandle = null;
        function next() {
            try {
                currentThread = thread;
                var ret = func.call();
                if (onFinish(ret)) { //check if the flow needs to be repeated 
                    thread.step = 0;
                    thread.act.length = 0;
                    next();
                } else {
                    thread.step = -1;
                }
                thread.onStep(-1);
            } catch (e) {
                if (e === parseInt(e, 10)) {//go to the step if it's a number
                    thread.act.length = e;
                    thread.step = 0;
                    next();
                } else {//an activity is runing, waiting for it
                    if (!e.isHandle) throw e;
                    currenFuncHandle = e;
                    thread.step = 0;
                }
            }
        }
        var thread = {
            onStep: function (step) {
                //console.log(step);
            },
            step: 0,
            act: [],
            next: next,
            ctx: {},
            cancel: function () {//stop the thread and inform the current running function
                currenFuncHandle && currenFuncHandle();
                thread.next = function () { };
                thread.step = -1;
                thread.onStep(-1);
                onFinish();
            }
        };
        setTimeout(next, 1);
        return thread;
    }
    /** convert async function to sync style, to be used in run*/
    function sync(func) {
        return function () {
            var c = currentThread;
            var idx = c.step;
            //to stop this activity from outside, it is also called when activity finishes
            var closeHandle;
            function finish(value) {
                if (c.step == -1) return;//finished already
                if (value === undefined) value = null;
                c.act[idx] = value;
                setTimeout(function () {
                    closeHandle();
                    c.next();
                }, 1);
            }
            finish['ctx'] = c.ctx;
            if (c.act[idx] === undefined) {
                c.onStep(c.step);
                var args = Array.prototype.slice.call(arguments);
                args.push(finish);
                closeHandle = func.apply(c.ctx, args) || function () { };
                //throw the current function handle.
                closeHandle.isHandle = true;
                throw closeHandle;
            } else {
                c.step++;
                return c.act[idx];
            }
        }
    }

    //An adapter for run() and sync(func)(); 



    /**
     * @function myFunction
     * @memberof MyNamespace
     * @static
     */
    function main() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length >= 2) {
            var thread = run(args[0], args[1]);
            if (args.length == 3) {
                thread.onStep = args[2];
            }
            return thread;
        } else {
            var func = args[0];
            if (func.length == 0) {//just normal sync JS code if function has no argument, fill the callback boilerplate
                func = function (callback) {
                    var ret = args[0]();
                    callback(ret);
                }
            }
            sync(func)();
        }
    }

    //Convert a function to sync function. It is added to the global Thread object if name is given
    function addSync(func, name, autoFinish) {
        var func_;
        if (autoFinish) {
            func_ = sync(function () {
                var args = Array.prototype.slice.call(arguments);
                var callback = args.pop();
                func.apply(null, args);
                callback();
            });
        } else {
            func_ = sync(func);
        }

        if (name) main[name] = func_;
        return func;
    }

    main.sync = addSync;

    window.jThread = main;
}());

/**------------------batteries*/

(function () {
    var $ = window.jThread;

    $.sync(function (msg) {
        alert(msg);
    }, 'alert', true);

    $.sync(function (msg) {
        console.log(msg);
    }, 'log', true);

    $.sync(function (ele, html) {
        getEle(ele).innerHTML = html;
    }, 'html', true);

    $.sync(function (time, callback) {
        setTimeout(function () {
            callback();
        }, time);
    }, 'sleep');

    function getEle(ele) {
        if (typeof ele == 'string') {
            ele = document.querySelector(ele);
        }
        return ele;
    }
    //ele,key,value,each or ele,obj,each
    function pairOrObj(args, each) {
        var ele = getEle(arg[0]);
        var obj;
        if (args.length == 3) {//read key value from an object, igrnoe the callback.
            obj = args[1];
        } else {
            obj = {};
            obj[args[1]] = args[2];
        }
        Object.keys(obj).forEach(function (k) {
            each(ele, k, obj[k]);
        });
    }

    $.sync(function (ele, key, value) {
        pairOrObj(arguments, function (ele, k, v) {
            ele.style[k] = obj[k];
        });
        callback();
    }, 'css', true);

    $.sync(function (ele, key, value) {
        pairOrObj(arguments, function (ele, k, v) {
            ele.setAttribute(k, v);
        });
    }, 'attr', true);


    function ajax(url, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                function parse(str) {
                    try { str = JSON.parse(str); } catch (e) { }
                    return str
                }
                callback(xmlhttp.status != 404 ? parse(xmlhttp.responseText) : null);
            }
        }
        xmlhttp.open("GET", url, true);
        setTimeout(function () {
            xmlhttp.send();
        }, 1);
    }

    function getJson(server, data, callback) {
        if (arguments.length == 2) {
            callback = data; data = {};
        }
        var jsonpCallback = data.callback;
        var params = [],
            k;
        for (k in data) {
            params.push(k + '=' + encodeURI(data[k]));
        }
        var url = server + '?' + params.join('&');
        if (jsonpCallback) {
            var script = document.createElement('script');
            script.src = url;
            window[jsonpCallback] = callback;
            document.body.appendChild(script);
        } else {
            ajax(url, callback);
        }
    }

    $.sync(ajax, 'ajax');
    $.sync(getJson, 'getJson');

}());