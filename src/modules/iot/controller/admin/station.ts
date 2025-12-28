import { CoolController, BaseController } from '@cool-midway/core';
import { IotStationEntity } from '../../entity/station';

/**
 * 工序站点管理
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IotStationEntity,
})
export class AdminIotStationController extends BaseController {}
