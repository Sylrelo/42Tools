export async function sleep(time: number): Promise<void> {

    return new Promise((resolve, _) => {
        setTimeout(() => {
            resolve()
        }, time);
    })
}