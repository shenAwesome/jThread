# jThread
A poor man's Thread for JavaScript

The goal of jThread is to mimic the JAVA Thread in JavaScript to solve the 'Callback Hell' problem. In the Web page development, there are mainly 2 types of async logic: Ajax call or UI logic needs user interaction. 
With callbacks, the code is often tightly coupled, the callback chain can be different to understand or debug. jThread utilizes the 'Thread&Activity' concept to solve the problem. It is inspired by the workflow/activity design..

When coding with jThread, There are two important Type: Thread and Activity. A Thread mimics the behaviour of a thread in languages like Java or C#, where you can code in a blocking style without callbacks. 
Activities should only be used inside a thread. They are wrappers around the asynchronous functions. You can create new Activities easily to reuse them later, or just wrap any async logic as anonymous Activity in the Thread.

Rule of thumb:
* Only use Activities inside a Thread.
* Only Activities can interact with variables outside the thread safely. Use existing Activities or wrap the logic in an Activity. 
* An async function needs to have callback as the last parameter when wrapped as Activity. Callback(value) becomes the return value of the Activity.
* You can create new Activities to reuse them later.

Imaging this requirement :  

* ajax call to a server 
* display return json on the page
* user select some items

Without using callbacks, below is the implementation in jThread.

```javascript
var $ = window.jThread; 
//With 2 functions as parameter, a Thread is  started.
$(function () {
	//built in functions(Activities),safe to use inside Thread
	$.log('start');
	$.sleep(1000);
	var repos = $.getJson('https://api.github.com/users/shenAwesome/repos');
	$.log(repos);
	//with 1 function as parameter, an Activity is executed.
	//When interacting with the 'outside world', wrap logic as an activity
	$(function () {
		var html = repos.map(function (repo) {
			return '<label><input type="checkbox" />' + repo.name + '</label></br>';
		}).join(' ');
		document.querySelector('#div1').innerHTML = html;
	});
	//when the button clicked, this activity finishes
	$(function (finish) {
		var btn = document.createElement('button');
		btn.innerHTML = "Click ME";
		document.querySelector('#div1').appendChild(btn);
		btn.onclick = finish;
	});
	//now the Thread is finished as the function is done.
	return "all done";
}, function (ret) {//called when the thread finishes
	alert(ret);
});
```