Welcome to jThread!
===================

jThread is designed to be A poor man's Thread for JavaScript. It simplifies async programming in JavaScript by supporting a 'Thread like' code style.

> **Features:**

> - Make async logic more readable and maintainable, avoid the 'Callback Hell'.
> - Provide a mechanism to cancel or restart a process.
> - Provide useful functions that can be put to use immediately.
> [demo & playground][1].

```sequence
Thread->Activity A:
Note over Activity A: processing
Activity A-->Thread: return result!
Note over Thread: flow control logic
Thread->Activity B:
Note over Activity B: processing
Activity B-->Thread: return result!
Note over Thread: return the finial result
``` 

jThread utilizes the 'Thread&Activity' concept to solve the problem with natural JavaScript. It is inspired by the workflow/activity design and has two important Types: Thread and Activity. 

* A Thread mimics the behavior of a thread in languages like Java or C#. While the code has a blocking style, the back-end flow control is implemented with callbacks and is non-blocking.
* Activities are wrappers around the asynchronous functions and only be used inside a thread. You can either create new Activities, then use them like normal functions, or wrap async logic as run-time Activity. 

> **Rules:**

> - Activities can only be used inside a Thread.
> - Only Activities can read/write variables outside the thread.
> - Code inside Activities should not set Thread variables directly, but use the return.


see below example:
``` javascript
//outside
var outSideA = 0;
_(function(){
    //thread logic, don't interact with outside
    var value = 0;  
    value = _(function(){
        //code inside an activity can interact with outside
        //activity can read thread variables and use return to set thread variables.
        outSideA += value;
        return outSideA;
    }); 
    return value; 
},function(ret){ // on thread finishes
    alert(ret); 
}); 
```
# Core Functions
**_(threadLogic,onFinish)**  
Create a Thread and run it immediately
``` javascript
_(function(){
    //main thread logic
   var value = 10;
   value ++;
   return value;
},function(ret){
    alert(ret); 
});  
```
**_.sync(func,async=true)**  
Convert a function to Activity to be reused in thread logic.
``` javascript
// a sample async function
function func1(delay,callback){ 
    setTimeout(function(){ 
        callback();
    , delay);
}
//convert to activity
func1 = _.sync(func1);

//used it in Thread
_(function(){
    func1(1000);
    func1(2000);
    alert('done'); 
},function(){}); 
```
**_.syncThread(threadFunc)**  
Create a thread style Activity. This allows using activity inside activity. Because activities can only be run inside a thread, this function accepts a thread style function instead of a normal javascript function.
``` javascript
var act1 = _.syncThread(function(param1){
    func1(param1);//func1 is an existing Activity
    return 'something';
}); 
//used it in a Thread
_(function(){
    var value;
    value = act1(1000);
    return value; 
},function(){});  
``` 

**_.install(name, func, async=true)**  
Wrap the function as a Activity, and add it to the jThread name space. This function is a equivalent to below
``` javascript
_[name] = _.sync(func, async);
``` 
This is used to add new Activity functions to the jThread.

# Activity functions (can only be used inside a thread)
``` javascript
_(function(){ //this starts a thread
    //only run Activity functions inside a thread
},function(ret){}); 
``` 

**_(activityLogic)**  
Create a runtime Activity in a thread and run it immediately, 
``` javascript
//an Activity with callback
_(function(callback){ 
   setTimeout(function(){
       callback('activity finished');
   },1000);
});  
//an Activity which doesn't need callback
_(function(){  
    var activityValue = 1;
   return activityValue;
});  
```
**_.label(label), _.go(label)**  
Used together to quickly jump to a previous code position. Different to goto in c++, this serves like 'turn back time'. It can only jump backward, and any changes between the label and go will be forget. Use 'while' instead if that is not expected.
```javascript
_.label('start');
//some logic
_.go('start');
```
**_.set(obj,key,value )**   
**_.set(obj,keyValueObj)**   
used to set key-value for an object. Since it's not safe to change outside vairables directly in thread.
```javascript
_.set(someObj,'key','someValue');
//use object
_.set(someObj,{
    key:'someValue'
}); 
//read it
var value = someObj.key;
```

**_.css(selector,key,value )**   
**_.css(selector,keyValueObj)**  
**_.css(selector,key)**  
set or set css for element(s)
```javascript
//set
_.css('#div1','width','200px');
//get
var w = _.css('#div1','width');
```

**_.attr(selector,key,value )**   
**_.attr(selector,keyValueObj)**  
**_.attr(selector,key)**  
set or set attributes for element(s)
```javascript
//set
_.attr('#input1','value','hello');
//get
var w = _.attr('#input1','value');
```

**_.sleep(milliseconds)**    
sleep for the given time  

**_.alert(msg)**    
call window.alert  

**_.prompt(text,defaultText)**  
call window.prompt  

**_.confirm(msg)**  
call window.confirm  



[1]: http://shen.apphb.com/jt/demo/core.html 