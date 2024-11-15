interface Options {
    timeOut: number;
    extendedTimeOut: number;
    preventDuplicates: boolean;
};

interface IToastr {
    info(title: string, text?: string, options?: Options): void;
    error(title: string, text?: string, options?: Options): void;
}

declare global {
    interface Window {
        toastr: IToastr;
    }
}

export { }
