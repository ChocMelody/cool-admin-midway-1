import { CoolController, BaseController } from '@cool-midway/core';
import { IotProductionLogEntity } from '../../entity/production_log';

/**
 * 生产日志管理
 */
@CoolController({
  api: ['delete', 'info', 'list', 'page'],
  entity: IotProductionLogEntity,
})
export class AdminIotProductionLogController extends BaseController {}
