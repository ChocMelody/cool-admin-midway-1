import { Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { IotProductionLineEntity } from '../../entity/production_line';
import { IotStationEntity } from '../../entity/station';
import { IotDeviceEntity } from '../../entity/device';
import { IotProductEntity } from '../../entity/product';
import { IotProductionLogEntity } from '../../entity/production_log';

/**
 * IOT 数据模拟控制器
 */
@Provide()
@CoolController('/admin/iot/simulate')
export class AdminIotSimulateController extends BaseController {
  @InjectEntityModel(IotProductionLineEntity)
  iotProductionLineEntity: Repository<IotProductionLineEntity>;

  @InjectEntityModel(IotStationEntity)
  iotStationEntity: Repository<IotStationEntity>;

  @InjectEntityModel(IotDeviceEntity)
  iotDeviceEntity: Repository<IotDeviceEntity>;

  @InjectEntityModel(IotProductEntity)
  iotProductEntity: Repository<IotProductEntity>;

  @InjectEntityModel(IotProductionLogEntity)
  iotProductionLogEntity: Repository<IotProductionLogEntity>;

  /**
   * 生成模拟数据
   */
  async post() {
    // 1. 清理旧数据
    await this.iotProductionLogEntity.clear();
    await this.iotProductEntity.clear();
    await this.iotDeviceEntity.clear();
    await this.iotStationEntity.clear();
    await this.iotProductionLineEntity.clear();

    // 2. 创建产线
    const line = await this.iotProductionLineEntity.save({
      name: '智能装配线 A',
      code: 'LINE-001',
      description: '全自动化智能生产演示线',
    });

    // 3. 创建站点
    const stationsData = [
      { name: '上料工位', orderNum: 1, type: 'FEEDING' },
      { name: '组装工位', orderNum: 2, type: 'ASSEMBLY' },
      { name: '检测工位', orderNum: 3, type: 'TESTING' },
      { name: '包装工位', orderNum: 4, type: 'PACKAGING' },
    ];

    const stations = [];
    for (const s of stationsData) {
      const station = await this.iotStationEntity.save({
        lineId: line.id,
        name: s.name,
        orderNum: s.orderNum,
      });
      stations.push(station);

      // 为每个站点创建设备
      await this.iotDeviceEntity.save({
        stationId: station.id,
        deviceCode: `DEV-${line.code}-${s.orderNum}`,
        mqttTopic: `factory/line1/station${s.orderNum}/data`,
        type: s.type,
      });
    }

    // 4. 创建在产产品 (随机分布)
    const products = [];
    for (let i = 1; i <= 20; i++) {
      // 随机状态：0-生产中，1-完成
      const status = Math.random() > 0.8 ? 1 : 0;
      // 随机当前站点 (如果是完成状态，则无当前站点或在最后)
      const currentStation =
        status === 1
          ? null
          : stations[Math.floor(Math.random() * stations.length)];

      const product = await this.iotProductEntity.save({
        batchNo: `BATCH-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '')}`,
        productCode: `PROD-${10000 + i}`,
        currentStationId: currentStation ? currentStation.id : null,
        status: status,
        startTime: new Date(),
        endTime: status === 1 ? new Date() : null,
      });
      products.push(product);

      // 5. 生成日志
      if (currentStation) {
        await this.iotProductionLogEntity.save({
          productId: product.id,
          stationId: currentStation.id,
          dataPayload: {
            event: 'ENTER_STATION',
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 20,
            timestamp: Date.now(),
          },
        });
      }
    }

    return this.ok({
      msg: '模拟数据生成成功',
      summary: {
        line: 1,
        stations: stations.length,
        products: products.length,
      },
    });
  }
}
