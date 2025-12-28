import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

/**
 * 生产实时日志
 */
@Entity('iot_production_log')
export class IotProductionLogEntity extends BaseEntity {
  @Column({ comment: '关联产品', nullable: true })
  productId: number;

  @Column({ comment: '关联站点' })
  stationId: number;

  @Column({ comment: '原始采集数据', type: 'json' })
  dataPayload: any;
}
