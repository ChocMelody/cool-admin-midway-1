import { CoolController, BaseController } from '@cool-midway/core';
import { IotProductionLineEntity } from '../../entity/production_line';

/**
 * 生产线管理
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IotProductionLineEntity,
})
export class AdminIotProductionLineController extends BaseController {}
