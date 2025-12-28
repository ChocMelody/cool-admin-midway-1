import { Entity, Column } from 'typeorm';
import { BaseEntity, transformerTime } from '../../base/entity/base';

/**
 * 在产产品
 */
@Entity('iot_product')
export class IotProductEntity extends BaseEntity {
  @Column({ comment: '生产批次号' })
  batchNo: string;

  @Column({ comment: '产品唯一码', unique: true })
  productCode: string;

  @Column({ comment: '当前所在站点', nullable: true })
  currentStationId: number;

  @Column({ comment: '状态 0:生产中, 1:完成, 2:异常', default: 0 })
  status: number;

  @Column({
    comment: '开始生产时间',
    type: 'varchar',
    transformer: transformerTime,
    nullable: true,
  })
  startTime: Date;

  @Column({
    comment: '完成时间',
    type: 'varchar',
    transformer: transformerTime,
    nullable: true,
  })
  endTime: Date;
}
