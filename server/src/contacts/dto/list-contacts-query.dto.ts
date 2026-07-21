import { IsIn } from 'class-validator';

export class ListContactsQueryDto {
  @IsIn(['accepted', 'pending'])
  status: 'accepted' | 'pending';
}
