export class LoaderHelper {

    public static loadScript(url: string): Promise<Event> {
        return new Promise((resolve, reject) => {
            if (!document.querySelector("script[src='" + url + "']")) {
                const elem = document.createElement("script");
                elem.addEventListener("load", (ev) => resolve(ev));
                elem.addEventListener("error", (ev) => reject(ev));
                elem.src = url;
                document.head.appendChild(elem);
            }
        });
    }
}
