import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceListController } from './workspace-list.controller';
import { WorkspaceListService } from './workspace-list.service';

describe('WorkspaceListController', () => {
  let controller: WorkspaceListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceListController],
      providers: [WorkspaceListService],
    }).compile();

    controller = module.get<WorkspaceListController>(WorkspaceListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
