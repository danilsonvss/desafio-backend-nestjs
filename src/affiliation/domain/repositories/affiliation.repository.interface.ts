import { AffiliationEntity } from '../entities/affiliation.entity';

export interface IAffiliationRepository {
  create(affiliation: AffiliationEntity): Promise<AffiliationEntity>;
  findByProducerAndAffiliate(producerId: string, affiliateId: string): Promise<AffiliationEntity | null>;
  findById(id: string): Promise<AffiliationEntity | null>;
  findByProducer(producerId: string): Promise<AffiliationEntity[]>;
  findByAffiliate(affiliateId: string): Promise<AffiliationEntity[]>;
  update(affiliation: AffiliationEntity): Promise<AffiliationEntity>;
  delete(id: string): Promise<void>;
  existsByProducerAndAffiliate(producerId: string, affiliateId: string): Promise<boolean>;
}

