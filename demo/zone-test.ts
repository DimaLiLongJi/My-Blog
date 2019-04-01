import 'zone.js';

Zone.current.fork({
    name: 'printAsyncTime',
    onInvokeTask(parentDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task, applyThis: any, applyArgs: any[]) {
        let startTime = performance.now(),
            result = parentDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
        console.log(`${task.source} 耗时 ${performance.now() - startTime}ms `, task.data);
        return result;
    }
}).run(Main)

function Main() {
    setTimeout(function whenTimeout() {
        let i = 0;
        while ((i++) < 999999999) { }
    });

    document.addEventListener('click', function whenDocumentClick() {
        let i = 0;
        while ((i++) < 88888888) { }
    });
}