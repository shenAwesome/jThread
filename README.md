# jThread
A poor man's Thread for JavaScript

The goal of jThread is to mimic Thread in JavaScript to replace callback or promises, the benifits are:

* Make async logic more readable and maintainable, avoid the 'Callback Hell'.
* Provide a mechanism to cancel or restart a process.
* Super small size and batteries included. 

demo & playground:

http://shen.apphb.com/jt/demo/core.html 

JThread utilizes the 'Thread&Activity' concept to solve the problem with natural JavaScript. It is inspired by the workflow/activity design and has two important Types: Thread and Activity. 

* A Thread mimics the behaviour of a thread in languages like Java or C#, where you can code in a blocking way. In the background the flow control is implemented with callbacks and non-blocking.
* Activities are wrappers around the asynchronous functions and should only be used inside a thread. You can create new Activities easily to reuse them later, or just wrap any async logic as anonymous Activity in the Thread.

The code is just pure JavaScript with some simple rules:
* Activities can only be used inside a Thread.
* Only Activities can read/write variables outside the thread safely.  
* Code inside Activities should not set Thread variables directly.

see below example:

```

//outside

var outSideA = 0;

_(function(){
    
    //thread logic, don't interact with outside
    var value = 0; 
    
    //activity can interact with outside
    //activity can read thread variables and use return to set thread variables.
    value = _(function(){
        return outSideA;
    }); 
    
    return value; 
},function(ret){ // on thread finishes
    alert(ret); 
}); 

```


