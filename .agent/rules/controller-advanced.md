---
description: 控制器(Controller) - 进阶功能
globs: 
---

通过这一波操作之后，我们的商品接口的功能已经很强大了，除了通用的 CRUD，我们的接口还支持多种方式的数据筛选

### 获得 ctx 对象

```ts
@CoolController(
  {
    api: ['add', 'delete', 'update', 'info', 'list', 'page'],
    entity: DemoAppGoodsEntity,
    // 获得ctx对象
    listQueryOp: ctx => {
      return new Promise<QueryOp>(res => {
        res({
          fieldEq: [],
        });
      });
    },
    // 获得ctx对象
    pageQueryOp: ctx => {
      return new Promise<QueryOp>(res => {
        res({
          fieldEq: [],
        });
      });
    },
  },
  {
    middleware: [],
  }
)
```

### 接口调用

`add` `delete` `update` `info` 等接口可以用法[参照快速开始](mdc:src/guide/quick.html#接口调用)

这里详细说明下`page` `list`两个接口的调用方式，这两个接口调用方式差不多，一个是分页一个是非分页。
以`page`接口为例

#### 分页

POST `/admin/demo/goods/page` 分页数据

**请求**
Url: http://127.0.0.1:8001/admin/demo/goods/page

Method: POST

#### Body

```json
{
  "keyWord": "商品标题", // 模糊搜索，搜索的字段对应keyWordLikeFields
  "type": 1, // 全等于筛选，对应fieldEq
  "page": 2, // 第几页
  "size": 1, // 每页返回个数
  "sort": "desc", // 排序方向
  "order": "id" // 排序字段
}
```

**返回**

```json
{
  "code": 1000,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 4,
        "createTime": "2021-03-12 16:23:46",
        "updateTime": "2021-03-12 16:23:46",
        "title": "这是一个商品2",
        "pic": "https://show.cool-admin.com/uploads/20210311/2e393000-8226-11eb-abcf-fd7ae6caeb70.png",
        "price": "99.00",
        "userId": 1,
        "type": 1,
        "name": "超级管理员"
      }
    ],
    "pagination": {
      "page": 2,
      "size": 1,
      "total": 4
    }
  }
}
```

### 服务注册成 Api

很多情况下，我们在`Controller`层并不想过多地操作，而是想直接调用`Service`层的方法，这个时候我们可以将`Service`层的方法注册成`Api`，那么你的某个`Service`方法就变成了`Api`。

#### 示例：

在 Controller 中

```ts
import { CoolController, BaseController } from "@cool-midway/core";
import { DemoGoodsEntity } from "../../entity/goods";
import { DemoTenantService } from "../../service/tenant";

/**
 * 示例
 */
@CoolController({
  serviceApis: [
    "use",
    {
      method: "test1",
      summary: "不使用多租户", // 接口描述
    },
    "test2", // 也可以不设置summary
  ],
  entity: DemoGoodsEntity,
  service: DemoXxxService,
})
export class AdminDemoTenantController extends BaseController {}
```

在 Service 中

```ts
/**
 * 示例服务
 */
@Provide()
export class DemoXxxService extends BaseService {
  /**
   * 示例方法1
   */
  async test1(params) {
    console.log(params);
    return "test1";
  }

  /**
   * 示例方法2
   */
  async test2() {
    return "test2";
  }
}
```

::: warning 注意
`serviceApis` 注册为`Api`的请求方法是`POST`，所以`Service`层的方法参数需要通过`body`传递
:::

### 重写 CRUD 实现

在实际开发过程中，除了这些通用的接口可以满足大部分的需求，但是也有一些特殊的需求无法满足用户要求，这个时候也可以重写`add` `delete` `update` `info` `list` `page` 的实现

#### 编写 service

在模块新建 service 文件夹(名称非强制性)，再新建一个`service`实现，继承框架的`BaseService`

```ts
import { Inject, Provide } from "@midwayjs/core";
import { BaseService } from "@cool-midway/core";
import { InjectEntityModel } from "@midwayjs/orm";
import { Repository } from "typeorm";
import { BaseSysMenuEntity } from "../../entity/sys/menu";
import * as _ from "lodash";
import { BaseSysPermsService } from "./perms";

/**
 * 菜单
 */
@Provide()
export class BaseSysMenuService extends BaseService {
  @Inject()
  ctx;

  @InjectEntityModel(BaseSysMenuEntity)
  baseSysMenuEntity: Repository<BaseSysMenuEntity>;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  /**
   * 重写list实现
   */
  async list() {
    const menus = await this.getMenus(
      this.ctx.admin.roleIds,
      this.ctx.admin.username === "admin"
    );
    if (!_.isEmpty(menus)) {
      menus.forEach((e) => {
        const parentMenu = menus.filter((m) => {
          e.parentId = parseInt(e.parentId);
          if (e.parentId == m.id) {
            return m.name;
          }
        });
        if (!_.isEmpty(parentMenu)) {
          e.parentName = parentMenu[0].name;
        }
      });
    }
    return menus;
  }
}
```

#### 设置服务实现

`CoolController`设置自己的服务实现

```ts
import { Inject } from "@midwayjs/core";
import { CoolController, BaseController } from "@cool-midway/core";
import { BaseSysMenuEntity } from "../../../entity/sys/menu";
import { BaseSysMenuService } from "../../../service/sys/menu";

/**
 * 菜单
 */
@CoolController({
  api: ["add", "delete", "update", "info", "list", "page"],
  entity: BaseSysMenuEntity,
  service: BaseSysMenuService,
})
export class BaseSysMenuController extends BaseController {
  @Inject()
  baseSysMenuService: BaseSysMenuService;
}
```

## 路由标签

我们经常有这样的需求：给某个请求地址打上标记，如忽略 token，忽略签名等。

```ts
import { Get, Inject } from "@midwayjs/core";
import {
  CoolController,
  BaseController,
  CoolUrlTag,
  TagTypes,
  CoolUrlTagData,
} from "@cool-midway/core";

/**
 * 测试给URL打标签
 */
@CoolController({
  api: [],
  entity: "",
  pageQueryOp: () => {},
})
// add 接口忽略token
@CoolUrlTag({
  key: TagTypes.IGNORE_TOKEN,
  value: ["add"],
})
export class DemoAppTagController extends BaseController {
  @Inject()
  tag: CoolUrlTagData;

  /**
   * 获得标签数据， 如可以标记忽略token的url，然后在中间件判断
   * @returns
   */
  // 这是6.x支持的，可以直接标记这个接口忽略token，更加灵活优雅，但是记得配合@CoolUrlTag()一起使用，也就是Controller上要有这个注解，@CoolTag才会生效
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get("/data")
  async data() {
    return this.ok(this.tag.byKey(TagTypes.IGNORE_TOKEN));
  }
}
```

#### 中间件

```ts
import { CoolUrlTagData, TagTypes } from "@cool-midway/core";
import { IMiddleware } from "@midwayjs/core";
import { Inject, Middleware } from "@midwayjs/core";
import { NextFunction, Context } from "@midwayjs/koa";

@Middleware()
export class DemoMiddleware implements IMiddleware<Context, NextFunction> {
  @Inject()
  tag: CoolUrlTagData;

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const urls = this.tag.byKey(TagTypes.IGNORE_TOKEN);
      console.log("忽略token的URL数组", urls);
      // 这里可以拿到下一个中间件或者控制器的返回值
      const result = await next();
      // 控制器之后执行的逻辑
      // 返回给上一个中间件的结果
      return result;
    };
  }
}
```
