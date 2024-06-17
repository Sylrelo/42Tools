import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { ApiKeys } from './api-key.entity';
import dayjs from 'dayjs';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKeys)
    private repo: Repository<ApiKeys>,
  ) {}

  async getAll() {
    return await this.repo.find({ cache: false });
  }

  async getAvailable(): Promise<ApiKeys | null> {
    return await this.repo.findOne({
      where: {
        currentUsage: LessThan(2),
        totalRequestCount: MoreThan(10),
      },
      order: {
        totalRequestCount: 'DESC',
      },
    });
  }

  async getByClientId(clientId: string): Promise<ApiKeys | null> {
    return await this.repo.findOne({
      where: {
        clientId,
        currentUsage: LessThan(2),
      },
    });
  }

  async getAvailableLoginClientId(): Promise<null | string> {
    const result = await this.repo.findOne({
      where: {
        type: 'LOGIN',
        hasError: false,
      },
      select: {
        clientId: true,
      },
      order: {
        totalRequestCount: 'DESC',
      },
    });

    return result?.clientId ?? null;
  }

  async updateTotalRequestCount(key: ApiKeys, count: number) {
    return await this.repo.update({ id: key.id }, { totalRequestCount: count });
  }

  async getTotalKeys() {
    return await this.repo.count({ where: { hasError: false }, cache: { id: 'KEY_COUNT_CACHE', milliseconds: 5000 } });
  }

  async getTotalLeft() {
    return await this.repo.sum('totalRequestCount', { hasError: false });
  }

  async updateUsageCount(key: ApiKeys, i: number) {
    if (i > 0) {
      await this.repo.increment({ clientId: key.clientId }, 'currentUsage', 1);
    } else {
      await this.repo.decrement({ clientId: key.clientId }, 'currentUsage', 1);
    }
  }

  async getNextAvailable(type?: string): Promise<ApiKeys> {
    const result = await this.repo.findOne({
      where: {
        lastUsedAt: LessThan(dayjs().subtract(1500, 'milliseconds').format()),
        totalRequestCount: MoreThan(5),
        currentUsage: LessThan(2),
        hasError: false,
        type: type ?? undefined,
      },
      order: {
        totalRequestCount: 'DESC',
      },
    });

    return result;
  }

  async resetAllCurrentUsage() {
    return await this.repo.update({}, { currentUsage: 0 });
  }

  async updateTokenData(clientId: string, token: string, tokenValidUntil: number | string | Date): Promise<void> {
    await this.repo.update(
      { clientId: clientId },
      {
        token,
        tokenValidUntil,
      },
    );
  }

  async clearTokenData(clientId: string) {
    await this.repo.update(
      { clientId: clientId },
      {
        token: null,
        tokenValidUntil: null,
      },
    );
  }

  async setKeyAsUnusable(clientId: string) {
    await this.repo.update({ clientId }, { hasError: true, currentUsage: 0 });
  }
}
