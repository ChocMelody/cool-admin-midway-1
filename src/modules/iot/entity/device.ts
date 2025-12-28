import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../base/entity/base';

/**
 * 物联网设备
 */
@Entity('iot_device')
export class IotDeviceEntity extends BaseEntity {
  @Column({ comment: '关联站点 ID' })
  stationId: number;

  @Column({ comment: '设备编号' })
  deviceCode: string;

  @Column({ comment: '监听的 MQTT Topic' })
  mqttTopic: string;

  @Column({ comment: '设备类型' })
  type: string;
}
