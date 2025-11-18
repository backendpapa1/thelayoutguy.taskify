import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceListService } from './workspace-list.service';

describe('WorkspaceListService', () => {
  let service: WorkspaceListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceListService],
    }).compile();

    service = module.get<WorkspaceListService>(WorkspaceListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
