import { writable } from "svelte/store";

export const currentLocation = writable<Record<string, any>>({});
