import {
  Init,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
  Autoload,
} from '@midwayjs/core';
import { WebSocketServer, WebSocket } from 'ws';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { IotProductEntity } from '../entity/product';
import { IotStationEntity } from '../entity/station';

@Autoload()
@Provide()
@Scope(ScopeEnum.Singleton)
export class IoTProcessSocketService {
  @InjectEntityModel(IotProductEntity)
  productRepo: Repository<IotProductEntity>;

  @InjectEntityModel(IotStationEntity)
  stationRepo: Repository<IotStationEntity>;

  private wss: WebSocketServer;
  private intervalId: NodeJS.Timeout;

  @Init()
  async init() {
    this.wss = new WebSocketServer({ port: 8002 });

    this.wss.on('connection', async ws => {
      console.log('Client connected to IoT WebSocket');
      // 立即发送当前站点和产品数据给新连接的客户端
      await this.sendInitialData(ws);
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    console.log('IoT WebSocket Server started on port 8002');
    // 确保有模拟数据
    await this.ensureSimulationData();
    this.startSimulation();
  }

  /**
   * 确保数据库中有足够的模拟数据用于演示
   */
  async ensureSimulationData() {
    try {
      let stations = await this.stationRepo.find({
        order: { orderNum: 'ASC' },
      });

      // 如果站点少于5个，创建缺失的站点
      if (stations.length < 5) {
        console.log(`Found ${stations.length} stations, creating more...`);
        const existingIds = new Set(stations.map(s => s.orderNum));

        for (let i = 1; i <= 5; i++) {
          if (!existingIds.has(i)) {
            const station = this.stationRepo.create({
              lineId: 1,
              name: `工序${i}`,
              orderNum: i,
              position: { x: (i - 1) * 5 - 10, y: 0, z: 0 },
            });
            await this.stationRepo.save(station);
            console.log(`Created station: 工序${i}`);
          }
        }
        stations = await this.stationRepo.find({ order: { orderNum: 'ASC' } });
        console.log(`Now have ${stations.length} stations`);
      } else {
        console.log(
          `Found ${stations.length} stations, no need to create more`
        );
      }

      let products = await this.productRepo.find();

      // 如果产品少于3个，创建缺失的产品
      if (products.length < 3) {
        console.log(`Found ${products.length} products, creating more...`);
        const needed = 3 - products.length;

        for (let i = 1; i <= needed; i++) {
          const product = this.productRepo.create({
            batchNo: `BATCH-SIM-${Date.now()}-${i}`,
            productCode: `PROD-SIM-${Date.now()}-${i}`,
            currentStationId: stations[0]?.id || 1,
            status: 0,
            startTime: new Date(),
          });
          await this.productRepo.save(product);
          console.log(`Created product: ${product.productCode}`);
        }
        products = await this.productRepo.find();
        console.log(`Now have ${products.length} products`);
      } else {
        console.log(
          `Found ${products.length} products, no need to create more`
        );
      }
    } catch (err) {
      console.error('Error ensuring simulation data:', err);
    }
  }

  /**
   * 发送初始数据给新连接的客户端
   */
  async sendInitialData(ws: WebSocket) {
    try {
      const stations = await this.stationRepo.find();
      const products = await this.productRepo.find();
      const data = JSON.stringify({ type: 'init', stations, products });
      ws.send(data);
    } catch (err) {
      console.error('Error sending initial data:', err);
    }
  }

  startSimulation() {
    this.intervalId = setInterval(async () => {
      await this.simulateProduction();
      this.broadcastUpdate();
    }, 2000);
  }

  async stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.wss) {
      this.wss.close();
    }
  }

  async simulateProduction() {
    try {
      const stations = await this.stationRepo.find({
        order: { orderNum: 'ASC' },
      });
      const products = await this.productRepo.find();

      if (stations.length === 0 || products.length === 0) {
        return;
      }

      // 模拟产品按顺序移动到下一个工序
      for (const product of products) {
        const currentIndex = stations.findIndex(
          s => s.id === product.currentStationId
        );
        const nextIndex = (currentIndex + 1) % stations.length;
        product.currentStationId = stations[nextIndex].id;
        await this.productRepo.save(product);
      }
    } catch (err) {
      console.error('Error in simulation:', err);
    }
  }

  async broadcastUpdate() {
    try {
      const stations = await this.stationRepo.find();
      const products = await this.productRepo.find();
      const data = JSON.stringify({ type: 'update', stations, products });

      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    } catch (err) {
      console.error('Error broadcasting:', err);
    }
  }
}
