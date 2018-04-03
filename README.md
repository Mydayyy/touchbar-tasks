Touchbar-Tasks
=====================

> See and run npm and grunt tasks on your touchbar.

This packages displays all NPM and Grunt tasks from your currently active project
on your touchbar. You are able to run the task by tapping on it. If you tap on
an already running task it will abort. Currently there can only be one task running
at a time.

Installation
------------
You can install this plugin either via cli or via the atom integrated package manager.

##### CLI:
```
apm install touchbar-tasks
```

##### Package Manager:
    - Go to your atom settings
    - Go to install
    - Search for "touchbar-tasks"
    - Install by clicking on install

Contribute
----------

- Source Code: [github.com/mydayyy/touchbar-tasks](https://github.com/Mydayyy/touchbar-tasks)

You can easily contribute new taskrunners. All currently available taskrunners are under lib/TaskCollectors/<Name>.
All that is needed to implement e.g gulp or a different taskrunner is to create a new plugin here, which inerhits from AbstractTaskRunner inside AbstractPlugin.js

License
-------

The project is licensed under the MIT license.
