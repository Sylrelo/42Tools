import { Injectable, Logger } from '@nestjs/common';
import { time } from 'console';
import dayjs from 'dayjs';
import { IAuthorizationCodeResponse, IUser } from 'src/Interfaces/42';
import { ApiKeys } from 'src/modules/api-key/api-key.entity';
import { ApiKeysService } from 'src/modules/api-key/api-key.service';
import { sleep } from 'src/utils';

/*
  This file is a clusterfuck that need a complete redo
*/

interface QueueJob {
  endpoint: string;
  data?: any;
  retries: number;
  promisedUuid: string;
  addedAt: number;
  lastError?: any;
}

interface TokenResponse {
  token: string;
  createdAt: number;
  expiresIn: number;
}

//

export class Promised<T = {}> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (readon?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export class ApiError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class InvalidClientError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class RetryError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

// TODO: LOGIN with new queue system

@Injectable()
export class ApiQueue {
  private API_URI = 'https://api.intra.42.fr';
  private REDIRECT_URI = 'https://42tools.slopez.dev/auth-redirect';

  private promises: Record<string, Promised> = {};
  private jobs: QueueJob[] = [];

  private logger = new Logger('Queue');

  constructor(private readonly apiKeyService: ApiKeysService) {
    console.log('=> ApiQueue INIT');

    if (process.env?.['NODE_ENV'] === 'dev') {
      this.REDIRECT_URI = 'http://localhost:5173/auth-redirect';
    }

    console.log(this.REDIRECT_URI);

    this.apiKeyService.resetAllCurrentUsage();
    setInterval(() => {
      this.handleJobs();
    }, 600);
  }

  async getTotalRequestPossible() {
    return (await this.apiKeyService.getTotalKeys()) * 1200;
  }

  async getRequestCountLeft() {
    return await this.apiKeyService.getTotalLeft();
  }

  async getClientIdApiLogin() {
    return await this.apiKeyService.getAvailableLoginClientId();
  }

  async add<T>(endpoint: string, suplData?: Record<string, any>): Promise<T> {
    const promised = new Promised<T>();
    const promisedUuid = crypto.randomUUID();

    this.promises[promisedUuid] = promised;
    this.jobs.push({
      endpoint,
      data: suplData,
      promisedUuid,
      retries: 0,
      addedAt: Date.now() + (endpoint === '/oauth/token' ? 10000 : 0),
    });

    this.jobs.sort((a, b) => b.addedAt - a.addedAt);

    return this.promises[promisedUuid].promise as T;
  }

  private async getAvailableKey(isLoginKeyRequired: boolean = false): Promise<ApiKeys | null> {
    const key = await this.apiKeyService.getNextAvailable(isLoginKeyRequired ? 'LOGIN' : undefined);

    if (key == null) {
      return null;
    }

    return key;
  }

  private async waitForLoginKey(clientId: string) {
    let timeout = 0;
    while (true) {
      const key = await this.apiKeyService.getByClientId(clientId);

      if (key != null) {
        return key;
      }

      await sleep(500);
      timeout += 500;

      if (timeout >= 15000) {
        break;
      }
    }

    return null;
  }

  private async handleJobs() {
    if (this.jobs.length === 0) return;

    const job = this.jobs.shift();

    const isLoginKeyRequired = job.endpoint === '/oauth/token';

    const key = isLoginKeyRequired ? await this.waitForLoginKey(job.data.clientId) : await this.getAvailableKey();

    if (key == null) {
      this.jobs.push({ ...job });
      return;
    }

    await this.apiKeyService.updateUsageCount(key, +1);

    this.doJob(key, job);
  }

  private async doJob(key: ApiKeys, job: QueueJob) {
    let result: any = undefined;

    try {
      if (job.endpoint === '/oauth/token' && job.data?.body?.code) {
        result = await this.makeLoginRequest(key, job, job.data.body.code);
      } else {
        result = await this.makeRequest(key, job);
      }

      this.promises[job.promisedUuid].resolve(result);
    } catch (error: any) {
      if (error instanceof RetryError) {
        //Skip promise rejection so it can retry automatically
        return;
      }

      this.promises[job.promisedUuid].reject(error?.message ?? error);
    } finally {
      await this.apiKeyService.updateUsageCount(key, -1);
    }

    delete this.promises[job.promisedUuid];
  }

  private async makeLoginRequest(key: ApiKeys, job: QueueJob, code: string): Promise<IUser> {
    console.log(job.endpoint, key.clientId, key.clientSecret, this.REDIRECT_URI);

    try {
      const tokenResponse = await fetch(this.API_URI + job.endpoint, {
        method: 'post',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: key.clientId,
          client_secret: key.clientSecret,
          code,
          redirect_uri: this.REDIRECT_URI,
        }),
      });

      if (tokenResponse.status >= 400) {
        throw new ApiError(await tokenResponse.text());
      }

      const tokenResponseJson: IAuthorizationCodeResponse = await tokenResponse.json();

      const userResponse = await fetch(this.API_URI + '/v2/me', {
        method: 'get',
        headers: {
          Authorization: `Bearer ${tokenResponseJson.access_token}`,
        },
      });

      key.totalRequestCount = parseInt(userResponse.headers.get('x-hourly-ratelimit-remaining') ?? '-1');
      await this.apiKeyService.updateTotalRequestCount(key, key.totalRequestCount);

      if (tokenResponse.status >= 400) {
        throw new ApiError(await userResponse.text());
      }

      return await userResponse.json();
    } catch (error) {
      console.log(error);
      throw new ApiError(error?.message);
    }
  }

  private async makeRequest<T>(key: ApiKeys, job: QueueJob): Promise<T | null> {
    if (job.retries >= 3) {
      if (job.lastError != null) throw job.lastError;
      throw new Error('Unknown error.');
    }

    try {
      await sleep(job.retries * 2500);

      const token = await this.getToken(key);

      const startTime = Date.now();
      const response = await fetch(this.API_URI + job.endpoint, {
        method: 'get',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const endTime = Date.now();

      key.lastUsedAt = new Date();
      key.totalRequestCount = parseInt(response.headers.get('x-hourly-ratelimit-remaining') ?? '1200');

      await this.apiKeyService.updateTotalRequestCount(key, key.totalRequestCount);

      const totalResult = response.headers.get('x-total');
      this.logger.verbose(
        `[${response.status}] ${job.endpoint} (x-total: ${totalResult}) (${key.totalRequestCount}) ${endTime - startTime}ms`,
      );

      if (response.status === 404) {
        throw new ApiError('NOT_FOUND');
      }

      if (response.status === 401) {
        await this.apiKeyService.clearTokenData(key.clientId);
      }

      if (response.status >= 400) {
        throw new ApiError(response.statusText);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError && error.message === 'NOT_FOUND') {
        throw error;
      }

      this.jobs.push({
        ...job,
        retries: job.retries + 1,
        lastError: error,
      });
      this.jobs.sort((a, b) => b.addedAt - a.addedAt);
      // await this.apiKeyService.updateUsageCount(key, -1);

      throw new RetryError();
    }
  }

  private async getToken(key: ApiKeys): Promise<string | null> {
    if (key.token == null || key.tokenValidUntil == null || dayjs(key.tokenValidUntil).diff(undefined, 'seconds') <= 30) {
      let token: TokenResponse = {} as TokenResponse;

      try {
        token = await this.exchangeToken(key.clientId, key.clientSecret);
      } catch (error) {
        console.error('Exchanging token failed.');
        await this.apiKeyService.clearTokenData(key.clientId);

        key.token = null;
        key.tokenValidUntil = null;

        await this.apiKeyService.setKeyAsUnusable(key.clientId);
        throw new InvalidClientError();
      }

      const tokenData = {
        token: token.token,
        tokenCreatedAt: token.createdAt,
        tokenExpiresIn: token.expiresIn,
      };

      key.token = tokenData.token;
      key.tokenValidUntil = dayjs().add(tokenData.tokenExpiresIn, 'seconds').format();

      await this.apiKeyService.updateTokenData(key.clientId, key.token, key.tokenValidUntil);

      return token.token;
    }

    return key.token;
  }

  private async exchangeToken(clientId: string, clientSecret: string): Promise<null | TokenResponse> {
    console.log('Exchanging token');

    if (clientId == null || clientSecret == null) return null;

    const data = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    };

    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'post',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
      },
    });

    if (response.status >= 400) {
      throw new InvalidClientError();
    }

    const jsonResponse: any = await response.json();

    const tokenData = {
      token: jsonResponse['access_token'],
      createdAt: jsonResponse['created_at'],
      expiresIn: jsonResponse['expires_in'],
    };

    return tokenData;
  }
}
