import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Certificate } from '../models/certificate.model';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';

@Module({
  imports: [SequelizeModule.forFeature([Certificate])],
  controllers: [CertificateController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
