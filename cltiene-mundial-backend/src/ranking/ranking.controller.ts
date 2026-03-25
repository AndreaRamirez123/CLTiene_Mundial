import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('ranking')
@UseGuards(AuthGuard)
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  getRanking(@Request() req: any, @Query('limit') limit?: string) {
    return this.rankingService.getRanking(
      req.jugador.empresa_id,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
