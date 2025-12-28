import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

/**
 * 工序站点
 */
@Entity('iot_station')
export class IotStationEntity extends BaseEntity {
  @Column({ comment: '关联产线 ID' })
  lineId: number;

  @Column({ comment: '站点名称' })
  name: string;

  @Column({ comment: '工序顺序', default: 0 })
  orderNum: number;

  @Column({ comment: '3D世界坐标 {x, y, z}', type: 'json', nullable: true })
  position: any;

  @Column({ comment: '站点对应的3D模型资源', nullable: true })
  modelAsset: string;
}
