Use a configurable logger instead of console.log
Extend support for non express servers
Write comprehensive test
Update Readme
In readme mention that CronManager cannot work without workerManager being started because all crons run in a worker env or look for a way to get them to work independently
Seperate the logic for bullboard from the workerManager class to make things cleaner