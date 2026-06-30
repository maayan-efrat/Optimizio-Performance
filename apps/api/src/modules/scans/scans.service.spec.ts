import { Test, TestingModule } from '@nestjs/testing';
import { ScansService } from './scans.service';
import { ScanEngineService } from '../../integrations/scan-engine.service';

describe('ScansService', () => {
  let service: ScansService;
  let scanEngine: ScanEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScansService, ScanEngineService],
    }).compile();

    service = module.get<ScansService>(ScansService);
    scanEngine = module.get<ScanEngineService>(ScanEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a scan and return results', async () => {
      const dto = {
        projectId: 'project_1',
        url: 'https://example.com',
      };

      const result = await service.create(dto);

      expect(result.id).toBeDefined();
      expect(result.projectId).toBe(dto.projectId);
      expect(result.url).toBe(dto.url);
      expect(result.status).toBe('completed');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.aiSummary).toBeDefined();
    });
  });

  describe('get', () => {
    it('should retrieve a scan by id', async () => {
      const dto = {
        projectId: 'project_1',
        url: 'https://example.com',
      };

      const created = await service.create(dto);
      const retrieved = service.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });
  });

  describe('listByProject', () => {
    it('should list scans by project', async () => {
      const projectId = 'project_1';
      const dto = { projectId, url: 'https://example.com' };

      await service.create(dto);
      const list = service.listByProject(projectId);

      expect(list.length).toBeGreaterThan(0);
      expect(list[0].projectId).toBe(projectId);
    });
  });
});
