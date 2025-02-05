import { search } from "@src/frontend/search";
import type { StaticSeekIndex } from "@src/main";
if(window.Worker) {
    onmessage = (ev: MessageEvent<[StaticSeekIndex, string]>) => {
        postMessage(search(ev.data[0], ev.data[1]));
    };    
}
