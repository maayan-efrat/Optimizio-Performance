import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Scans Integration Tests', () => {
  let app: INestApplication;
  let projectId: string;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login first
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    authToken = loginRes.body.token;

    // Create a project
    const projectRes = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Website',
        domain: 'https://example.com',
      });
    projectId = projectRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /scans', () => {
    it('should create a scan', () => {
      return request(app.getHttpServer())
        .post('/api/scans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          url: 'https://example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.overallScore).toBeGreaterThanOrEqual(0);
          expect(res.body.overallScore).toBeLessThanOrEqual(100);
          expect(res.body.aiSummary).toBeDefined();
          expect(res.body.priorityRoadmap).toBeDefined();
          expect(Array.isArray(res.body.priorityRoadmap)).toBe(true);
        });
    });

    it('should reject invalid URL', () => {
      return request(app.getHttpServer())
        .post('/api/scans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          url: 'not-a-url',
        })
        .expect(400);
    });
  });

  describe('GET /scans/:id', () => {
    let scanId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/scans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          url: 'https://example.com',
        });
      scanId = res.body.id;
    });

    it('should retrieve a scan', () => {
      return request(app.getHttpServer())
        .get(`/api/scans/${scanId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(scanId);
          expect(res.body.status).toBe('completed');
        });
    });
  });

  describe('GET /scans/project/:projectId', () => {
    it('should list scans for a project', () => {
      return request(app.getHttpServer())
        .get(`/api/scans/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });
});
