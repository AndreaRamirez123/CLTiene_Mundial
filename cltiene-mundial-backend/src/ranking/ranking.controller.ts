import { Controller, Get, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  getRanking(@Query('limit') limit?: string) {
    return this.rankingService.getRanking(limit ? parseInt(limit, 10) : 10);
  }
}
