import { Controller, Get } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cursus } from "../entities/cursus";

@Controller("cursus")
export class CursusController {
  constructor(
    @InjectRepository(Cursus)
    private readonly cursusRepository: Repository<Cursus>
  ) { }

  @Get()
  async getCursuses(): Promise<Cursus[]> {
    return await this.cursusRepository.find({ order: { name: 1 } });
  }
}