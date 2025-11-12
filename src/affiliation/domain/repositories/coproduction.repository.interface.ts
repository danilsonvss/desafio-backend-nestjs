import { CoproductionEntity } from '../entities/coproduction.entity';

export interface ICoproductionRepository {
  create(coproduction: CoproductionEntity): Promise<CoproductionEntity>;
  findByProducerAndCoproducer(producerId: string, coproducerId: string): Promise<CoproductionEntity | null>;
  findById(id: string): Promise<CoproductionEntity | null>;
  findByProducer(producerId: string): Promise<CoproductionEntity[]>;
  findByCoproducer(coproducerId: string): Promise<CoproductionEntity[]>;
  update(coproduction: CoproductionEntity): Promise<CoproductionEntity>;
  delete(id: string): Promise<void>;
  existsByProducerAndCoproducer(producerId: string, coproducerId: string): Promise<boolean>;
}

