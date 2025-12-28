import { CoolController, BaseController } from '@cool-midway/core';
import { IotProductEntity } from '../../entity/product';

/**
 * 在产产品管理
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: IotProductEntity,
})
export class AdminIotProductController extends BaseController {}
