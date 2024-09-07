export async function sleep(time: number): Promise<void> {

    return new Promise((resolve, _) => {
        setTimeout(() => {
            resolve()
        }, time);
    })
}

export function DateForDb(inputDate?: Date | string | number) {
    if (inputDate == null) {
        return null;
    }

    //TODO
    return inputDate;
}
