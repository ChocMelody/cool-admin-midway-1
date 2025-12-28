import { CoolController, BaseController } from '@cool-midway/core';
import { IotDeviceEntity } from '../../entity/device';

/**
 * 物联网设备管理
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IotDeviceEntity,
})
export class AdminIotDeviceController extends BaseController {}
