import { PartialType } from '@nestjs/swagger';
import { CreateListItemDto } from './create-list-item.dto';

export class UpdateListItemDto extends PartialType(CreateListItemDto) {}
