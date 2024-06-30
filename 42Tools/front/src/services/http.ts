import { writable } from "svelte/store";

export const LSK_CLIENTID_LOGIN = "_tmpClientIdFor42Auth";

const API_URL = (() => {
  const hostname = window.location.hostname;

  if (hostname === "localhost") {
    return `http://localhost:3000/api`;
  }

  return `https://${hostname}/api`;
})();

export function getRedirectUri(clientId: string) {
  const hostname = window.location.hostname;

  if (hostname === "localhost") {
    return `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth-redirect&response_type=code`;
  }

  return `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=https%3A%2F%2F42tools.slopez.dev%2Fauth-redirect&response_type=code`;
}

export interface UserSession {
  id: number;
  login: string;
  campusId: number;
  isStaff: boolean;
}
export const userSession = writable<UserSession | null>(null);
export const userError = writable<any | null>(null);

//

async function httpRequest(method: string, endpoint: string, data?: any) {
  try {
    const sessionToken = window.localStorage.getItem("sessionToken");

    let bodyData = undefined;

    if (data) {
      bodyData = JSON.stringify(data);
      console.log(bodyData);
    }

    const response = await fetch(API_URL + endpoint, {
      method: method,
      body: bodyData,
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "content-type": "application/json",
      },
    });

    if (response.status === 401) {
      userError.set(401);
      userSession.set(null);
      throw new Error(response.statusText);
    }

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    userError.set(null);
    const contentType = response.headers.get("content-type")!;

    if (contentType.includes("application/json")) return await response.json();
    else return await response.text();
  } catch (error: any) {
    userSession.set(null);
    userError.set(error?.message);
    window.localStorage.clear();
    throw new Error(error?.message);
  }
}

export async function httpPost(endpoint: string, data?: any) {
  return httpRequest("post", endpoint, data);
}

export async function httpPatch(endpoint: string, id: string | number, data?: any) {
  return httpRequest("PATCH", endpoint + "/" + id, data);
}

export async function httpDelete(endpoint: string, data?: any) {
  return httpRequest("delete", endpoint, data);
}

export async function httpGet<T>(endpoint: string) {
  return httpRequest("get", endpoint);
}

export async function login(code: string): Promise<any> {
  let responseJson: any = {};

  try {
    const clientIdForLogin = window.localStorage.getItem(LSK_CLIENTID_LOGIN);

    const response = await fetch(API_URL + "/users/login", {
      method: "post",
      body: JSON.stringify({ code, clientId: clientIdForLogin }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    responseJson = await response.json();

    if (response.status >= 400) throw new Error(`${response.statusText}: ${responseJson?.message}`);

    return responseJson;
  } catch (error: any) {
    throw new Error(error?.message);
  } finally {
    window.localStorage.removeItem(LSK_CLIENTID_LOGIN);
  }
}
