import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Certificate } from '../models/certificate.model';

@Injectable()
export class CertificateService {
  constructor(@InjectModel(Certificate) private model: typeof Certificate) {}

  async create(data: Partial<Certificate>): Promise<Certificate> {
    return this.model.create(data as any);
  }

  async findAll(): Promise<Certificate[]> {
    return this.model.findAll();
  }

  async findOne(id: number): Promise<Certificate | null> {
    return this.model.findByPk(id);
  }

  async update(id: number, data: Partial<Certificate>): Promise<Certificate | null> {
    const cert = await this.findOne(id);
    if (!cert) return null;
    return cert.update(data as any);
  }

  async remove(id: number): Promise<boolean> {
    const cert = await this.findOne(id);
    if (!cert) return false;
    await cert.destroy();
    return true;
  }
}
