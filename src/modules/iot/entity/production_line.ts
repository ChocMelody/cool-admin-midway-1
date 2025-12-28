import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

/**
 * 生产线
 */
@Entity('iot_production_line')
export class IotProductionLineEntity extends BaseEntity {
  @Column({ comment: '产线名称' })
  name: string;

  @Column({ comment: '产线编号', unique: true })
  code: string;

  @Column({ comment: '描述', nullable: true, type: 'text' })
  description: string;

  @Column({ comment: '3D场景配置', type: 'json', nullable: true })
  sceneConfig: any;
}
