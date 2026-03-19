import { Module, Global } from '@nestjs/common';
import { WipService } from './wip.service';

@Global()
@Module({
  providers: [WipService],
  exports: [WipService],
})
export class WipModule {}
